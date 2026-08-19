# ProCrop — Full Platform Build

Restore the uploaded ProCrop app into this project, then extend it into a complete, premium AI agricultural decision-support platform driven by the workflow: Collect → Monitor → Predict Risk → Request Image → Analyze → Explain → Recommend → Alert → Track.

All data will be realistic front-end mock data (no backend yet), with real interactions: filters, charts, modals, forms, loading/empty/error/success states, and responsive layouts.

## Step 1 — Restore the existing app

Bring in from the upload (excluding any git metadata):
- Design system (`src/styles.css`): Fraunces + DM Sans, earthy green/off-white oklch tokens, soft shadows.
- Existing pages: Overview, Analysis, Diagnostic, Care Path.
- Shared `Sidebar` and `Icon` components.

## Step 2 — Restructure navigation

Replace the flat 4-link sidebar with a grouped app shell (collapsible sidebar + topbar with farm/field switcher, search, alerts bell, profile menu).

```text
Marketing      /            landing page (public)
Auth           /auth        login / register / forgot password
Dashboard      /dashboard   ProCrop Health Score centrepiece
Farms          /farms, /farms/$farmId, /fields/$fieldId
Crops          /crops, /crops/$cropId
Soil           /soil, /soil/history, /soil/nutrients
Environment    /environment, /environment/forecast
Risk           /risk, /risk/pest, /risk/disease
Images         /images, /images/upload, /images/$analysisId
Explain        /explain, /explain/$predictionId
Recommend      /recommendations, /recommendations/$id
Alerts         /alerts, /alerts/settings
Analytics      /analytics, /reports
Devices        /devices, /devices/$deviceId
Settings       /settings/profile, /settings/farm, /settings/thresholds, /settings/integrations
Help           /help, /about
```

The existing Analysis / Diagnostic / Care Path pages fold into Analytics, Image Analysis, and Recommendations respectively (old paths redirect).

## Step 3 — Pages to build

**Landing (`/`)** — hero, How ProCrop Works (9-stage flow), Multimodal AI, Soil Monitoring, Pest & Disease Risk, Image Analysis, Explainable AI, Recommendations, IoT, Analytics, CTA.

**Auth** — login, register, forgot password; mock session stored client-side to gate app routes.

**Dashboard** — ProCrop Health Score gauge (e.g. 78/100 · Moderate Risk), sub-scores for soil, environment, disease risk, pest risk, image health; recent alerts, AI recommendations, latest image analyses, trend sparklines, field status grid. Risk levels colour-coded Low / Moderate / High / Critical.

**Farms & Fields** — farm list, farm detail with field map/sectors, field detail (crop, growth stage, health history, sensors, last analyses), add/edit field forms.

**Crops** — crop registry, crop type + growth-stage tracking, crop calendar, crop detail with per-stage risk profile.

**Soil** — current readings for moisture, pH, N, P, K, soil temperature with healthy-range bars, soil health score, deficiency warnings, historical charts, trend analysis, per-field comparison.

**Environment** — temperature, humidity, rainfall trends, weather-driven crop stress index, environmental risk contribution, forecast view.

**Risk prediction** — structured-data prediction UI laid out as Agricultural Data → AI Model → Risk Assessment → Explanation → Recommendation; disease-risk and pest-risk sub-pages with risk timeline, model outputs (Random Forest / XGBoost framing), confidence, and the trigger that prompts image upload when risk is high.

**Image analysis** — upload with drag-and-drop, capture guidance, queue with processing state, result page with predicted disease, confidence, severity, Grad-CAM heatmap overlay toggle, and history gallery with filters.

**Explainability** — SHAP-style feature-contribution charts for structured predictions, Grad-CAM view for images, plain-language "why this risk" narrative.

**Recommendations** — prioritized action cards (irrigation, nutrients, monitoring, preventive pest control), detail page with steps, timing, expected impact, mark-as-done tracking.

**Alerts** — inbox with severity filters, read/unread, per-alert detail, and threshold/notification settings.

**Analytics & Reports** — season trends, risk history, model performance metrics (accuracy, precision, recall, F1), yield/health correlation, exportable report view.

**Devices (IoT)** — ESP32/sensor list, online status, battery/signal, last reading, calibration, add-device flow, simulated-data toggle.

**Settings & Help** — profile, farm settings, risk thresholds, integrations, notification preferences, help/FAQ, about the platform and datasets.

## Technical notes

- TanStack Start file-based routes under `src/routes/`; shared app shell as a pathless layout route wrapping authenticated pages.
- Mock data centralized in `src/data/*.ts` (farms, fields, crops, sensor series, predictions, alerts, recommendations, image analyses) with typed models, so a FastAPI/PostgreSQL backend can replace it later without UI changes.
- Charts via Recharts using existing design tokens; no hardcoded colors.
- Each route gets its own `head()` metadata (title, description, og tags).
- Reuse and extend the existing oklch token set; add risk-status tokens for low/moderate/high/critical.

## Scope note

This delivers the complete frontend experience with simulated AI outputs. Actual model training (Random Forest, XGBoost, CNN, SHAP, Grad-CAM) and the FastAPI backend are separate work; the UI is structured to plug into them.
