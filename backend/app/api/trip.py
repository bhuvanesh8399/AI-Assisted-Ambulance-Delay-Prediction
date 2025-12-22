from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Trip, TripAck, TripStatus
from ..schemas import (
    AckIn,
    AckOut,
    DestinationUpdateIn,
    TripArriveOut,
    TripStartIn,
    TripStartOut,
)

router = APIRouter(prefix="/api/trip", tags=["trip"])


@router.post("/start", response_model=TripStartOut)
def start_trip(payload: TripStartIn, db: Session = Depends(get_db)):
    trip_id = str(uuid.uuid4())
    now = datetime.utcnow()

    trip = Trip(
        trip_id=trip_id,
        ambulance_id=payload.ambulance_id,
        destination_hospital_id=payload.destination_hospital_id,
        status=TripStatus.EN_ROUTE,
        started_at=now,
        updated_at=now,
        dest_lat=payload.dest_lat,
        dest_lon=payload.dest_lon,
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)

    return TripStartOut(trip_id=trip.trip_id, started_at=trip.started_at)


@router.patch("/{trip_id}/destination")
def update_destination(trip_id: str, payload: DestinationUpdateIn, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="trip_not_found")

    # Preserve same trip_id; visibility updates naturally via filters.
    trip.destination_hospital_id = payload.destination_hospital_id
    if payload.dest_lat is not None:
        trip.dest_lat = payload.dest_lat
    if payload.dest_lon is not None:
        trip.dest_lon = payload.dest_lon

    trip.updated_at = datetime.utcnow()
    db.commit()

    return {"ok": True, "trip_id": trip_id, "destination_hospital_id": trip.destination_hospital_id}


@router.post("/{trip_id}/arrive", response_model=TripArriveOut)
def arrive_trip(trip_id: str, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="trip_not_found")

    trip.status = TripStatus.ARRIVED
    trip.arrived_at = datetime.utcnow()
    trip.updated_at = trip.arrived_at
    db.commit()

    return TripArriveOut(trip_id=trip.trip_id, status=trip.status.value, arrived_at=trip.arrived_at)


# OPTIONAL ACK LOOP
@router.post("/{trip_id}/ack", response_model=AckOut)
def ack_trip(trip_id: str, payload: AckIn, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="trip_not_found")

    row = TripAck(trip_id=trip_id, hospital_id=payload.hospital_id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return AckOut(trip_id=trip_id, hospital_id=row.hospital_id, acked_at=row.acked_at)


@router.get("/{trip_id}/ack")
def get_ack(trip_id: str, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="trip_not_found")

    rows = db.query(TripAck).filter(TripAck.trip_id == trip_id).order_by(TripAck.acked_at.desc()).all()
    return {
        "trip_id": trip_id,
        "acks": [{"hospital_id": r.hospital_id, "acked_at": r.acked_at.isoformat()} for r in rows],
    }
