# Trip schemas
from .trip import (
    TripStartReq,
    TripStartRes,
    TripStopReq,
    TripStopRes,
    LatestGPSRes,
)

# GPS schemas
from .gps import (
    GPSUpdateReq,
    GPSUpdateRes,
)

# Route schemas
from .route import RouteResponse

# Hospital schemas
from .hospital import HospitalCreate, HospitalOut

# Corridor schemas (Section 4)
from .corridor import (
    CorridorPlanRequest,
    CorridorPlanResponse,
)

# Dashboard schemas (Section 5)
from .dashboard import (
    JunctionWindow,
    HospitalDashboardResponse,
    TrafficDashboardResponse,
)
