# EduPredict AI — Student Academic Performance Prediction

Full-stack college project:
- Frontend: React + Vite + Bootstrap + Recharts
- Backend: Flask REST API
- ML: scikit-learn RandomForestRegressor
- Dataset: UCI Student Performance (Math CSV)

## What it does
1. Predicts final grade G3 (0–20) using study time, absences, past failures, and demographic/social factors.
2. Shows real evaluation metrics (MAE, RMSE, R²) calculated from a held-out test set.
3. Shows dataset overview and feature-importance charts.
4. Accepts CSV files for batch prediction.

## Important limitation
The UCI data comes from two Portuguese secondary schools, not an Indian university. This is an educational prototype, not a validated student-advising or admissions tool. It predicts an academic grade, not dropout. The model intentionally excludes G1/G2 earlier-period grades to avoid relying on those highly predictive variables.

## Requirements
- Python 3.10+ (Python 3.11 recommended)
- Node.js 20+ and npm
- Internet only for first-time package installation and dataset download

## 1. Backend setup (Windows PowerShell)
Open a terminal in this folder:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python train_model.py
python app.py
```

If PowerShell blocks activation, run this once in the same terminal:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```
Alternative without activation:
```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe train_model.py
.\.venv\Scripts\python.exe app.py
```

The first training run downloads `student.zip` from the official UCI dataset page if no local CSV exists. If the download fails, download the ZIP manually from https://archive.ics.uci.edu/dataset/320/student+performance and place `student-mat.csv` in `backend/data/`.

Backend runs at http://127.0.0.1:5000

## 2. Frontend setup
Open a SECOND terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Features / API
- `GET /api/health` — backend and model status
- `GET /api/overview` — dataset overview, model metrics, feature importance
- `POST /api/predict` — predict one student (JSON)
- `POST /api/predict-batch` — upload CSV file, returns downloadable predictions CSV

## Single prediction fields
`age` (15–22), `studytime` (1–4), `failures` (0–3), `absences` (0–93), `traveltime` (1–4), `famrel` (1–5), `freetime` (1–5), `goout` (1–5), `health` (1–5), `Medu` (0–4), `Fedu` (0–4), and yes/no fields `schoolsup`, `famsup`, `paid`, `activities`, `higher`, `internet`.

## Quick test
With backend running:
```powershell
Invoke-RestMethod http://127.0.0.1:5000/api/health
```

Example prediction:
```powershell
$body = @{
  age=17; studytime=3; failures=0; absences=4; traveltime=1
  famrel=4; freetime=3; goout=2; health=4; Medu=3; Fedu=2
  schoolsup="no"; famsup="yes"; paid="no"; activities="yes"
  higher="yes"; internet="yes"
} | ConvertTo-Json
Invoke-RestMethod -Uri http://127.0.0.1:5000/api/predict -Method Post -ContentType "application/json" -Body $body
```

## Suggested project report
1. Abstract
2. Problem statement and objectives
3. Dataset description and source
4. System architecture
5. Data preprocessing and feature selection
6. Model and training procedure
7. Evaluation metrics (copy actual values from app)
8. Screenshots and testing
9. Limitations and future scope
10. Conclusion and references

## References
- UCI Student Performance: https://archive.ics.uci.edu/dataset/320/student+performance
- Flask documentation: https://flask.palletsprojects.com/
- scikit-learn RandomForestRegressor: https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestRegressor.html
- React documentation: https://react.dev/
- Vite guide: https://vite.dev/guide/
- Bootstrap: https://getbootstrap.com/
