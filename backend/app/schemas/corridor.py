from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class LatLon(BaseModel):
    lat: float
    lon: float


class CorridorPlanRequest(BaseModel):
    """
    Section 4 input:
    - route_geometry: list of points from OSRM route polyline decoded to lat/lon
    - final_eta_seconds: OSRM ETA + predicted delay (Section 3 output)
    """

    trip_id: Optional[str] = Field(default=None, description="Optional trip reference")
    route_geometry: List[LatLon] = Field(..., min_items=2)
    final_eta_seconds: int = Field(..., ge=1)

    # planner tuning knobs (safe defaults)
    max_junctions: int = Field(default=25, ge=5, le=80)
    min_spacing_m: int = Field(
        default=250,
        ge=50,
        le=3000,
        description="minimum spacing between selected junctions",
    )
    turn_angle_threshold_deg: float = Field(
        default=35.0,
        ge=10.0,
        le=120.0,
        description="angle to mark a turn as junction",
    )
    window_buffer_seconds: int = Field(
        default=30,
        ge=5,
        le=180,
        description="± buffer around junction ETA",
    )


class CorridorJunctionOut(BaseModel):
    index: int
    lat: float
    lon: float
    cumulative_distance_m: float
    eta_seconds_from_now: int
    window_start_seconds_from_now: int
    window_end_seconds_from_now: int
    priority: str  # low | medium | high


class CorridorPlanResponse(BaseModel):
    trip_id: Optional[str] = None
    total_distance_m: float
    final_eta_seconds: int
    junctions: List[CorridorJunctionOut]
    meta: dict
