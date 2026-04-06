from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

TripStatus = Literal["EN_ROUTE", "NEAR_ARRIVAL", "ARRIVED", "STOPPED"]


class TripStartIn(BaseModel):
    ambulance_id: str
    destination_hospital_id: str
    start_lat: float
    start_lon: float
    dest_lat: Optional[float] = None
    dest_lon: Optional[float] = None


class TripStartOut(BaseModel):
    trip_id: str
    started_at: datetime


class GPSUpdateIn(BaseModel):
    trip_id: str
    lat: float
    lon: float
    timestamp: Optional[datetime] = None
    speed_mps: Optional[float] = None


class GPSUpdateOut(BaseModel):
    ok: bool = True
    trip_id: str
    status: TripStatus
    updated_at: datetime


class DestinationUpdateIn(BaseModel):
    destination_hospital_id: str
    dest_lat: Optional[float] = None
    dest_lon: Optional[float] = None


class TripArriveOut(BaseModel):
    ok: bool = True
    trip_id: str
    status: TripStatus
    arrived_at: datetime


class AckIn(BaseModel):
    hospital_id: str


class AckOut(BaseModel):
    trip_id: str
    hospital_id: str
    acked_at: datetime


class LatestGPS(BaseModel):
    lat: float = 0.0
    lon: float = 0.0
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    speed_mps: float = 0.0


class CorridorSummary(BaseModel):
    ok: bool = False
    reason: str = "corridor_not_generated"
    junctions: List[Dict[str, Any]] = Field(default_factory=list)


class TripSnapshotOut(BaseModel):
    trip_id: str
    ambulance_id: str
    destination_hospital_id: str
    status: TripStatus

    latest_gps: LatestGPS
    last_gps_at: datetime
    last_update_at: datetime

    eta_final_seconds: int = 0
    risk_level: str = "UNKNOWN"
    live_state: str = "OFFLINE"
    ambulance_label: str = "Ambulance"
    destination_hospital_name: Optional[str] = None
    current_lat: Optional[float] = None
    current_lon: Optional[float] = None
    destination_lat: Optional[float] = None
    destination_lon: Optional[float] = None
    speed_kmph: Optional[float] = None
    distance_remaining_km: Optional[float] = None
    eta_osrm_seconds: int = 0
    predicted_delay_seconds: int = 0
    confidence_score: float = 0.0
    delay_reason: str = "Prediction unavailable"
    corridor_windows: List[Dict[str, Any]] = Field(default_factory=list)
    events: List[Dict[str, Any]] = Field(default_factory=list)
    gps_updates_count: int = 0

    corridor: CorridorSummary
    acks: List[Dict[str, Any]] = Field(default_factory=list)


class HospitalActiveTripItem(BaseModel):
    trip_id: str
    ambulance_id: str
    status: TripStatus

    latest_gps: LatestGPS
    last_update_time: datetime

    eta_final_seconds: int = 0
    risk_level: str = "UNKNOWN"


class HospitalActiveTripsOut(BaseModel):
    hospital_id: str
    trips: List[HospitalActiveTripItem] = Field(default_factory=list)
