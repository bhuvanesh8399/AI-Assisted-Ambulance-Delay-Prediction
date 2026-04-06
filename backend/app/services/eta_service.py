from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ETAResult:
    eta_osrm_seconds: int
    predicted_delay_seconds: int
    eta_final_seconds: int
    risk_level: str
    model_name: str
    confidence_score: float
    delay_reason: str


def compute_trip_eta(trip, speed_kmph: float | None = None) -> ETAResult:
    eta_osrm_seconds = 600

    if speed_kmph is None or speed_kmph <= 0:
        predicted_delay_seconds = 120
    elif speed_kmph < 15:
        predicted_delay_seconds = 300
    elif speed_kmph < 30:
        predicted_delay_seconds = 180
    else:
        predicted_delay_seconds = 60

    eta_final_seconds = eta_osrm_seconds + predicted_delay_seconds

    if predicted_delay_seconds >= 300:
        risk_level = "HIGH"
    elif predicted_delay_seconds >= 120:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return ETAResult(
        eta_osrm_seconds=eta_osrm_seconds,
        predicted_delay_seconds=predicted_delay_seconds,
        eta_final_seconds=eta_final_seconds,
        risk_level=risk_level,
        model_name="fallback_rules",
        confidence_score=0.6,
        delay_reason="Fallback ETA estimate from live speed and route baseline.",
    )
