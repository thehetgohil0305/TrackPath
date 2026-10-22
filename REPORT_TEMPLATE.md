# EduPredict AI: Student Academic Performance Prediction

## 1. Abstract
EduPredict AI is a full-stack machine-learning prototype that estimates a student's final mathematics grade from selected background, study, and support-related features. A Random Forest regression model is exposed through a Flask REST API and consumed by a React and Bootstrap web application. The dashboard presents dataset statistics, evaluation metrics, grade distribution, feature importance, and single/batch predictions.

## 2. Problem statement
Academic performance is influenced by multiple factors, and educators may benefit from exploratory tools that summarize patterns in historical data. This project investigates whether a supervised regression model can estimate a final grade from selected student features and demonstrates how the model can be integrated into a web application.

## 3. Objectives
- Prepare and inspect a public student-performance dataset.
- Train a regression model and evaluate it on held-out data.
- Expose prediction functionality through REST endpoints.
- Build a responsive frontend for predictions and visual analytics.
- Document limitations and avoid treating predictions as definitive judgments.

## 4. Dataset
Source: UCI Student Performance, https://archive.ics.uci.edu/dataset/320/student+performance
The dataset covers secondary education at two Portuguese schools. This implementation uses the mathematics CSV. The target is G3, the final-period grade, on a 0–20 scale. G1 and G2 are excluded from model features because they are strongly correlated with G3 and are not required for this version's use case.

## 5. Technologies
- Python, Pandas, NumPy
- Scikit-learn RandomForestRegressor and preprocessing Pipeline
- Flask and Flask-CORS
- React, Vite, Bootstrap, Bootstrap Icons, Recharts, Axios
- Joblib for saving the trained model

## 6. Methodology
1. Load the CSV.
2. Separate features and target.
3. Split data into 80% training and 20% testing using random_state=42.
4. Impute numeric and categorical values.
5. One-hot encode categorical fields.
6. Train RandomForestRegressor.
7. Calculate MAE, RMSE, and R² on the held-out test set.
8. Save model artifacts and metrics.
9. Serve predictions through Flask.
10. Display outputs in the React frontend.

## 7. Results
Fill this section with the real values printed by `python train_model.py`:
- Dataset rows: [copy from console]
- Training rows: [copy from console]
- Test rows: [copy from console]
- MAE: [copy from console]
- RMSE: [copy from console]
- R²: [copy from console]

Do not invent or alter evaluation metrics.

## 8. System architecture
Browser (React + Bootstrap) → Flask REST API → saved scikit-learn pipeline → prediction JSON → frontend result.
The dashboard also fetches dataset statistics and model metrics from Flask.

## 9. Testing
Record the outcome of each test:
- API health endpoint returns status ok after training.
- Valid single-student input returns a grade from 0 to 20.
- Out-of-range input is rejected with HTTP 400.
- Dataset overview returns metrics and grade distribution.
- Valid batch CSV returns a downloadable predictions CSV.
- Invalid file type or missing required columns returns a useful error.
- Frontend remains usable on desktop and mobile widths.

## 10. Limitations and ethics
- The dataset represents two Portuguese secondary schools and may not generalize to other countries, institutions, or age groups.
- The model estimates historical patterns and should not be used as the sole basis for educational decisions.
- Model feature importance does not establish causality.
- Performance varies by split and data distribution.
- The grade bands used in the UI are illustrative; the underlying dataset's grading system and pass thresholds must be interpreted in context.

## 11. Future scope
- Validate on institution-specific data with appropriate permission.
- Add cross-validation and compare additional models.
- Add explainability methods such as permutation importance or SHAP.
- Add authentication, role-based access, persistence, and deployment.
- Add monitoring for data drift and model performance.

## 12. References
1. Cortez, P. (2008). Student Performance [Dataset]. UCI Machine Learning Repository. https://doi.org/10.24432/C5TG7T
2. Flask documentation: https://flask.palletsprojects.com/
3. scikit-learn RandomForestRegressor: https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestRegressor.html
4. React documentation: https://react.dev/
5. Vite guide: https://vite.dev/guide/
6. Bootstrap documentation: https://getbootstrap.com/
