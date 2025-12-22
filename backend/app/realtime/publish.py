# backend/app/realtime/publish.py
# SECTION 6 ONLY: Safe publish hook
# Goal: allow REST endpoints to "fire and forget" a WS update.

from __future__ import annotations

import asyncio
from typing import Any, Dict

from app.realtime.ws_manager import ws_manager


def publish_trip_update(trip_id: str, payload: Dict[str, Any]) -> None:
    """
    Fire-and-forget broadcast.
    Never raises to caller (REST must remain stable).
    """
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(ws_manager.broadcast(trip_id, payload))
    except Exception:
        # If there's no running loop (rare) or anything fails, do nothing.
        pass
