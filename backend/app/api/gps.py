from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import GPSPoint, Trip, TripStatus
from ..schemas import GPSUpdateIn, GPSUpdateOut
from ..services.geo import haversine_m

router = APIRouter(prefix="/api/gps", tags=["gps"])

# Tunable thresholds
NEAR_ARRIVAL_METERS = 300.0
LOW_SPEED_MPS = 2.0  # optional rule if speed provided


@router.post("/update", response_model=GPSUpdateOut)
def gps_update(payload: GPSUpdateIn, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.trip_id == payload.trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="trip_not_found")

    if trip.status in (TripStatus.ARRIVED, TripStatus.STOPPED):
        raise HTTPException(status_code=409, detail="trip_not_active")

    ts = payload.timestamp or datetime.utcnow()

    point = GPSPoint(
        trip_id=payload.trip_id,
        lat=payload.lat,
        lon=payload.lon,
        speed_mps=payload.speed_mps,
        recorded_at=ts,
    )
    db.add(point)

    # Update freshness timestamp
    trip.updated_at = datetime.utcnow()

    # Optional: auto NEAR_ARRIVAL if destination coordinates exist
    if trip.dest_lat is not None and trip.dest_lon is not None:
        d = haversine_m(payload.lat, payload.lon, float(trip.dest_lat), float(trip.dest_lon))
        if d <= NEAR_ARRIVAL_METERS and trip.status == TripStatus.EN_ROUTE:
            trip.status = TripStatus.NEAR_ARRIVAL

        # Optional: auto ARRIVED if very close AND speed low (if speed known)
        if d <= 50.0 and payload.speed_mps is not None and float(payload.speed_mps) <= LOW_SPEED_MPS:
            trip.status = TripStatus.ARRIVED
            trip.arrived_at = datetime.utcnow()

    db.commit()
    db.refresh(trip)

    return GPSUpdateOut(trip_id=trip.trip_id, status=trip.status.value, updated_at=trip.updated_at)
