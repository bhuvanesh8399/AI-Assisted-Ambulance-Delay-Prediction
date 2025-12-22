# backend/app/realtime/ws_manager.py
# SECTION 6 ONLY: Optional realtime delivery (WebSocket).
# Non-negotiable: NO ML, NO routing, NO corridor computation here.

from __future__ import annotations

import asyncio
import json
from typing import Any, Dict, Set

from fastapi import WebSocket


class TripWSManager:
    def __init__(self) -> None:
        self._clients: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, trip_id: str, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._clients.setdefault(trip_id, set()).add(ws)

    async def disconnect(self, trip_id: str, ws: WebSocket) -> None:
        async with self._lock:
            if trip_id in self._clients:
                self._clients[trip_id].discard(ws)
                if not self._clients[trip_id]:
                    del self._clients[trip_id]

    async def broadcast(self, trip_id: str, payload: Dict[str, Any]) -> None:
        """
        Read-only broadcast of already computed outputs.
        This must never affect REST correctness.
        """
        async with self._lock:
            conns = list(self._clients.get(trip_id, set()))

        if not conns:
            return

        msg = json.dumps(payload, default=str)
        dead: list[WebSocket] = []

        for ws in conns:
            try:
                await ws.send_text(msg)
            except Exception:
                dead.append(ws)

        for ws in dead:
            await self.disconnect(trip_id, ws)


ws_manager = TripWSManager()
