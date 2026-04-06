from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable, Optional

from app.schemas.realtime import CorridorWindow, TripEvent, TripSnapshot


LIVE_SECONDS = 10
STALE_SECONDS = 30


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def compute_live_state(last_update_at: Optional[datetime]) -> str:
    if last_update_at is None:
        return "OFFLINE"

    ts = last_update_at
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)

    age = (utc_now() - ts).total_seconds()
    if age <= LIVE_SECONDS:
        return "LIVE"
    if age <= STALE_SECONDS:
        return "STALE"
    return "OFFLINE"


@dataclass
class SnapshotInput:
    trip_id: str
    status: str
    ambulance_id: str
    ambulance_label: str
    destination_hospital_id: str
    destination_hospital_name: Optional[str]
    current_lat: Optional[float]
    current_lon: Optional[float]
    destination_lat: Optional[float]
    destination_lon: Optional[float]
    speed_kmph: Optional[float]
    distance_remaining_km: Optional[float]
    eta_osrm_seconds: int
    predicted_delay_seconds: int
    eta_final_seconds: int
    risk_level: str
    confidence_score: float
    delay_reason: str
    gps_updates_count: int
    last_update_at: Optional[datetime]
    events: Iterable[TripEvent]
    corridor_windows: Iterable[CorridorWindow]


def build_trip_snapshot(data: SnapshotInput) -> TripSnapshot:
    return TripSnapshot(
        trip_id=data.trip_id,
        status=data.status,
        live_state=compute_live_state(data.last_update_at),
        last_update_at=data.last_update_at,
        ambulance_id=data.ambulance_id,
        ambulance_label=data.ambulance_label,
        destination_hospital_id=data.destination_hospital_id,
        destination_hospital_name=data.destination_hospital_name,
        current_lat=data.current_lat,
        current_lon=data.current_lon,
        destination_lat=data.destination_lat,
        destination_lon=data.destination_lon,
        speed_kmph=data.speed_kmph,
        distance_remaining_km=data.distance_remaining_km,
        eta_osrm_seconds=data.eta_osrm_seconds,
        predicted_delay_seconds=data.predicted_delay_seconds,
        eta_final_seconds=data.eta_final_seconds,
        risk_level=data.risk_level,
        confidence_score=data.confidence_score,
        delay_reason=data.delay_reason,
        gps_updates_count=data.gps_updates_count,
        events=list(data.events),
        corridor_windows=list(data.corridor_windows),
    )
