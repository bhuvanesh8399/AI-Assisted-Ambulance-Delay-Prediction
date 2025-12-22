from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.realtime.ws_manager import ws_manager

router = APIRouter(tags=["realtime"])


@router.websocket("/ws/trips/{trip_id}")
async def ws_trip_updates(ws: WebSocket, trip_id: str):
    await ws_manager.connect(trip_id, ws)
    try:
        # Keep alive; client can ping
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        await ws_manager.disconnect(trip_id, ws)
    except Exception:
        await ws_manager.disconnect(trip_id, ws)
