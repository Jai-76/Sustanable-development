"""
Agri-Tech ML — Pest Risk & Soil Health models.
Usage: python ml/agritech/train.py
Outputs: ml/artefacts/pest_risk.joblib
         ml/artefacts/pest_scaler.joblib
"""
import os
import numpy as np
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

ARTEFACT_DIR = os.path.join(os.path.dirname(__file__), '..', 'artefacts')
os.makedirs(ARTEFACT_DIR, exist_ok=True)


def generate_pest_data(n: int = 3000):
    """
    Features: [temp_c, humidity_pct, growth_stage_enc, rainfall_mm, crop_age_days]
    Label: 1 = pest outbreak within 5 days, 0 = no outbreak
    """
    rng = np.random.default_rng(7)
    temp         = rng.uniform(18, 42, n)
    humidity     = rng.uniform(30, 95, n)
    growth_stage = rng.integers(0, 5, n)       # 0=seedling … 4=harvest
    rainfall     = rng.exponential(3, n)
    crop_age     = rng.integers(10, 120, n)

    # High risk: warm + humid + flowering/fruiting stage
    logit = (0.15 * temp + 0.04 * humidity + 0.3 * growth_stage
             - 0.05 * rainfall - 0.01 * crop_age - 10 + rng.normal(0, 0.5, n))
    prob  = 1 / (1 + np.exp(-logit))
    labels = (rng.uniform(size=n) < prob).astype(int)

    X = np.column_stack([temp, humidity, growth_stage, rainfall, crop_age])
    return X, labels


def train_pest_model():
    print("Training Logistic Regression for pest risk…")
    X, y = generate_pest_data()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_tr = scaler.fit_transform(X_train)
    X_te = scaler.transform(X_test)

    clf = LogisticRegression(max_iter=500, C=1.0, random_state=42)
    clf.fit(X_tr, y_train)

    print(classification_report(y_test, clf.predict(X_te), target_names=['no_risk', 'outbreak']))

    joblib.dump(clf,    os.path.join(ARTEFACT_DIR, 'pest_risk.joblib'))
    joblib.dump(scaler, os.path.join(ARTEFACT_DIR, 'pest_scaler.joblib'))
    print(f"  Saved → {ARTEFACT_DIR}/pest_risk.joblib")
    return clf, scaler


if __name__ == '__main__':
    train_pest_model()
    print("Done.")
