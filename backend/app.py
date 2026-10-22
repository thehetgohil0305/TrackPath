from pathlib import Path
import json
import io
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
MODEL_DIR = ROOT / "models"
MODEL_PATH = MODEL_DIR / "student_grade_model.joblib"
METRICS_PATH = MODEL_DIR / "metrics.json"
CSV_PATH = DATA_DIR / "student-mat.csv"

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

bundle = None
metrics = None

def load_artifacts():
    global bundle, metrics
    if not MODEL_PATH.exists() or not METRICS_PATH.exists():
        raise RuntimeError("Model files are missing. Run `python train_model.py` first.")
    bundle = joblib.load(MODEL_PATH)
    metrics = json.loads(METRICS_PATH.read_text(encoding="utf-8"))

def require_artifacts():
    if bundle is None or metrics is None:
        load_artifacts()

def validate_student(payload):
    if not isinstance(payload, dict):
        raise ValueError("Request body must be a JSON object.")
    defaults = {
        "school": "GP", "sex": "F", "address": "U", "famsize": "GT3",
        "Pstatus": "T", "Mjob": "other", "Fjob": "other", "reason": "course",
        "guardian": "mother", "schoolsup": "no", "famsup": "yes", "paid": "no",
        "activities": "yes", "nursery": "yes", "higher": "yes",
        "internet": "yes", "romantic": "no",
        "age": 17, "Medu": 2, "Fedu": 2, "traveltime": 1, "studytime": 2,
        "failures": 0, "famrel": 4, "freetime": 3, "goout": 3,
        "health": 4, "absences": 4
    }
    defaults.update(payload)
    numeric_ranges = {
        "age": (15, 22), "Medu": (0, 4), "Fedu": (0, 4),
        "traveltime": (1, 4), "studytime": (1, 4), "failures": (0, 4),
        "famrel": (1, 5), "freetime": (1, 5), "goout": (1, 5),
        "health": (1, 5), "absences": (0, 93)
    }
    for key, (low, high) in numeric_ranges.items():
        try:
            value = float(defaults[key])
        except (TypeError, ValueError):
            raise ValueError(f"{key} must be a number.")
        if not np.isfinite(value) or not low <= value <= high:
            raise ValueError(f"{key} must be between {low} and {high}.")
        defaults[key] = int(value)

    allowed = {
        "school": ["GP", "MS"], "sex": ["F", "M"], "address": ["U", "R"],
        "famsize": ["LE3", "GT3"], "Pstatus": ["T", "A"],
        "Mjob": ["teacher", "health", "services", "at_home", "other"],
        "Fjob": ["teacher", "health", "services", "at_home", "other"],
        "reason": ["home", "reputation", "course", "other"],
        "guardian": ["mother", "father", "other"]
    }
    for key in ["schoolsup", "famsup", "paid", "activities", "nursery", "higher", "internet", "romantic"]:
        allowed[key] = ["yes", "no"]
    for key, options in allowed.items():
        if defaults[key] not in options:
            raise ValueError(f"{key} must be one of: {', '.join(options)}.")
    return defaults

@app.get("/api/health")
def health():
    try:
        require_artifacts()
        return jsonify({"status": "ok", "model_loaded": True})
    except Exception as exc:
        return jsonify({"status": "error", "model_loaded": False, "message": str(exc)}), 503

@app.get("/api/overview")
def overview():
    try:
        require_artifacts()
        data = {
            "metrics": metrics,
            "dataset": {
                "name": "UCI Student Performance (Mathematics)",
                "source": "https://archive.ics.uci.edu/dataset/320/student+performance",
                "rows": metrics["dataset_rows"],
                "target": "G3 final grade (0–20)",
                "note": "Portuguese secondary-school dataset; educational prototype only."
            }
        }
        if CSV_PATH.exists():
            df = pd.read_csv(CSV_PATH, sep=";")
            data["dataset"]["mean_grade"] = round(float(df["G3"].mean()), 2)
            data["dataset"]["pass_rate"] = round(float((df["G3"] >= 10).mean() * 100), 1)
            data["dataset"]["mean_absences"] = round(float(df["absences"].mean()), 2)
            grade_counts = df["G3"].value_counts().sort_index()
            data["grade_distribution"] = [
                {"grade": int(k), "count": int(v)} for k, v in grade_counts.items()
            ]
        return jsonify(data)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

@app.post("/api/predict")
def predict():
    try:
        require_artifacts()
        student = validate_student(request.get_json(silent=True) or {})
        frame = pd.DataFrame([student])[bundle["features"]]
        predicted = float(np.clip(bundle["pipeline"].predict(frame)[0], 0, 20))
        category = "Needs support" if predicted < 10 else ("Developing" if predicted < 14 else "Strong")
        return jsonify({
            "predicted_grade": round(predicted, 2),
            "performance_category": category,
            "scale": "0–20",
            "disclaimer": "An estimate from historical data, not a definitive judgement of a student."
        })
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

@app.post("/api/predict-batch")
def predict_batch():
    try:
        require_artifacts()
        if "file" not in request.files:
            return jsonify({"error": "Upload a CSV file using the field name 'file'."}), 400
        file = request.files["file"]
        if not file.filename.lower().endswith(".csv"):
            return jsonify({"error": "Only CSV files are supported."}), 400
        df = pd.read_csv(file)
        required = set(bundle["features"])
        missing = required - set(df.columns)
        if missing:
            return jsonify({"error": "CSV is missing columns: " + ", ".join(sorted(missing))}), 400
        X = df[bundle["features"]].copy()
        predictions = np.clip(bundle["pipeline"].predict(X), 0, 20)
        result = df.copy()
        result["predicted_G3"] = np.round(predictions, 2)
        result["performance_category"] = [
            "Needs support" if x < 10 else ("Developing" if x < 14 else "Strong")
            for x in predictions
        ]
        buffer = io.BytesIO()
        result.to_csv(buffer, index=False)
        buffer.seek(0)
        return send_file(buffer, mimetype="text/csv", as_attachment=True, download_name="edupredict_results.csv")
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400

if __name__ == "__main__":
    try:
        load_artifacts()
        print("EduPredict API starting at http://127.0.0.1:5000")
    except Exception as exc:
        print(f"Warning: {exc}")
        print("Run `python train_model.py` before making predictions.")
    app.run(host="127.0.0.1", port=5000, debug=True)
