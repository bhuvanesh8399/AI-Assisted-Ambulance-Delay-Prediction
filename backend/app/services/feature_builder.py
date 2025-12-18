from datetime import datetime
from typing import Dict


ROUTE_TYPE_MAP = {
    "urban": 0,
    "highway": 1,
    "mixed": 2,
}


def encode_route_type(route_type: str) -> int:
    if route_type not in ROUTE_TYPE_MAP:
        return ROUTE_TYPE_MAP["mixed"]
    return ROUTE_TYPE_MAP[route_type]


def classify_risk(delay_sec: float) -> str:
    # rule-based as required
    if delay_sec < 120:
        return "low"
    if delay_sec <= 300:
        return "medium"
    return "high"


def build_features(
    *,
    distance_km: float,
    route_type: str,
    junction_count: int,
    historical_delay_factor: float = 1.0,
    now: datetime | None = None,
) -> Dict:
    now = now or datetime.utcnow()

    features = {
        "distance_km": float(distance_km),
        "hour_of_day": int(now.hour),
        "day_of_week": int(now.weekday()),
        "route_type": route_type,  # keep human-readable in API
        "route_type_encoded": int(encode_route_type(route_type)),
        "junction_count": int(junction_count),
        "historical_delay_factor": float(historical_delay_factor),
    }
    return features
