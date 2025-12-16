from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.db.models import Trip, GPSPoint
from app.schemas import TripStartReq, TripStartRes, TripStopReq, TripStopRes, LatestGPSRes

router = APIRouter(prefix="/api/trip", tags=["trip"])

@router.post("/start", response_model=TripStartRes)
def start_trip(payload: TripStartReq, db: Session = Depends(get_db)):
    trip = Trip(
        ambulance_id=payload.ambulance_id,
        hospital_id=payload.hospital_id,
        start_lat=payload.start_lat,
        start_lon=payload.start_lon,
        status="active",
        started_at=datetime.utcnow(),
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return {"trip_id": trip.id, "started_at": trip.started_at}

@router.post("/stop", response_model=TripStopRes)
def stop_trip(payload: TripStopReq, db: Session = Depends(get_db)):
    trip = db.get(Trip, payload.trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip.status != "active":
        # idempotent-ish behavior: return current stopped_at if already stopped
        if trip.stopped_at:
            return {"trip_id": trip.id, "stopped_at": trip.stopped_at}
        raise HTTPException(status_code=409, detail="Trip is not active")

    trip.status = "stopped"
    trip.stopped_at = datetime.utcnow()
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return {"trip_id": trip.id, "stopped_at": trip.stopped_at}

@router.get("/latest_gps", response_model=LatestGPSRes)
def latest_gps(trip_id: str, db: Session = Depends(get_db)):
    trip = db.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # O(1) path: served from Trip.last_* fields (updated on every gps/update)
    if trip.last_lat is not None and trip.last_lon is not None and trip.last_ts is not None:
        return {"trip_id": trip.id, "lat": trip.last_lat, "lon": trip.last_lon, "timestamp": trip.last_ts}

    # Fallback (still fast due to index ix_gps_trip_ts_desc)
    row = (
        db.query(GPSPoint)
        .filter(GPSPoint.trip_id == trip_id)
        .order_by(GPSPoint.timestamp.desc())
        .limit(1)
        .one_or_none()
    )
    if not row:
        raise HTTPException(status_code=404, detail="No GPS points for this trip yet")

    return {"trip_id": trip_id, "lat": row.lat, "lon": row.lon, "timestamp": row.timestamp}
