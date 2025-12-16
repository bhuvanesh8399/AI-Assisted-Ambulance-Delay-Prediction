from fastapi import FastAPI
from app.db.session import Base, engine
from app.api.trip import router as trip_router
from app.api.gps import router as gps_router

def create_app() -> FastAPI:
    app = FastAPI(title="AI-Assisted Ambulance Delay Prediction API")

    # Create tables (simple dev approach). In prod, you’d use Alembic migrations.
    Base.metadata.create_all(bind=engine)

    app.include_router(trip_router)
    app.include_router(gps_router)

    return app

app = create_app()
