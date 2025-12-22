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
    # Optional: if you can provide destination coordinates now, it enables NEAR_ARRIVAL auto detection.
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
    # optional coordinates if known
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

    # Prediction outputs (never null)
    eta_final_seconds: int = 0
    risk_level: str = "UNKNOWN"

    # Corridor (never null)
    corridor: CorridorSummary

    # Optional ACK info
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
