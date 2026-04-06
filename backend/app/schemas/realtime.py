from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


TripStatus = Literal["EN_ROUTE", "NEAR_ARRIVAL", "ARRIVED", "STOPPED"]
LiveState = Literal["LIVE", "STALE", "OFFLINE"]
RiskLevel = Literal["LOW", "MEDIUM", "HIGH", "UNKNOWN"]


class StartTripRequest(BaseModel):
    ambulance_id: str = Field(..., min_length=1)
    destination_hospital_id: str = Field(..., min_length=1)
    start_lat: float
    start_lon: float
    dest_lat: Optional[float] = None
    dest_lon: Optional[float] = None


class StartTripResponse(BaseModel):
    trip_id: str
    status: TripStatus
    destination_hospital_id: str
    started_at: datetime


class UpdateDestinationRequest(BaseModel):
    destination_hospital_id: str = Field(..., min_length=1)
    dest_lat: Optional[float] = None
    dest_lon: Optional[float] = None


class GPSUpdateRequest(BaseModel):
    trip_id: str
    lat: float
    lon: float
    timestamp: Optional[datetime] = None
    speed_mps: Optional[float] = None


class ETAResponse(BaseModel):
    trip_id: str
    eta_osrm_seconds: int
    predicted_delay_seconds: int
    eta_final_seconds: int
    risk_level: RiskLevel
    model_name: str = "stub"
    confidence_score: float = 0.0
    delay_reason: str = "Prediction unavailable"


class CorridorWindow(BaseModel):
    junction_name: str
    eta_window_start: datetime
    eta_window_end: datetime
    priority: Literal["LOW", "MEDIUM", "HIGH"]


class TripEvent(BaseModel):
    code: str
    label: str
    ts: datetime
    severity: Literal["INFO", "WARN", "HIGH"] = "INFO"
    message: str


class TripSnapshot(BaseModel):
    trip_id: str
    status: TripStatus
    live_state: LiveState
    last_update_at: Optional[datetime] = None
    ambulance_id: str
    ambulance_label: str
    destination_hospital_id: str
    destination_hospital_name: Optional[str] = None
    current_lat: Optional[float] = None
    current_lon: Optional[float] = None
    destination_lat: Optional[float] = None
    destination_lon: Optional[float] = None
    speed_kmph: Optional[float] = None
    distance_remaining_km: Optional[float] = None
    eta_osrm_seconds: int = 0
    predicted_delay_seconds: int = 0
    eta_final_seconds: int = 0
    risk_level: RiskLevel = "UNKNOWN"
    confidence_score: float = 0.0
    delay_reason: str = "Prediction unavailable"
    corridor_windows: list[CorridorWindow] = Field(default_factory=list)
    events: list[TripEvent] = Field(default_factory=list)
    gps_updates_count: int = 0
