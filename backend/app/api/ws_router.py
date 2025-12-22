from __future__ import annotations

import asyncio
from typing import Dict, Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.db import SessionLocal
from app.models import Trip
from app.schemas import TripSnapshotOut, LatestGPS, CorridorSummary
from app.services.snapshot import get_latest_gps, get_prediction_stub, get_corridor_stub, get_acks

ws_router = APIRouter()


def _build_snapshot(trip_id: str) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
        if not trip:
            return {"error": "trip_not_found", "trip_id": trip_id}

        lat, lon, gps_at, speed = get_latest_gps(db, trip_id)
        eta_final, risk = get_prediction_stub(db, trip)
        corridor_obj = get_corridor_stub(db, trip)
        acks = get_acks(db, trip_id)

        latest_gps = LatestGPS(lat=lat, lon=lon, recorded_at=gps_at, speed_mps=speed)
        corridor = CorridorSummary(
            ok=bool(corridor_obj.get("ok", False)),
            reason=str(corridor_obj.get("reason", "corridor_not_generated")),
            junctions=list(corridor_obj.get("junctions", [])),
        )

        snap = TripSnapshotOut(
            trip_id=trip.trip_id,
            ambulance_id=trip.ambulance_id,
            destination_hospital_id=trip.destination_hospital_id,
            status=trip.status.value,
            latest_gps=latest_gps,
            last_gps_at=gps_at,
            last_update_at=trip.updated_at,
            eta_final_seconds=int(eta_final),
            risk_level=str(risk),
            corridor=corridor,
            acks=acks,
        )
        return snap.model_dump()
    finally:
        db.close()


@ws_router.websocket("/ws/trip/{trip_id}")
async def ws_trip_stream(websocket: WebSocket, trip_id: str):
    """
    EXPERIMENTAL (Section 6):
    - READ-ONLY transport
    - Streams EXACT snapshot JSON (same as GET /api/trip/{trip_id}/snapshot)
    - NO business logic here
    """
    await websocket.accept()

    try:
        while True:
            snapshot = await asyncio.to_thread(_build_snapshot, trip_id)
            await websocket.send_json(snapshot)
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        return
    except Exception:
        try:
          await websocket.close()
        except Exception:
          pass
