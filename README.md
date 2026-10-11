# Machine Learning-Based Prediction of Next-Week Cotton Jassid Risk Using Weather and Historical Pest Data

## Project Title & Scope
**Crop:** Cotton (*Gossypium hirsutum*)  
**Region:** Coimbatore, Tamil Nadu, India (South Zone)  
**Pest:** Jassid (*Amrasca biguttula biguttula*) — measured as Jassids per 3 leaves  
**Source Dataset:** AICRP on Cotton (Table 102) & IMD Weather Summaries  

---

## 1. Project Overview
This project predicts whether Cotton Jassid pest activity will be **LOW** or **HIGH** in the following week for Coimbatore, using a combined dataset of:
- Current week weather conditions (temperature, humidity, rainfall, rainy days, wind speed, sunshine hours)
- Derived weekly weather metrics (`mean_temp_c`, `mean_rh_pct`)
- Lagged weather conditions (`*_lag_1`)
- Recent Jassid population history (`jassid_per_3_leaves`, `jassid_lag_1`, `jassid_lag_2`)

### Data source
The SQLite database `data/procrop.db` is the **single source of truth** for the application. Every record shown or written by the app goes through the FastAPI backend to one of three tables:

| Table | Contents |
| :--- | :--- |
| `weekly_observations` | Model-ready weekly Jassid counts, weather features, lags and targets |
| `predictions` | Every prediction made by the app, with its inputs and SHAP summary |
| `users` | Accounts (name, email, salted password hash) |

No code reads spreadsheets. The `.xlsx` files in the repository are archival research files only; an empty table is reported as empty and is never re-seeded from a file. Live weather comes from the Open-Meteo API through the backend.

---

## 2. Research Question & Feature Configurations
> **Research Question:** *"Can historical weather conditions and recent Jassid population history be used to predict next-week Jassid activity and classify cotton pest risk in Coimbatore?"*

To evaluate the contribution of historical pest counts, two feature configurations were built and compared on the exact same chronological test split:

- **Model A (Weather Only):** Temperature, humidity, rainfall, rainy days, wind speed, sunshine hours and their 1-week lagged values.
- **Model B (Weather + Pest History):** All Model A features **plus** current Jassid count (`jassid_per_3_leaves`), `jassid_lag_1`, and `jassid_lag_2`.

---

## 3. Classification Threshold Disclaimer
- **Classification Rule:** `target_high_risk_median_rule` (≥ 1.95 Jassids per 3 leaves → HIGH RISK).
- **Important Note:** *Since a verified ICAR threshold was not established for this dataset, an experimental median-based classification rule was used, with 1.95 Jassids per 3 leaves as the cutoff. This is a data-derived research classification rule and not an official ICAR economic threshold level (ETL).*

---

## 4. Evaluation Results (40-row model-ready dataset, stored in `weekly_observations`)

### Regression Models (`target_next_week_jassid`)

| Feature Set | Model | MAE | RMSE | R² |
| :--- | :--- | :---: | :---: | :---: |
| Baseline | Naive (Current Jassid count) | 2.8100 | 3.5198 | 0.0441 |
| Model A (Weather Only) | Random Forest Regressor | 3.2295 | 4.4168 | -0.5052 |
| Model A (Weather Only) | XGBoost Regressor | 3.1311 | 3.8745 | -0.1583 |
| **Model B (Weather + Pest History)** | **Random Forest Regressor** | **2.6519** | **3.1717** | **0.2238** |
| **Model B (Weather + Pest History)** | **XGBoost Regressor** | **2.1953** | **3.1312** | **0.2435** |

### Classification Models (`target_high_risk_median_rule`)

| Feature Set | Model | Accuracy | Precision | Recall | F1-Score | Confusion Matrix |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| Model A (Weather Only) | Random Forest Classifier | 0.3000 | 0.0000 | 0.0000 | 0.0000 | `[[3, 0], [7, 0]]` |
| Model A (Weather Only) | XGBoost Classifier | 0.7000 | 0.8333 | 0.7143 | 0.7692 | `[[2, 1], [2, 5]]` |
| Model B (Weather + Pest History) | Random Forest Classifier | 0.5000 | 1.0000 | 0.2857 | 0.4444 | `[[3, 0], [5, 2]]` |
| **Model B (Weather + Pest History)** | **XGBoost Classifier** | **0.7000** | **1.0000** | **0.5714** | **0.7273** | `[[3, 0], [3, 4]]` |

> **Research Conclusion:** Model B (Weather + Pest History) consistently achieves lower MAE/RMSE and positive R² compared to Model A (Weather-only) and Naive Baseline. Including recent Jassid lag features significantly improves next-week risk predictions.

---

## 5. Project Structure
```
procrop/
│
├── data/
│   └── procrop.db                     # SQLite database (weekly_observations, predictions, users)
│
├── models/
│   ├── rf_regressor.pkl               # Trained RF regressor
│   ├── xgb_regressor.pkl              # Trained XGBoost regressor
│   ├── rf_classifier.pkl             # Trained RF classifier
│   ├── xgb_classifier.pkl            # Trained XGBoost classifier
│   ├── regression_metadata.pkl       # Regression metadata & feature order
│   └── classification_metadata.pkl   # Classification metadata
│
├── src/
│   ├── preprocessing.py               # Data loader (reads SQLite) & chronological split
│   ├── train_regression.py            # Regression training script
│   ├── train_classification.py        # Classification training script
│   ├── evaluate.py                     # Evaluation metrics (MAE, RMSE, F1, etc.)
│   └── shap_analysis.py               # SHAP feature attributions
│
├── backend/
│   ├── app.py                         # FastAPI backend (dataset, prediction and weather endpoints)
│   ├── database.py                    # SQLite access for all three tables
│   ├── auth.py                        # Register / login / profile on the users table
│   ├── weather_service.py             # Live Open-Meteo weather for Coimbatore
│   ├── vision_detector.py             # Leaf image pest count
│   └── schemas.py                     # Pydantic request/response schemas
│
├── tests/                             # API tests (run on a copy of the database)
│
├── src/services/api.ts                # Frontend API client (all backend calls)
├── src/services/queries.ts            # React Query hooks used by the pages
├── src/features/landing/LandingView.tsx # Web Landing Page
├── src/routes/                        # TanStack Router Dashboard pages
├── requirements.txt                   # Python dependencies
└── README.md                          # Project documentation
```

---

## 6. Installation & Execution Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ or Bun

### 1. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 2. Train Models (optional — trained models are included)
The training scripts read `weekly_observations` from the SQLite database and overwrite the files in `models/`:
```bash
python src/train_regression.py
python src/train_classification.py
```
> **Retraining changes the results in section 4.** The scripts order observations chronologically (2020-21 → 2024), so the test split is the last 10 weeks of 2024. The included models and the section 4 figures were produced by the earlier loader, which sorted the 2020-21 season last (test split: 3 weeks of 2024 plus all of 2020-21).

### 3. Start Backend API
```bash
uvicorn backend.app:app --reload --port 8000
```
- API root: `http://localhost:8000/`
- Interactive docs (Swagger): `http://localhost:8000/docs`

| Endpoint | Purpose |
| :--- | :--- |
| `GET /dataset/summary`, `GET /dataset/observations`, `GET /dataset/previous-week` | Read `weekly_observations` |
| `GET /predictions`, `GET /predictions/latest` | Read saved predictions |
| `POST /predict-unified`, `POST /auto-predict`, `POST /dataset/predict-latest`, `POST /predict` | Run the model and save the result to `predictions` |
| `POST /analyze-leaf-image` | Leaf image pest count only |
| `GET /weather/coimbatore` | Live Open-Meteo weather |
| `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/me` | Accounts in `users` |

Errors: `404` when a table has no matching row, `422` when a required column is NULL, `503` when the database or the weather service is unavailable.

### 4. Start Frontend
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### Configuration (environment variables)
| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend URL used by the frontend |
| `PROCROP_DB_PATH` | `data/procrop.db` | Database file used by the backend. The file must exist; it is never created. |
| `PROCROP_SECRET_KEY` | generated into `data/.session_secret` | Key that signs sign-in tokens |

### 5. Run Tests
```bash
pip install -r requirements-dev.txt
python -m pytest tests
```
The tests copy `data/procrop.db` to a temporary folder and verify the real file is unchanged.
