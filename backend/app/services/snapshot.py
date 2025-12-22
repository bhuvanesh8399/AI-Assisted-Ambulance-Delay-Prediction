from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Tuple

from sqlalchemy import desc
from sqlalchemy.orm import Session

from ..models import GPSPoint, Trip, TripAck, TripStatus


def get_latest_gps(db: Session, trip_id: str) -> Tuple[float, float, datetime, float]:
    gp = (
        db.query(GPSPoint)
        .filter(GPSPoint.trip_id == trip_id)
        .order_by(desc(GPSPoint.recorded_at))
        .first()
    )
    if not gp:
        # Never return nulls: return safe defaults
        return 0.0, 0.0, datetime.utcnow(), 0.0
    return gp.lat, gp.lon, gp.recorded_at, float(gp.speed_mps or 0.0)


def get_prediction_stub(db: Session, trip: Trip) -> Tuple[int, str]:
    """
    Hook point: replace with your existing Sections 3–5 prediction pipeline.
    Non-negotiable requirement: never return nulls.
    """
    # If you already store Prediction per trip, query it here.
    # For now: safe defaults.
    return 0, "UNKNOWN"


def get_corridor_stub(db: Session, trip: Trip) -> Dict[str, Any]:
    """
    Hook point: replace with your corridor planner (Section 4/5).
    Must NEVER return null.
    """
    return {
        "ok": False,
        "reason": "corridor_not_generated",
        "junctions": [],
    }


def get_acks(db: Session, trip_id: str) -> List[Dict[str, Any]]:
    rows = (
        db.query(TripAck)
        .filter(TripAck.trip_id == trip_id)
        .order_by(desc(TripAck.acked_at))
        .all()
    )
    return [{"hospital_id": r.hospital_id, "acked_at": r.acked_at.isoformat()} for r in rows]


def is_active(trip: Trip) -> bool:
    return trip.status in (TripStatus.EN_ROUTE, TripStatus.NEAR_ARRIVAL)
