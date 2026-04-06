from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import GPSPoint, Trip, TripStatus
from app.schemas.dashboard import HospitalDashboardResponse, TrafficDashboardResponse
from app.services.corridor_service import build_corridor_windows_for_trip
from app.services.dashboard_service import build_hospital_dashboard, build_traffic_dashboard
from app.services.eta_service import compute_trip_eta

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


# TODO: Replace these with your real Section 3/4 services or DB queries
def get_latest_prediction(trip_id: str):
    """
    Expected return shape:
    {
      "eta_final_sec": 820,
      "eta_baseline_sec": 760,
      "delay_pred_sec": 60,
      "delay_risk": "medium"
    }
    """
    raise NotImplementedError("Wire to your prediction store/service")


def get_latest_corridor_plan(trip_id: str):
    """
    Expected return: list of junction dicts:
    [
      {"name":"J1","lat":12.97,"lon":77.59,"priority":"high","window_start":dt,"window_end":dt},
      ...
    ]
    """
    raise NotImplementedError("Wire to your corridor store/service")


@router.get("/hospital/{trip_id}", response_model=HospitalDashboardResponse)
def hospital_dashboard(trip_id: str):
    try:
        p = get_latest_prediction(trip_id)
    except NotImplementedError:
        # Safe fallback for demo/dev so frontend doesn’t break
        p = {"eta_final_sec": 900, "eta_baseline_sec": 900, "delay_pred_sec": 0, "delay_risk": "low"}

    if not p or "eta_final_sec" not in p:
        raise HTTPException(status_code=404, detail="No prediction found for trip_id")

    payload = build_hospital_dashboard(
        trip_id,
        eta_final_sec=p["eta_final_sec"],
        eta_baseline_sec=p.get("eta_baseline_sec"),
        delay_pred_sec=p.get("delay_pred_sec"),
        delay_risk=p.get("delay_risk", "low"),
    )

    try:
        from app.realtime.publish import publish_trip_update

        publish_trip_update(trip_id, {"type": "hospital_dashboard", "data": payload.dict()})
    except Exception:
        pass

    return payload


@router.get("/traffic/{trip_id}", response_model=TrafficDashboardResponse)
def traffic_dashboard(trip_id: str):
    try:
        p = get_latest_prediction(trip_id)
    except NotImplementedError:
        p = {"eta_final_sec": 900, "delay_risk": "low"}

    try:
        corridor = get_latest_corridor_plan(trip_id)
    except NotImplementedError:
        corridor = []

    if not p or "eta_final_sec" not in p:
        raise HTTPException(status_code=404, detail="No prediction found for trip_id")

    payload = build_traffic_dashboard(
        trip_id,
        eta_final_sec=p["eta_final_sec"],
        delay_risk=p.get("delay_risk", "low"),
        junctions=corridor or [],
    )

    try:
        from app.realtime.publish import publish_trip_update

        publish_trip_update(trip_id, {"type": "traffic_dashboard", "data": payload.dict()})
    except Exception:
        pass

    return payload


@router.get("/summary")
def dashboard_summary(
    hospital_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> dict:
    query = db.query(Trip).filter(Trip.status.in_([TripStatus.EN_ROUTE, TripStatus.NEAR_ARRIVAL, TripStatus.ARRIVED]))
    if hospital_id:
        query = query.filter(Trip.destination_hospital_id == hospital_id)

    trips = query.order_by(Trip.updated_at.desc()).all()
    items = []
    for trip in trips:
        latest = (
            db.query(GPSPoint)
            .filter(GPSPoint.trip_id == trip.trip_id)
            .order_by(GPSPoint.recorded_at.desc())
            .first()
        )
        speed_kmph = float(latest.speed_mps * 3.6) if latest and latest.speed_mps is not None else None
        eta = compute_trip_eta(trip, speed_kmph=speed_kmph)
        corridor = build_corridor_windows_for_trip(trip, eta.eta_final_seconds)
        items.append(
            {
                "trip_id": trip.trip_id,
                "status": trip.status.value,
                "destination_hospital_id": trip.destination_hospital_id,
                "eta_final_seconds": eta.eta_final_seconds,
                "predicted_delay_seconds": eta.predicted_delay_seconds,
                "risk_level": eta.risk_level,
                "last_update_at": trip.updated_at,
                "corridor_windows": [window.model_dump(mode="json") for window in corridor],
            }
        )

    return {"items": items, "count": len(items)}
