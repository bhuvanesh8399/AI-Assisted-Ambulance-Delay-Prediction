# Trip schemas
"""
Central export barrel for Pydantic schemas.

Rule:
- Keep ALL existing schema exports here (to avoid breaking old imports)
- Add new trip lifecycle schemas here (our new endpoints)
"""

# ---- Existing schemas (keep project stable) ----
# If your project already has these files/classes, import them here.
# If a line errors because a file doesn't exist, just delete that one line.

try:
    from .route import RouteResponse, RouteRequest  # if you have RouteRequest too
except Exception:
    pass

try:
    from .predict import PredictRequest, PredictResponse
except Exception:
    pass

try:
    from .corridor import CorridorRequest, CorridorResponse
except Exception:
    pass


# ---- New schemas (Trip lifecycle + dashboards) ----
from .trip import (
    TripStartIn,
    TripStartOut,
    GPSUpdateIn,
    GPSUpdateOut,
    DestinationUpdateIn,
    TripArriveOut,
    AckIn,
    AckOut,
    LatestGPS,
    CorridorSummary,
    TripSnapshotOut,
    HospitalActiveTripItem,
    HospitalActiveTripsOut,
)
