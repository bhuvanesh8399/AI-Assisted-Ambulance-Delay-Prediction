from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import desc
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import GPSPoint, Trip, TripStatus
from ..schemas import HospitalActiveTripItem, HospitalActiveTripsOut, LatestGPS
from ..services.snapshot import get_prediction_stub

router = APIRouter(prefix="/api/hospital", tags=["hospital"])


@router.get("/{hospital_id}/active-trips", response_model=HospitalActiveTripsOut)
def hospital_active_trips(hospital_id: str, db: Session = Depends(get_db)):
    # NON-NEGOTIABLE VISIBILITY RULE:
    # destination_hospital_id == hospital_id AND status IN (EN_ROUTE, NEAR_ARRIVAL)
    trips = (
        db.query(Trip)
        .filter(
            Trip.destination_hospital_id == hospital_id,
            Trip.status.in_([TripStatus.EN_ROUTE, TripStatus.NEAR_ARRIVAL]),
        )
        .order_by(desc(Trip.updated_at))
        .all()
    )

    items = []
    for t in trips:
        gp = (
            db.query(GPSPoint)
            .filter(GPSPoint.trip_id == t.trip_id)
            .order_by(desc(GPSPoint.recorded_at))
            .first()
        )
        if gp:
            latest = LatestGPS(
                lat=gp.lat,
                lon=gp.lon,
                recorded_at=gp.recorded_at,
                speed_mps=float(gp.speed_mps or 0.0),
            )
            last_time = gp.recorded_at
        else:
            latest = LatestGPS()  # safe defaults
            last_time = t.updated_at or datetime.utcnow()

        eta_final, risk = get_prediction_stub(db, t)

        items.append(
            HospitalActiveTripItem(
                trip_id=t.trip_id,
                ambulance_id=t.ambulance_id,
                status=t.status.value,
                latest_gps=latest,
                last_update_time=last_time,
                eta_final_seconds=int(eta_final),
                risk_level=str(risk),
            )
        )

    return HospitalActiveTripsOut(hospital_id=hospital_id, trips=items)
