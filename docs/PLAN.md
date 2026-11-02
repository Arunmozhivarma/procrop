# ProCrop Upgrade Plan

## Phase 0: Inspection Findings & Current State Analysis

### 1. File Structure & Existing Components
- **Backend**:
  - `backend/app.py`: FastAPI application exposing prediction and dataset endpoints.
  - `backend/database.py`: SQLite layer managing `data/procrop.db`. Existing tables: `weekly_observations` (40 rows seeded from `02_Jassid_Model_Ready.xlsx`), `predictions` (9 rows).
  - `backend/schemas.py`: Pydantic input/output models.
  - `backend/vision_detector.py`: Leaf photo analysis function `analyze_cotton_leaf_image`.
  - `backend/weather_service.py`: Open-Meteo weather integration for Coimbatore coordinates.
  - `src/preprocessing.py`, `src/train_regression.py`, `src/train_classification.py`, `src/evaluate.py`, `src/shap_analysis.py`: Model training and evaluation scripts.
  - `models/`: Serialized models `xgb_regressor.pkl`, `rf_regressor.pkl`, `xgb_classifier.pkl`, `rf_classifier.pkl`, and metadata pickles.
- **Frontend**:
  - Stack: React 19, TanStack Start (Router + Nitro), TypeScript, Tailwind CSS v4, Radix UI, Sonner, Lucide React.
  - Routes: `src/routes/__root.tsx`, `src/routes/_app.tsx`, `src/routes/auth.tsx`, `src/routes/_app.dashboard.tsx`, `src/routes/_app.risk.tsx`, `src/routes/_app.recommendations.tsx`, `src/routes/_app.about.tsx`, `src/routes/_app.images.tsx`, etc.
  - Navigation: `src/config/navigation.ts`, `src/components/layout/Sidebar.tsx`.

### 2. Critical Findings: Real Models vs Heuristics
1. **Vision Detector (`backend/vision_detector.py`)**:
   - **Current Status**: **Heuristic / Simulated**. It checks filenames for keywords ("heavy", "moderate", "mild") and falls back to naive RGB thresholding and deterministic pseudo-random bounding boxes derived from MD5 hashes of image bytes (`((img_hash + i * 37) % 70) + 15`). There are no neural network weights or genuine object detector.
   - **Upgrade Plan**: Replace with a real lightweight model (ultralytics YOLOv8n / PyTorch detector) trained or calibrated on cotton leafhopper datasets, with image slicing/tiling for tiny insects, and report true precision, recall, mAP@0.5, and count MAE in `backend/models/detector_metrics.json`. If public datasets are small, explicitly document metrics and provide an honest classical vision fallback clearly labeled as "heuristic".
2. **Hopper Burn Grader**:
   - **Current Status**: **Non-existent**.
   - **Upgrade Plan**: Implement leaf segmentation followed by HSV margin and chlorosis/necrosis color grading (grades 0 to 4 matching ICAR/ICCC damage scale), reporting leaf area affected and edge-weighted discoloration.
3. **Risk Models**:
   - **Current Status**: Random Forest and XGBoost trained with an arbitrary chronological 75/25 split without cross-validation or formal comparison to a naive persistence baseline. The classification target was set using a median rule (`1.95` per 3 leaves) rather than an agronomic Economic Threshold Level (ETL).
   - **Upgrade Plan**: Retrain regression and classification using Leave-One-Season-Out Cross-Validation (LOSOCV) across all 4 seasons in `02_Jassid_Model_Ready.xlsx`. Compare honestly against a persistence baseline ($y_{t+1} = y_t$). Align risk thresholds with ICAR/TNAU ETL guidance (2 nymphs/leaf = 6 per 3 leaves). Save models and verified metrics to `backend/models/risk_metrics.json`.
4. **Agronomic Modifiers**:
   - **Current Status**: Absent. No spray history, variety traits, nitrogen, or alternate host effects.
   - **Upgrade Plan**: Implement config-driven transparent multiplier layer (`backend/config/risk_modifiers.json`), labeled on UI and documentation as "expert-rule priors, to be validated with an agronomist".
5. **Authentication & Multi-Tenancy**:
   - **Current Status**: Client-only fake authentication storing email in `localStorage` with a `setTimeout`. No `users` table, no password hashing, no tokens, no per-user data isolation.
   - **Upgrade Plan**: Implement real password hashing (bcrypt), JWT sessions with server-side revocation / token versioning, `users` and `fields` database tables, per-user query scoping, and multi-account switching in the UI.

---

## Detailed Phased Execution Plan

1. **Phase 1: Shared Configuration**
   - Create `backend/config/app_config.json` defining `MIN_IMAGES = 5`, `TARGET_IMAGES = 15`, `MAX_IMAGES = 30`, `MAX_IMAGE_MB = 8`, ICAR/TNAU ETL (2 jassids/leaf = 6 per 3 leaves), and risk class cut-offs.
   - Expose via `GET /api/config`.
   - Update frontend API service to consume `/api/config`.

2. **Phase 2: Photo Upload (Frontend)**
   - Transform upload into 15-photo guided capture: 5 plants $\times$ top, middle, bottom leaf underside.
   - Real-time progress counter ("N / 15") and progress bar (red <5, amber 5-14, green 15+).
   - Strict notification copy as specified.
   - Client-side image validation and JPEG compression (max 1600px long side, 0.85 quality).
   - Real example images panel (`frontend/public/examples/`) with attributions in `CREDITS.md`.

3. **Phase 3: Field and Crop Inputs (3-Step Wizard)**
   - Step 1: Field & Crop (name, location, sowing date, variety, traits, spray history, optional agronomy).
   - Step 2: 15-Leaf Photo Capture.
   - Step 3: Review & Submit.
   - Session storage drafting, pre-filling from previous field checks, and SQLite `fields` table.

4. **Phase 4: Real Vision Models & Aggregation**
   - Object detector for cotton jassid adults and nymphs (YOLOv8n / PyTorch), high-resolution inference, image tiling.
   - True evaluation: precision, recall, mAP@0.5, MAE per image saved to `backend/models/detector_metrics.json`.
   - Leafhopper burn grading (0-4 ICCC/ICAR scale) using leaf segmentation and HSV margin chlorosis analysis.
   - Aggregation: per-leaf mean, SD, CV, variance-to-mean ratio, 95% bootstrap CI, burn grade summary, and confidence score.

5. **Phase 5: Retrained Risk Model & Expert Priors**
   - Leave-One-Season-Out Cross-Validation on `02_Jassid_Model_Ready.xlsx`.
   - Persistence baseline comparison; save metrics to `backend/models/risk_metrics.json`.
   - Configurable management modifier layer (`backend/config/risk_modifiers.json`).
   - Feedback loop: store predictions with inputs snapshot for future actual vs predicted tracking.

6. **Phase 6: Unified Recommendation Page & Risk Chips**
   - Single recommendation route `/recommendation/$predictionId` and `/recommendation` (latest).
   - Risk badge, SHAP drivers, modifier breakdown, photo evidence, next-week weather, rule-based decision table (`backend/recommendation.py`).
   - Prominent "Latest Risk" chip in sidebar/header and dashboard card.

7. **Phase 7: Accounts, Multi-Account Switching & Isolation**
   - User registration, login, logout, `GET /auth/me` with bcrypt and JWT.
   - Client-side multi-account token store with fast switching and `queryClient.clear()`.
   - SQLite schema migrations: `users`, `fields`, updated `predictions` with `user_id`.
   - Per-user query isolation with tests.
   - Image storage under `data/uploads/<user_id>/<prediction_id>/`.

8. **Phase 8: About & Methods Page**
   - Route `/how-it-works` (nav: "About & Methods") reading live metadata from `GET /api/model-info`.
   - SVG interactive pipeline diagram, step-by-step code trace, dataset registry with citations, live metrics, and limitations.
   - File verification test.

9. **Phase 9: UI Polish & Mobile Optimization**
   - Mobile-first responsive audit (360x740, 768x1024, 1440x900).
   - Toast integration, loading states, accessibility audit.

10. **Phase 10: Backend API Validation & Contract**
    - Complete API endpoints: `/health`, `/api/config`, `/api/model-info`, `/auth/*`, `/fields`, `/predict`.
    - Robust multipart request validation and structured error payloads.

11. **Phase 11: Verification & Tests**
    - Unit tests (`pytest`), smoke tests (`scripts/smoke_test.py`), end-to-end tests (Playwright).
    - Documentation in `docs/CHANGES.md` and updated `README.md`.
