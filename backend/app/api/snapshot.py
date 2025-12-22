from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Trip
from ..schemas import CorridorSummary, LatestGPS, TripSnapshotOut
from ..services.snapshot import get_acks, get_corridor_stub, get_latest_gps, get_prediction_stub

router = APIRouter(prefix="/api/trip", tags=["snapshot"])


@router.get("/{trip_id}/snapshot", response_model=TripSnapshotOut)
def trip_snapshot(trip_id: str, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="trip_not_found")

    lat, lon, gps_at, speed = get_latest_gps(db, trip_id)
    eta_final, risk = get_prediction_stub(db, trip)
    corridor_obj = get_corridor_stub(db, trip)
    acks = get_acks(db, trip_id)

    # NEVER return nulls: safe fallback objects always
    latest_gps = LatestGPS(lat=lat, lon=lon, recorded_at=gps_at, speed_mps=speed)
    corridor = CorridorSummary(
        ok=bool(corridor_obj.get("ok", False)),
        reason=str(corridor_obj.get("reason", "corridor_not_generated")),
        junctions=list(corridor_obj.get("junctions", [])),
    )

    return TripSnapshotOut(
        trip_id=trip.trip_id,
        ambulance_id=trip.ambulance_id,
        destination_hospital_id=trip.destination_hospital_id,
        status=trip.status.value,
        latest_gps=latest_gps,
        last_gps_at=gps_at,
        last_update_at=trip.updated_at or datetime.utcnow(),
        eta_final_seconds=int(eta_final),
        risk_level=str(risk),
        corridor=corridor,
        acks=acks,
    )
