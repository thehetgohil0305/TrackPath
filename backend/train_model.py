from pathlib import Path
import io
import zipfile
import requests
import pandas as pd
import numpy as np
import joblib
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
MODEL_DIR = ROOT / "models"
DATA_DIR.mkdir(exist_ok=True)
MODEL_DIR.mkdir(exist_ok=True)

# UCI dataset archive. If network access fails, manually download the ZIP
# from https://archive.ics.uci.edu/dataset/320/student+performance
UCI_ZIP_URL = "https://archive.ics.uci.edu/static/public/320/student+performance.zip"
CSV_PATH = DATA_DIR / "student-mat.csv"
MODEL_PATH = MODEL_DIR / "student_grade_model.joblib"
METRICS_PATH = MODEL_DIR / "metrics.json"

NUMERIC_FEATURES = [
    "age", "Medu", "Fedu", "traveltime", "studytime", "failures",
    "famrel", "freetime", "goout", "health", "absences"
]
CATEGORICAL_FEATURES = [
    "school", "sex", "address", "famsize", "Pstatus", "Mjob", "Fjob",
    "reason", "guardian", "schoolsup", "famsup", "paid", "activities",
    "nursery", "higher", "internet", "romantic"
]
FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES
TARGET = "G3"

def get_dataset():
    if CSV_PATH.exists():
        return
    print("Downloading UCI Student Performance dataset...")
    try:
        response = requests.get(UCI_ZIP_URL, timeout=30)
        response.raise_for_status()
        with zipfile.ZipFile(io.BytesIO(response.content)) as archive:
            match = next((n for n in archive.namelist() if n.endswith("student-mat.csv")), None)
            if not match:
                raise FileNotFoundError("student-mat.csv not found in downloaded ZIP.")
            CSV_PATH.write_bytes(archive.read(match))
        print(f"Saved dataset to {CSV_PATH}")
    except Exception as exc:
        raise RuntimeError(
            "Could not download the dataset automatically. Download the ZIP from "
            "https://archive.ics.uci.edu/dataset/320/student+performance, "
            "extract student-mat.csv into backend/data/, then rerun this script."
        ) from exc

def main():
    get_dataset()
    df = pd.read_csv(CSV_PATH, sep=";")
    required = set(FEATURES + [TARGET])
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Dataset is missing expected columns: {sorted(missing)}")

    # Deliberately omit G1 and G2 from features: they are strongly correlated
    # with final grade G3 and would change the use case to later-period prediction.
    X = df[FEATURES].copy()
    y = pd.to_numeric(df[TARGET], errors="raise").clip(0, 20)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    numeric_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median"))
    ])
    categorical_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore"))
    ])
    preprocessor = ColumnTransformer([
        ("numeric", numeric_pipe, NUMERIC_FEATURES),
        ("categorical", categorical_pipe, CATEGORICAL_FEATURES)
    ])

    model = RandomForestRegressor(
        n_estimators=300, random_state=42, min_samples_leaf=2, n_jobs=-1
    )
    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", model)
    ])
    pipeline.fit(X_train, y_train)
    predictions = np.clip(pipeline.predict(X_test), 0, 20)

    metrics = {
        "model": "RandomForestRegressor",
        "target": TARGET,
        "target_scale": "0–20",
        "dataset_rows": int(len(df)),
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "features_used": FEATURES,
        "excluded_features": ["G1", "G2"],
        "mae": round(float(mean_absolute_error(y_test, predictions)), 3),
        "rmse": round(float(np.sqrt(mean_squared_error(y_test, predictions))), 3),
        "r2": round(float(r2_score(y_test, predictions)), 3),
        "random_state": 42,
        "test_size": 0.2
    }

    # Feature importances aligned to the transformed feature names.
    transformed_names = pipeline.named_steps["preprocessor"].get_feature_names_out()
    importances = pipeline.named_steps["model"].feature_importances_
    pairs = sorted(
        zip(transformed_names.tolist(), importances.tolist()),
        key=lambda x: x[1], reverse=True
    )[:12]
    metrics["feature_importance"] = [
        {"feature": str(name).replace("numeric__", "").replace("categorical__", ""),
         "importance": round(float(value), 5)}
        for name, value in pairs
    ]

    joblib.dump({
        "pipeline": pipeline,
        "features": FEATURES,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "target": TARGET
    }, MODEL_PATH)
    METRICS_PATH.write_text(__import__("json").dumps(metrics, indent=2), encoding="utf-8")
    print("\nTraining complete.")
    print(f"Rows: {len(df)} | Train: {len(X_train)} | Test: {len(X_test)}")
    print(f"MAE: {metrics['mae']} | RMSE: {metrics['rmse']} | R²: {metrics['r2']}")
    print(f"Model saved: {MODEL_PATH}")
    print(f"Metrics saved: {METRICS_PATH}")

if __name__ == "__main__":
    main()
