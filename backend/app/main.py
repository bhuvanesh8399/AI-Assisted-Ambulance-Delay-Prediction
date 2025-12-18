from fastapi import FastAPI

from app.db.session import Base, engine
from app.api import trip, gps
from app.api import route, hospital  # NEW
from app.api import predict
from app.api.corridor import router as corridor_router
from app.ml.model_store import ModelStore
from app.ml.predictor import Predictor


def create_app() -> FastAPI:
    app = FastAPI(title="AI-Assisted Ambulance Delay Prediction API")

    # Create tables (simple dev approach). In prod, you’d use Alembic migrations.
    Base.metadata.create_all(bind=engine)

    app.include_router(trip.router, prefix="/api")
    app.include_router(gps.router, prefix="/api")
    app.include_router(route.router, prefix="/api")      # NEW
    app.include_router(hospital.router, prefix="/api")   # NEW
    app.include_router(corridor_router)                  # already prefixed
    app.include_router(predict.router)                   # already prefixed

    return app


predictor_instance: Predictor | None = None


def init_predictor():
    global predictor_instance
    store = ModelStore()
    store.load()
    predictor_instance = Predictor(store)


app = create_app()

# Eagerly load models at import time; adjust to startup event if desired.
try:
    init_predictor()
except Exception:
    predictor_instance = None
