from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.ml.predictor import Predictor
from app.ml.model_store import ModelStoreError

router = APIRouter(prefix="/api/predict", tags=["predict"])


# ---- INTEGRATION HOOKS (replace with your real services) ----
def get_trip_or_404(db: Session, trip_id: str):
    # TODO: replace using your Trip model
    trip = db.execute("SELECT id FROM trips WHERE id = :id", {"id": trip_id}).fetchone()
    if not trip:
        raise HTTPException(status_code=404, detail="Invalid trip_id")
    return trip


def get_osrm_route_features(db: Session, trip_id: str):
    """
    Must return:
      eta_osrm_sec (int)
      distance_km (float)
      route_type (str): urban/highway/mixed
      junction_count (int)
    """
    # TODO: replace with your Section 2 route storage or live OSRM call
    row = db.execute(
        """
        SELECT eta_osrm_sec, distance_km, route_type, junction_count
        FROM trip_routes
        WHERE trip_id = :trip_id
        """,
        {"trip_id": trip_id},
    ).fetchone()

    if not row:
        raise HTTPException(status_code=400, detail="Missing route data for trip_id")

    return {
        "eta_osrm_sec": int(row[0]),
        "distance_km": float(row[1]),
        "route_type": str(row[2]),
        "junction_count": int(row[3]),
    }
# ------------------------------------------------------------


def get_predictor() -> Predictor:
    # This will be overwritten by app startup injection; fallback for safety
    from app.main import predictor_instance

    if predictor_instance is None:
        raise HTTPException(status_code=500, detail="Prediction models not initialized")
    return predictor_instance


@router.get("/eta")
def predict_eta(trip_id: str, db: Session = Depends(get_db), predictor: Predictor = Depends(get_predictor)):
    try:
        get_trip_or_404(db, trip_id)
        route = get_osrm_route_features(db, trip_id)

        from app.services.feature_builder import build_features

        features = build_features(
            distance_km=route["distance_km"],
            route_type=route["route_type"],
            junction_count=route["junction_count"],
            historical_delay_factor=1.2,  # simulated initially; later from historical trips
        )

        # feed ML schema columns (includes encoded route type)
        ml_features = {
            "distance_km": features["distance_km"],
            "hour_of_day": features["hour_of_day"],
            "day_of_week": features["day_of_week"],
            "route_type_encoded": features["route_type_encoded"],
            "junction_count": features["junction_count"],
            "historical_delay_factor": features["historical_delay_factor"],
        }

        pred = predictor.predict_delay_sec(ml_features)

        eta_final = int(route["eta_osrm_sec"] + pred["predicted_delay_sec"])

        # API contract: features_used must contain human-readable route_type
        return {
            "trip_id": trip_id,
            "eta_osrm_sec": int(route["eta_osrm_sec"]),
            "predicted_delay_sec": int(pred["predicted_delay_sec"]),
            "eta_final_sec": int(eta_final),
            "risk_level": pred["risk_level"],
            "features_used": {
                "distance_km": features["distance_km"],
                "hour_of_day": features["hour_of_day"],
                "day_of_week": features["day_of_week"],
                "route_type": features["route_type"],
                "junction_count": features["junction_count"],
                "historical_delay_factor": features["historical_delay_factor"],
            },
        }

    except ModelStoreError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
