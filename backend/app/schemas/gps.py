from datetime import datetime

from pydantic import BaseModel, Field


class GPSUpdateReq(BaseModel):
    trip_id: str
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    timestamp: datetime | None = None  # ISO accepted


class GPSUpdateRes(BaseModel):
    ok: bool = True
