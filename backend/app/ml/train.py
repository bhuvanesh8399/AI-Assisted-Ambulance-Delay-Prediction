import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split


MODEL_DIR = Path("models")
DATA_DIR = Path("data")


def make_synthetic_dataset(n: int = 2000) -> pd.DataFrame:
    rng = np.random.default_rng(7)

    distance_km = rng.uniform(1, 35, n)
    hour = rng.integers(0, 24, n)
    dow = rng.integers(0, 7, n)
    route_type_encoded = rng.integers(0, 3, n)  # 0 urban, 1 highway, 2 mixed
    junction_count = (distance_km * rng.uniform(0.8, 1.8, n)).astype(int)
    hist = rng.uniform(0.8, 1.6, n)

    # Non-linear-ish delay generator (review-safe, explainable)
    rush = ((hour >= 8) & (hour <= 11)) | ((hour >= 17) & (hour <= 20))
    rush_factor = np.where(rush, 1.8, 1.0)

    urban_penalty = np.where(route_type_encoded == 0, 1.4, 1.0)
    highway_bonus = np.where(route_type_encoded == 1, 0.7, 1.0)

    base = distance_km * 8  # baseline delay grows with distance
    junction_pen = junction_count * 4
    noise = rng.normal(0, 25, n)

    delay_sec = (base + junction_pen) * rush_factor * urban_penalty * highway_bonus * hist + noise
    delay_sec = np.clip(delay_sec, 0, None)

    df = pd.DataFrame({
        "distance_km": distance_km,
        "hour_of_day": hour,
        "day_of_week": dow,
        "route_type_encoded": route_type_encoded,
        "junction_count": junction_count,
        "historical_delay_factor": hist,
        "delay_sec": delay_sec.astype(int),
    })
    return df


def train_and_save():
    MODEL_DIR.mkdir(exist_ok=True)
    DATA_DIR.mkdir(exist_ok=True)

    df = make_synthetic_dataset()
    csv_path = DATA_DIR / "trips_synthetic.csv"
    df.to_csv(csv_path, index=False)

    features = [
        "distance_km",
        "hour_of_day",
        "day_of_week",
        "route_type_encoded",
        "junction_count",
        "historical_delay_factor",
    ]
    target = "delay_sec"

    X = df[features].astype(float)
    y = df[target].astype(float)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    lr = LinearRegression()
    lr.fit(X_train, y_train)

    rf = RandomForestRegressor(
        n_estimators=200,
        random_state=42,
        n_jobs=-1,
        max_depth=None,
    )
    rf.fit(X_train, y_train)

    def metrics(model, name):
        pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, pred)
        rmse = mean_squared_error(y_test, pred) ** 0.5
        return name, float(mae), float(rmse)

    m_lr = metrics(lr, "linear_regression")
    m_rf = metrics(rf, "random_forest")

    joblib.dump(lr, MODEL_DIR / "linear_model.joblib")
    joblib.dump(rf, MODEL_DIR / "rf_model.joblib")

    schema = {
        "model_features": features,
        "target": target,
        "metrics": {
            m_lr[0]: {"mae": m_lr[1], "rmse": m_lr[2]},
            m_rf[0]: {"mae": m_rf[1], "rmse": m_rf[2]},
        },
    }
    (MODEL_DIR / "feature_schema.json").write_text(json.dumps(schema, indent=2), encoding="utf-8")

    print("✅ Saved:")
    print(" - models/linear_model.joblib")
    print(" - models/rf_model.joblib")
    print(" - models/feature_schema.json")
    print("✅ Dataset:")
    print(f" - {csv_path}")
    print("📊 Metrics:")
    print(json.dumps(schema["metrics"], indent=2))


if __name__ == "__main__":
    train_and_save()
