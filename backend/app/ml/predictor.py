from typing import Dict

import numpy as np

from app.services.feature_builder import classify_risk


class Predictor:
    def __init__(self, model_store):
        self.store = model_store

    def predict_delay_sec(self, features: Dict) -> Dict:
        if not self.store.is_loaded():
            raise RuntimeError("Models not loaded")

        # schema defines which columns we feed into ML
        cols = self.store.schema["model_features"]

        row = []
        for c in cols:
            if c not in features:
                raise ValueError(f"Missing feature: {c}")
            row.append(features[c])

        X = np.array([row], dtype=float)

        # Use RandomForest for final prediction as required
        delay = float(self.store.rf_model.predict(X)[0])

        # guardrail: never return negative delays
        if delay < 0:
            delay = 0.0

        return {
            "predicted_delay_sec": int(round(delay)),
            "risk_level": classify_risk(delay),
        }
