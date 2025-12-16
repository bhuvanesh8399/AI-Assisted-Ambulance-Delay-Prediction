from fastapi import FastAPI

from app.db.session import Base, engine
from app.api import trip, gps
from app.api import route, hospital  # NEW


def create_app() -> FastAPI:
    app = FastAPI(title="AI-Assisted Ambulance Delay Prediction API")

    # Create tables (simple dev approach). In prod, you’d use Alembic migrations.
    Base.metadata.create_all(bind=engine)

    app.include_router(trip.router, prefix="/api")
    app.include_router(gps.router, prefix="/api")
    app.include_router(route.router, prefix="/api")      # NEW
    app.include_router(hospital.router, prefix="/api")   # NEW

    return app


app = create_app()
