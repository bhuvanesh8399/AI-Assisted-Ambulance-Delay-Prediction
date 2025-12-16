from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TripStartReq(BaseModel):
    ambulance_id: str
    hospital_id: str
    start_lat: float = Field(..., ge=-90, le=90)
    start_lon: float = Field(..., ge=-180, le=180)


class TripStartRes(BaseModel):
    trip_id: str
    started_at: datetime


class TripStopReq(BaseModel):
    trip_id: str


class TripStopRes(BaseModel):
    trip_id: str
    stopped_at: datetime


class GPSUpdateReq(BaseModel):
    trip_id: str
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    timestamp: Optional[datetime] = None  # ISO accepted


class GPSUpdateRes(BaseModel):
    ok: bool = True


class LatestGPSRes(BaseModel):
    trip_id: str
    lat: float
    lon: float
    timestamp: datetime
