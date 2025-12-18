from typing import Any, Literal

from pydantic import BaseModel


class RouteResponse(BaseModel):
    trip_id: str
    distance_km: float
    duration_sec: int
    polyline_geojson: Any
    route_type: Literal["urban", "highway", "mixed"]
