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
