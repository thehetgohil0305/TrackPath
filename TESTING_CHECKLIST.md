# Testing checklist

## Backend
- [ ] `python train_model.py` completes and prints MAE/RMSE/R².
- [ ] `GET http://127.0.0.1:5000/api/health` returns `{"status":"ok","model_loaded":true}`.
- [ ] `GET http://127.0.0.1:5000/api/overview` returns metrics and dataset overview.
- [ ] Valid `POST /api/predict` returns `predicted_grade`, `performance_category`, and disclaimer.
- [ ] Invalid numeric value (e.g. age 99) returns HTTP 400 with an error.
- [ ] Valid batch CSV returns a downloadable `edupredict_results.csv`.
- [ ] Non-CSV upload or missing feature columns is rejected.

## Frontend
- [ ] Frontend loads at Vite URL.
- [ ] API status changes to connected when Flask is running.
- [ ] Dashboard metrics load after model training.
- [ ] Predict button produces a grade.
- [ ] Reset button resets form.
- [ ] Batch CSV upload downloads output.
- [ ] Charts render.
- [ ] Layout is usable on narrow screens.

## Evidence to capture
1. Main dashboard
2. Model metrics
3. Prediction form and result
4. Batch prediction upload and output CSV
5. Terminal showing training metrics
