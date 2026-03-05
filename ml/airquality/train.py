"""
Air Quality — XGBoost AQI Forecasting model.
Usage: python ml/airquality/train.py
Outputs: ml/artefacts/aqi_forecast.joblib
         ml/artefacts/aqi_scaler.joblib
"""
import os
import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

try:
    from xgboost import XGBRegressor
    XGB_AVAILABLE = True
except ImportError:
    from sklearn.ensemble import GradientBoostingRegressor as XGBRegressor
    XGB_AVAILABLE = False

ARTEFACT_DIR = os.path.join(os.path.dirname(__file__), '..', 'artefacts')
os.makedirs(ARTEFACT_DIR, exist_ok=True)


def generate_aqi_data(n: int = 5000):
    """
    Features: [hour, day_of_week, month, temp_c, humidity_pct,
               wind_kmh, vehicle_count, construction_active]
    Target:   PM2.5 concentration (µg/m³)
    """
    rng = np.random.default_rng(99)
    hour        = rng.integers(0, 24, n)
    dow         = rng.integers(0, 7,  n)
    month       = rng.integers(1, 13, n)
    temp        = rng.uniform(20, 40, n)
    humidity    = rng.uniform(30, 90, n)
    wind        = rng.exponential(5,  n)
    vehicles    = rng.integers(20, 500, n)
    construction= rng.integers(0, 2,  n)

    # Rush hours
    rush = ((hour >= 8) & (hour <= 10)) | ((hour >= 17) & (hour <= 20))

    pm25 = (
        12
        + 0.05 * vehicles
        + 5 * construction
        + 8 * rush.astype(float)
        - 0.3 * wind
        + 0.1 * humidity
        - 0.05 * temp
        + 3 * (month >= 10).astype(float)       # winter spike
        + rng.normal(0, 3, n)
    ).clip(2, 450)

    X = np.column_stack([hour, dow, month, temp, humidity, wind, vehicles, construction])
    return X, pm25


def train_aqi_model():
    print(f"Training {'XGBoost' if XGB_AVAILABLE else 'GradientBoosting'} AQI forecaster…")
    X, y = generate_aqi_data()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_tr = scaler.fit_transform(X_train)
    X_te = scaler.transform(X_test)

    if XGB_AVAILABLE:
        model = XGBRegressor(n_estimators=300, max_depth=6, learning_rate=0.05,
                             subsample=0.8, random_state=42, n_jobs=-1, verbosity=0)
    else:
        model = XGBRegressor(n_estimators=200, max_depth=5, learning_rate=0.05, random_state=42)

    model.fit(X_tr, y_train)

    preds = model.predict(X_te)
    mae = mean_absolute_error(y_test, preds)
    r2  = r2_score(y_test, preds)
    print(f"  Test  MAE={mae:.2f} µg/m³   R²={r2:.3f}")

    joblib.dump(model,  os.path.join(ARTEFACT_DIR, 'aqi_forecast.joblib'))
    joblib.dump(scaler, os.path.join(ARTEFACT_DIR, 'aqi_scaler.joblib'))
    print(f"  Saved → {ARTEFACT_DIR}/aqi_forecast.joblib")
    return model, scaler


if __name__ == '__main__':
    train_aqi_model()
    print("Done.")
