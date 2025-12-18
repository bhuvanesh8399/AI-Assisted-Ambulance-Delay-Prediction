import json
from pathlib import Path

import joblib


class ModelStoreError(Exception):
    pass


class ModelStore:
    def __init__(self, model_dir: str = "models"):
        self.model_dir = Path(model_dir)
        self.linear_model = None
        self.rf_model = None
        self.schema = None

    def load(self):
        linear_path = self.model_dir / "linear_model.joblib"
        rf_path = self.model_dir / "rf_model.joblib"
        schema_path = self.model_dir / "feature_schema.json"

        if not linear_path.exists():
            raise ModelStoreError(f"Missing model file: {linear_path}")
        if not rf_path.exists():
            raise ModelStoreError(f"Missing model file: {rf_path}")
        if not schema_path.exists():
            raise ModelStoreError(f"Missing schema file: {schema_path}")

        self.linear_model = joblib.load(linear_path)
        self.rf_model = joblib.load(rf_path)
        self.schema = json.loads(schema_path.read_text(encoding="utf-8"))

        return self

    def is_loaded(self) -> bool:
        return self.linear_model is not None and self.rf_model is not None and self.schema is not None
