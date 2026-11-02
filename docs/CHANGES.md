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

---

## Phase 6: Demo Accounts & User Roles

- **`backend/database.py`**:
  - Added `role` and `location` columns to `users` table via idempotent `ALTER TABLE ... PRAGMA table_info` guard.
  - Updated `get_user_by_id` and `create_user` to include `role` and `location`.
  - Added `seed_demo_accounts_if_missing()` called at startup — seeds two demo accounts if they don't exist:
    - `farmer@procrop.in` / `password123` → Ramesh Kumar (Farmer, Coimbatore). Seeded with 2 fields and 3 historical predictions (Low / Medium / High).
    - `officer@tnau.ac.in` / `password123` → Dr. S. Kavitha (Extension Officer, Salem). Seeded with 5 fields.
  - Bcrypt password hash used: `$2b$12$w9XNRZDRSx4J2A/x7ZocxuL6YLrHaHoBsCxaGnNH21qtYOSCUMFZW` (corresponds to `password123`).
- **`backend/schemas.py`**: Extended `UserRegisterInput` and `UserResponse` with optional `role` and `location` fields.
- **`backend/app.py`**: `register` passes `role`/`location` to `create_user`; `login` includes `role`/`location` in response.

---

## Phase 7: Frontend — Recommendations Page (Real Data)

- **`src/routes/_app.recommendations.tsx`** completely rewritten.
  - Reads `?id=` from search params via TanStack Router `validateSearch`.
  - Fetches prediction detail from `GET /predictions/{id}` (falls back to `fetchLatestPrediction()` when no ID supplied).
  - Six real data sections:
    1. **Risk badge** — class, score, confidence, ETL progress bar, headline text.
    2. **SHAP drivers** — bar chart of model feature contributions + management modifier cards.
    3. **Photo evidence** — aggregate stats (n_images, confidence_level, mean_per_leaf, SD, 95% CI, burn grade) + per-image breakdown table with QC flags.
    4. **Weather context** — 8-tile weather grid from `weather_snapshot` (temperature, humidity, rainfall, wind, sunshine).
    5. **IPM action plan** — re-scout date, actions list, spray guidance, IRAC rotation note. No brand names or dosages.
    6. **Advisory disclaimer** footer — labels expert priors as unvalidated, recommends agronomist confirmation.
- Navigation: Back to Dashboard and New Field Check links.

---

## Phase 8: Sidebar — Account Switcher & Latest Risk Chip

- **`src/components/layout/Sidebar.tsx`** completely rewritten.
  - **Latest risk chip**: Reads from `fetchLatestPrediction()`; shows risk class (colour-coded), field name, and links to `/recommendations?id=<prediction_id>`. Displayed above the nav links.
  - **Account switcher popover**: Shows all accounts from `getStoredAccounts()`, indicates active account (✓), allows switching, removing, signing out, or adding a second account. Displays user `role` under name in the footer.

---

## Phase 9: Dashboard — Live Prediction Card

- **`src/routes/_app.dashboard.tsx`** updated.
  - Hero banner replaced with a **live backend data card**: shows actual risk class, final_score, confidence level, image count, burn grade, and recommendation headline fetched from `fetchLatestPrediction()`.
  - Links to `/recommendations?id=<prediction_id>`.
  - "Recommended Action" stat tile replaced with live urgency + rescout date.

---

## Phase 9b: Frontend API Service & Type Extensions

- **`src/services/api.ts`**:
  - `StoredAccount` extended with optional `role` and `location`.
  - `loginUser` / `registerUser` save `role` and `location` to stored accounts.
  - `fetchLatestPrediction()` added — fetches the most recent prediction for the current user.
  - `DetailedPredictionResponse` extended with `wind_speed_kmh`, `sunshine_hours` on `weather_snapshot` and `per_image_results` array.
  - `removeAccount` guard fixed for undefined active account.

---

## Quality & Verification (End-to-End)

- **TypeScript**: `npx tsc --noEmit` exits 0 — zero type errors.
- **Prettier**: `npm run format` — zero formatting changes needed.
- **ESLint**: `npm run lint` — 0 errors, 8 pre-existing fast-refresh warnings (in shadcn/ui generated files and one exhaustive-deps advisory).
- **Vite Production Build**: `npm run build` — succeeded in ~769ms.
- **Pytest**: 7/7 tests pass (`test_config.py`, `test_model_info.py`, `test_backend.py` — including migration idempotency, auth isolation, image count validation, and spray monotonicity).
- **Smoke Test**: 5/5 components validated (detector, aggregator, weather, risk engine, recommendation engine).
