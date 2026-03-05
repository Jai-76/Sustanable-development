"""
Energy Anomaly Detection & Demand Forecasting — training script.
Usage: python ml/energy/train.py
Outputs: ml/artefacts/energy_anomaly.joblib
         ml/artefacts/energy_scaler.joblib
"""
import os
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from datetime import datetime, timedelta

ARTEFACT_DIR = os.path.join(os.path.dirname(__file__), '..', 'artefacts')
os.makedirs(ARTEFACT_DIR, exist_ok=True)


# ── Synthetic training data ────────────────────────────────────────────────────
def generate_energy_data(n_normal: int = 2000, n_anomaly: int = 100) -> pd.DataFrame:
    """
    Features: [hour, day_of_week, temp_c, occupancy_pct, power_kw]
    Anomalies: atypical power / occupancy combos.
    """
    rng = np.random.default_rng(42)
    hours   = rng.integers(0, 24,  n_normal)
    dow     = rng.integers(0, 7,   n_normal)
    temp    = rng.uniform(20, 38,  n_normal)
    occ     = rng.uniform(0,  1,   n_normal)
    # Diurnal power profile: high during work hours, low at night
    power   = 3 + 8 * np.sin(np.clip((hours - 6) / 12 * np.pi, 0, np.pi)) * occ + rng.normal(0, 0.5, n_normal)

    normal = pd.DataFrame({'hour': hours, 'dow': dow, 'temp_c': temp, 'occ_pct': occ, 'power_kw': power, 'label': 0})

    # Anomalies: power spike or deep drop
    a_hours = rng.integers(0, 24, n_anomaly)
    a_power = rng.choice([-1, 1], n_anomaly) * rng.uniform(15, 40, n_anomaly) + 5
    anomalies = pd.DataFrame({'hour': a_hours, 'dow': rng.integers(0, 7, n_anomaly),
                               'temp_c': rng.uniform(20, 38, n_anomaly),
                               'occ_pct': rng.uniform(0, 1, n_anomaly),
                               'power_kw': a_power.clip(0), 'label': 1})
    return pd.concat([normal, anomalies], ignore_index=True).sample(frac=1, random_state=42)


def train_anomaly_detector():
    print("Training Isolation Forest for energy anomaly detection…")
    df = generate_energy_data()
    features = ['hour', 'dow', 'temp_c', 'occ_pct', 'power_kw']
    X = df[features].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    clf = IsolationForest(
        n_estimators=200,
        contamination=0.05,
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_scaled)

    # Quick eval on training set
    preds = clf.predict(X_scaled)
    detected = (preds == -1)
    true_anomaly = df['label'].values == 1
    precision = (detected & true_anomaly).sum() / max(detected.sum(), 1)
    recall    = (detected & true_anomaly).sum() / max(true_anomaly.sum(), 1)
    print(f"  Train  precision={precision:.2f}  recall={recall:.2f}  anomalies_detected={detected.sum()}")

    joblib.dump(clf,    os.path.join(ARTEFACT_DIR, 'energy_anomaly.joblib'))
    joblib.dump(scaler, os.path.join(ARTEFACT_DIR, 'energy_scaler.joblib'))
    print(f"  Saved → {ARTEFACT_DIR}/energy_anomaly.joblib")
    return clf, scaler


if __name__ == '__main__':
    train_anomaly_detector()
    print("Done.")
