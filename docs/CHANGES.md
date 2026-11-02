# ProCrop Changelog & Upgrade Decisions

This document records architectural decisions, real model metrics, expert priors, known limitations, and changes made during the system upgrade.

---

## Phase 0: Baseline Assessment & Findings

- **Branch**: Working strictly on `rich` branch. Never modifying `main`.
- **Vision Detector Inspection**:
  - `backend/vision_detector.py` was inspected and found to be a pseudo-random heuristic using MD5 hashes and rudimentary RGB pixel counts. It does not use any trained neural network weights.
  - Decision: Will implement a real computer vision pipeline with YOLOv8n / PyTorch and image tiling, evaluate it on real cotton jassid data, report honest metrics in `backend/models/detector_metrics.json`, and retain a classical fallback labeled as "heuristic".
- **Hopper Burn Logic**:
  - Found to be completely non-existent in the existing codebase.
  - Decision: Implement an HSV-based leaf margin chlorosis/necrosis analyzer mapping to the 0-4 ICCC/ICAR injury scale, and evaluate leaf reddening/burning.
- **Risk Models**:
  - Existing models (`xgb_regressor.pkl`, `rf_regressor.pkl`) used a simple 75/25 split and classified risk using a non-agronomic median rule (1.95 per 3 leaves).
  - Decision: Retrain with Leave-One-Season-Out Cross-Validation (LOSOCV) across all 4 seasons in `02_Jassid_Model_Ready.xlsx`, compare with naive persistence baseline ($y_{t+1} = y_t$), and calibrate against ICAR/TNAU ETL (2 jassids/leaf = 6 per 3 leaves).
- **Authentication**:
  - Existing frontend authentication was simulated with local storage and timeout.
  - Decision: Implement secure backend authentication with bcrypt password hashing, JWT tokens with server-side revocation, per-user database isolation, and multi-account switching.

---

## Phase 1: Shared Configuration (Single Source of Truth)

- **Backend Configuration File**: Created `backend/config/app_config.json`.
  - Image constraints: `MIN_IMAGES = 5` (hard lower bound), `TARGET_IMAGES = 15`, `MAX_IMAGES = 30`, `MAX_IMAGE_MB = 8`.
  - Client compression parameters: max long side 1600 px, quality 0.85 JPEG.
  - Economic Threshold Level (ETL): Sourced from ICAR-CICR and TNAU Agritech Portal Cotton IPM guidelines: 2 nymphs per leaf (equivalent to 6 nymphs per 3 leaves), or Grade II hopper burn injury symptoms.
  - Risk class cut-offs:
    - **Low**: < 50% ETL (< 1.0 jassid/leaf, < 3.0 jassids/3 leaves) and hopper burn grade <= 1.
    - **Medium**: 50–100% ETL (1.0–2.0 jassids/leaf, 3.0–6.0 jassids/3 leaves) or grade 2 appearing.
    - **High**: >= 100% ETL (>= 2.0 jassids/leaf, >= 6.0 jassids/3 leaves) or widespread grade >= 2 (>= 25% of leaves).
  - Sampling protocol: 5 plants $\times$ 3 leaves (top, middle, bottom), underside orientation.
- **Backend Endpoints**:
  - `GET /health`: Basic operational probe.
  - `GET /api/config`: Exposes `app_config.json` directly to frontend and client apps.
- **Frontend Integration**:
  - Added `AppConfig` type and `fetchAppConfig()` with fallback `DEFAULT_APP_CONFIG` in `src/services/api.ts`.
- **Verification**:
  - `tests/test_config.py` passes asserting upload bounds, ETL definitions, and risk class thresholds.

