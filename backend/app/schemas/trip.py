from datetime import datetime

from pydantic import BaseModel, Field


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


class LatestGPSRes(BaseModel):
    trip_id: str
    lat: float
    lon: float
    timestamp: datetime
