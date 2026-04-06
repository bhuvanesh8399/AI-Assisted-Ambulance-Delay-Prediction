from __future__ import annotations

from datetime import datetime, timezone

from app.schemas.realtime import TripEvent


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def build_trip_started_event() -> TripEvent:
    return TripEvent(
        code="TRIP_STARTED",
        label="Trip started",
        ts=utc_now(),
        severity="INFO",
        message="The ambulance trip has started.",
    )


def build_gps_live_event() -> TripEvent:
    return TripEvent(
        code="GPS_LIVE",
        label="GPS connected",
        ts=utc_now(),
        severity="INFO",
        message="Live GPS updates are being received.",
    )


def build_near_arrival_event() -> TripEvent:
    return TripEvent(
        code="NEAR_ARRIVAL",
        label="Near arrival",
        ts=utc_now(),
        severity="INFO",
        message="The ambulance is approaching the destination hospital.",
    )


def build_arrived_event() -> TripEvent:
    return TripEvent(
        code="ARRIVED",
        label="Arrival confirmed",
        ts=utc_now(),
        severity="INFO",
        message="The ambulance has arrived at the destination hospital.",
    )


def build_delay_spike_event(extra_delay_seconds: int) -> TripEvent:
    return TripEvent(
        code="DELAY_SPIKE",
        label="Delay spike detected",
        ts=utc_now(),
        severity="WARN" if extra_delay_seconds < 300 else "HIGH",
        message=f"Predicted route delay increased by {extra_delay_seconds} seconds.",
    )
