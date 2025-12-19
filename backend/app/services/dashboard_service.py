from datetime import datetime, timezone
from typing import Optional, List

from app.schemas.dashboard import (
    HospitalDashboardResponse,
    TrafficDashboardResponse,
    JunctionWindow,
)


# NOTE:
# Replace these imports with your actual DB/service functions from Section 1–4
# - get_latest_prediction(trip_id): returns {eta_final_sec, eta_baseline_sec, delay_pred_sec, delay_risk}
# - get_latest_corridor_plan(trip_id): returns list of junction dicts (name, lat, lon, priority, window_start, window_end)


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _prep_suggestion(delay_risk: str, countdown_sec: int) -> str:
    # Simple, safe, rule-based suggestions (reviewers love this)
    if countdown_sec <= 300:  # < 5 min
        return "Immediate prep: allocate emergency bay + alert duty team"
    if delay_risk == "high":
        return "Prep early: inform ER, keep trauma bay ready"
    if delay_risk == "medium":
        return "Standby: notify triage + keep staff available"
    return "Normal prep: monitor ETA"


def build_hospital_dashboard(
    trip_id: str,
    *,
    eta_final_sec: int,
    eta_baseline_sec: Optional[int],
    delay_pred_sec: Optional[int],
    delay_risk: str,
) -> HospitalDashboardResponse:
    countdown = max(0, int(eta_final_sec))
    return HospitalDashboardResponse(
        trip_id=trip_id,
        eta_final_sec=int(eta_final_sec),
        eta_baseline_sec=int(eta_baseline_sec) if eta_baseline_sec is not None else None,
        delay_pred_sec=int(delay_pred_sec) if delay_pred_sec is not None else None,
        delay_risk=delay_risk if delay_risk in ("low", "medium", "high") else "low",
        countdown_sec=countdown,
        prep_suggestion=_prep_suggestion(delay_risk, countdown),
        last_updated=_now_utc(),
    )


def build_traffic_dashboard(
    trip_id: str,
    *,
    eta_final_sec: int,
    delay_risk: str,
    junctions: List[dict],
) -> TrafficDashboardResponse:
    # show only top 5 critical junctions (less noise)
    top = junctions[:5]
    mapped = [
        JunctionWindow(
            name=j["name"],
            lat=j["lat"],
            lon=j["lon"],
            priority=j.get("priority", "medium"),
            window_start=j["window_start"],
            window_end=j["window_end"],
        )
        for j in top
    ]
    return TrafficDashboardResponse(
        trip_id=trip_id,
        eta_final_sec=int(eta_final_sec),
        delay_risk=delay_risk if delay_risk in ("low", "medium", "high") else "low",
        junctions=mapped,
        last_updated=_now_utc(),
    )
