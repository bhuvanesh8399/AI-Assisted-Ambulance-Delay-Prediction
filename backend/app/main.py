from __future__ import annotations

from fastapi import FastAPI

from .db import Base, engine
from .api.trip import router as trip_router
from .api.gps import router as gps_router
from .api.hospital import router as hospital_router
from .api.snapshot import router as snapshot_router
from .api.ws_routes import router as ws_routes_router
from .api.ws_router import ws_router as ws_snapshot_router
from .api.dashboard import router as dashboard_router
from .api.route import router as route_router
from .api.corridor import router as corridor_router
from .api.predict import router as predict_router

app = FastAPI(title="AI-Assisted Ambulance Delay Prediction API")

# DB init (safe for demo; for prod prefer alembic migrations)
Base.metadata.create_all(bind=engine)

# Routers
app.include_router(trip_router)
app.include_router(gps_router)
app.include_router(hospital_router)
app.include_router(snapshot_router)
app.include_router(ws_routes_router)
app.include_router(dashboard_router)
app.include_router(route_router)
app.include_router(corridor_router)
app.include_router(predict_router)
app.include_router(ws_snapshot_router)


@app.get("/health")
def health():
    return {"ok": True}
