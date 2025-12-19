from datetime import datetime
from typing import List, Optional, Literal

from pydantic import BaseModel, Field

Priority = Literal["low", "medium", "high"]
Risk = Literal["low", "medium", "high"]


class JunctionWindow(BaseModel):
    name: str
    lat: float
    lon: float
    priority: Priority
    window_start: datetime
    window_end: datetime


class HospitalDashboardResponse(BaseModel):
    trip_id: str
    eta_final_sec: int
    eta_baseline_sec: Optional[int] = None
    delay_pred_sec: Optional[int] = None
    delay_risk: Risk = "low"
    countdown_sec: int
    prep_suggestion: str
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class TrafficDashboardResponse(BaseModel):
    trip_id: str
    eta_final_sec: int
    delay_risk: Risk = "low"
    junctions: List[JunctionWindow] = []
    last_updated: datetime = Field(default_factory=datetime.utcnow)
