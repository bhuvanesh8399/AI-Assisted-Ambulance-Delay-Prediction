from __future__ import annotations

from datetime import timedelta

from app.schemas.realtime import CorridorWindow
from app.services.realtime_snapshot import utc_now


def build_corridor_windows_for_trip(trip, eta_final_seconds: int) -> list[CorridorWindow]:
    now = utc_now()
    return [
        CorridorWindow(
            junction_name="Collector Office Junction",
            eta_window_start=now + timedelta(minutes=2),
            eta_window_end=now + timedelta(minutes=3),
            priority="HIGH",
        ),
        CorridorWindow(
            junction_name="Market Road Signal",
            eta_window_start=now + timedelta(minutes=4),
            eta_window_end=now + timedelta(minutes=5),
            priority="MEDIUM",
        ),
        CorridorWindow(
            junction_name="Hospital Entry Gate",
            eta_window_start=now + timedelta(seconds=max(eta_final_seconds - 120, 60)),
            eta_window_end=now + timedelta(seconds=max(eta_final_seconds, 120)),
            priority="HIGH",
        ),
    ]
