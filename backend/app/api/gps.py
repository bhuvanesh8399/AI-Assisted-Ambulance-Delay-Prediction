from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.db.models import Trip, GPSPoint
from app.schemas import GPSUpdateReq, GPSUpdateRes

router = APIRouter(prefix="/api/gps", tags=["gps"])

@router.post("/update", response_model=GPSUpdateRes)
def gps_update(payload: GPSUpdateReq, db: Session = Depends(get_db)):
    # O(1) trip lookup
    trip = db.get(Trip, payload.trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip.status != "active":
        raise HTTPException(status_code=409, detail="Trip is not active (stopped)")

    ts = payload.timestamp or datetime.utcnow()

    # O(1) insert GPS point
    point = GPSPoint(
        trip_id=payload.trip_id,
        lat=payload.lat,
        lon=payload.lon,
        timestamp=ts,
        seq=None,  # optional; can be added later if client sends it
    )
    db.add(point)

    # O(1) update Trip last_* (this is the key to cheap latest_gps)
    trip.last_lat = payload.lat
    trip.last_lon = payload.lon
    trip.last_ts = ts
    db.add(trip)

    db.commit()
    return {"ok": True}
