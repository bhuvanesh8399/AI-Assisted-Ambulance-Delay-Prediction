from typing import Literal

RouteType = Literal["urban", "highway", "mixed"]


def classify_route_type(distance_km: float, duration_sec: float) -> RouteType:
    """
    Simple explainable rules:
    - urban: distance < 8km OR avg speed < 40km/h
    - highway: distance > 15km AND avg speed > 60km/h
    - mixed: everything else
    """
    if duration_sec <= 0:
        return "mixed"

    avg_speed_kmh = distance_km / (duration_sec / 3600.0)

    if distance_km < 8.0 or avg_speed_kmh < 40.0:
        return "urban"
    if distance_km > 15.0 and avg_speed_kmh > 60.0:
        return "highway"
    return "mixed"
