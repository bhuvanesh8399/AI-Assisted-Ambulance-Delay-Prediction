from fastapi import APIRouter, HTTPException
from app.schemas.dashboard import HospitalDashboardResponse, TrafficDashboardResponse
from app.services.dashboard_service import build_hospital_dashboard, build_traffic_dashboard

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

    return build_hospital_dashboard(
        trip_id,
        eta_final_sec=p["eta_final_sec"],
        eta_baseline_sec=p.get("eta_baseline_sec"),
        delay_pred_sec=p.get("delay_pred_sec"),
        delay_risk=p.get("delay_risk", "low"),
    )


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

    return build_traffic_dashboard(
        trip_id,
        eta_final_sec=p["eta_final_sec"],
        delay_risk=p.get("delay_risk", "low"),
        junctions=corridor or [],
    )
