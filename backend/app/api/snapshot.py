from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import GPSPoint, Trip, TripStatus
from ..schemas import CorridorSummary, LatestGPS, TripSnapshotOut
from ..services.snapshot import get_acks, get_corridor_stub, get_latest_gps, get_prediction_stub
from ..services.corridor_service import build_corridor_windows_for_trip
from ..services.eta_service import compute_trip_eta
from ..services.realtime_snapshot import compute_live_state
from ..services.trip_events import (
    build_arrived_event,
    build_delay_spike_event,
    build_gps_live_event,
    build_near_arrival_event,
    build_trip_started_event,
)

router = APIRouter(prefix="/api/trip", tags=["snapshot"])


@router.get("/{trip_id}/snapshot", response_model=TripSnapshotOut)
def trip_snapshot(trip_id: str, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="trip_not_found")

    lat, lon, gps_at, speed = get_latest_gps(db, trip_id)
    corridor_obj = get_corridor_stub(db, trip)
    acks = get_acks(db, trip_id)
    gps_updates_count = db.query(GPSPoint).filter(GPSPoint.trip_id == trip_id).count()

    prediction_eta, prediction_risk = get_prediction_stub(db, trip)
    eta = compute_trip_eta(trip, speed_kmph=(speed * 3.6 if speed else None))
    if prediction_eta > 0:
        eta = eta.__class__(
            eta_osrm_seconds=max(eta.eta_osrm_seconds, prediction_eta),
            predicted_delay_seconds=max(prediction_eta - eta.eta_osrm_seconds, 0),
            eta_final_seconds=prediction_eta,
            risk_level=prediction_risk,
            model_name="legacy_stub",
            confidence_score=0.5,
            delay_reason="Prediction sourced from legacy dashboard stub.",
        )

    corridor_windows = build_corridor_windows_for_trip(trip, eta.eta_final_seconds)
    events = [build_trip_started_event()]
    if gps_updates_count > 0:
        events.append(build_gps_live_event())
    if trip.status == TripStatus.NEAR_ARRIVAL:
        events.append(build_near_arrival_event())
    if trip.status == TripStatus.ARRIVED:
        events.append(build_arrived_event())
    if eta.predicted_delay_seconds >= 120:
        events.append(build_delay_spike_event(eta.predicted_delay_seconds))

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
        eta_final_seconds=int(eta.eta_final_seconds),
        risk_level=str(eta.risk_level),
        live_state=compute_live_state(trip.updated_at),
        ambulance_label=trip.ambulance_id,
        current_lat=lat,
        current_lon=lon,
        destination_lat=trip.dest_lat,
        destination_lon=trip.dest_lon,
        speed_kmph=round(speed * 3.6, 1) if speed is not None else None,
        eta_osrm_seconds=eta.eta_osrm_seconds,
        predicted_delay_seconds=eta.predicted_delay_seconds,
        confidence_score=eta.confidence_score,
        delay_reason=eta.delay_reason,
        corridor_windows=[window.model_dump(mode="json") for window in corridor_windows],
        events=[event.model_dump(mode="json") for event in events],
        gps_updates_count=gps_updates_count,
        corridor=corridor,
        acks=acks,
    )
