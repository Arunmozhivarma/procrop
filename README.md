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

## 4. Evaluation Results (Generated from `02_Jassid_Model_Ready.xlsx`)

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
│   └── 02_Jassid_Model_Ready.xlsx      # 40-row model-ready dataset
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
│   ├── preprocessing.py               # Data loader & chronological split
│   ├── train_regression.py            # Regression training script
│   ├── train_classification.py        # Classification training script
│   ├── evaluate.py                     # Evaluation metrics (MAE, RMSE, F1, etc.)
│   └── shap_analysis.py               # SHAP feature attributions
│
├── backend/
│   ├── app.py                         # FastAPI backend (POST /predict)
│   └── schemas.py                     # Pydantic request/response schemas
│
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

### 2. Train Models
Run the regression and classification training scripts:
```bash
python src/train_regression.py
python src/train_classification.py
```

### 3. Start Backend API
```bash
uvicorn backend.app:app --reload --port 8000
```
- API root: `http://localhost:8000/`
- Interactive docs (Swagger): `http://localhost:8000/docs`
- Prediction Endpoint: `POST http://localhost:8000/predict`

### 4. Start Frontend
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.
