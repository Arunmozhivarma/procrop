export interface AppConfig {
  upload: {
    min_images: number;
    target_images: number;
    max_images: number;
    max_image_mb: number;
    compression_max_dimension: number;
    compression_quality: number;
  };
  economic_threshold_level: {
    jassids_per_leaf: number;
    jassids_per_3_leaves: number;
    source: string;
    description: string;
  };
  risk_classes: {
    low: {
      label: string;
      max_jassids_per_leaf: number;
      max_jassids_per_3_leaves: number;
      max_burn_grade: number;
      description: string;
    };
    medium: {
      label: string;
      min_jassids_per_leaf: number;
      max_jassids_per_leaf: number;
      min_jassids_per_3_leaves: number;
      max_jassids_per_3_leaves: number;
      burn_grade: number;
      description: string;
    };
    high: {
      label: string;
      min_jassids_per_leaf: number;
      min_jassids_per_3_leaves: number;
      burn_grade: number;
      description: string;
    };
  };
  hopper_burn_override_share: number;
  confidence_levels: {
    high: { min_images: number; label: string; description: string };
    medium: { min_images: number; max_images: number; label: string; description: string };
    low: { min_images: number; max_images: number; label: string; description: string };
  };
  sampling_protocol: {
    target_plants: number;
    leaves_per_plant: number;
    canopy_levels: string[];
    orientation: string;
  };
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  upload: {
    min_images: 5,
    target_images: 15,
    max_images: 30,
    max_image_mb: 8,
    compression_max_dimension: 1600,
    compression_quality: 0.85,
  },
  economic_threshold_level: {
    jassids_per_leaf: 2.0,
    jassids_per_3_leaves: 6.0,
    source: "ICAR-CICR & TNAU Agritech Portal (Cotton IPM)",
    description: "ETL: 2 nymphs/leaf (6 per 3 leaves), or Grade II hopper burn.",
  },
  risk_classes: {
    low: {
      label: "Low",
      max_jassids_per_leaf: 1.0,
      max_jassids_per_3_leaves: 3.0,
      max_burn_grade: 1,
      description: "Below 50% of ETL and hopper burn grade <= 1.",
    },
    medium: {
      label: "Medium",
      min_jassids_per_leaf: 1.0,
      max_jassids_per_leaf: 2.0,
      min_jassids_per_3_leaves: 3.0,
      max_jassids_per_3_leaves: 6.0,
      burn_grade: 2,
      description: "50% to 100% of ETL, or grade 2 hopper burn appearing.",
    },
    high: {
      label: "High",
      min_jassids_per_leaf: 2.0,
      min_jassids_per_3_leaves: 6.0,
      burn_grade: 2,
      description: "At or exceeding ETL (>= 2.0 per leaf) or widespread hopper burn grade >= 2.",
    },
  },
  hopper_burn_override_share: 0.25,
  confidence_levels: {
    high: {
      min_images: 15,
      label: "High Confidence",
      description: "15 or more photos with verified foliage clarity",
    },
    medium: {
      min_images: 8,
      max_images: 14,
      label: "Medium Confidence",
      description: "8 to 14 photos analysed",
    },
    low: {
      min_images: 5,
      max_images: 7,
      label: "Low Confidence",
      description: "5 to 7 photos analysed; below target sample size",
    },
  },
  sampling_protocol: {
    target_plants: 5,
    leaves_per_plant: 3,
    canopy_levels: ["top", "middle", "bottom"],
    orientation: "underside",
  },
};

export const API_BASE_URL = "http://localhost:8000";

// ==================== Multi-Account & Auth Store ====================

export interface StoredAccount {
  id: number;
  email: string;
  name: string;
  token: string;
  role?: string;
  location?: string;
}

const STORAGE_KEY_ACCOUNTS = "procrop_multi_accounts";
const STORAGE_KEY_ACTIVE = "procrop_active_account_id";
export const ACTIVE_ACCOUNT_UPDATED_EVENT = "procrop:active-account-updated";

export function getAllAccounts(): StoredAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getActiveAccount(): StoredAccount | null {
  if (typeof window === "undefined") return null;
  const accounts = getAllAccounts();
  const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE);
  if (activeId && accounts.length > 0) {
    const found = accounts.find((a) => a.id === parseInt(activeId, 10));
    if (found) return found;
  }
  return accounts[0] || null;
}

export function saveAccount(acc: StoredAccount): void {
  const accounts = getAllAccounts();
  const idx = accounts.findIndex(
    (a) => a.id === acc.id || a.email.toLowerCase() === acc.email.toLowerCase(),
  );
  if (idx >= 0) {
    accounts[idx] = acc;
  } else {
    accounts.push(acc);
  }
  localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  localStorage.setItem(STORAGE_KEY_ACTIVE, acc.id.toString());
  window.dispatchEvent(new Event(ACTIVE_ACCOUNT_UPDATED_EVENT));
}

export function setActiveAccountId(id: number): void {
  localStorage.setItem(STORAGE_KEY_ACTIVE, id.toString());
}

export function removeAccount(id: number): void {
  const accounts = getAllAccounts().filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE);
  if (activeId === id.toString()) {
    if (accounts.length > 0 && accounts[0]) {
      localStorage.setItem(STORAGE_KEY_ACTIVE, accounts[0].id.toString());
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE);
    }
  }
}

export function clearAllAccounts(): void {
  localStorage.removeItem(STORAGE_KEY_ACCOUNTS);
  localStorage.removeItem(STORAGE_KEY_ACTIVE);
}

export function getAuthHeaders(): Record<string, string> {
  const active = getActiveAccount();
  if (active && active.token) {
    return { Authorization: `Bearer ${active.token}` };
  }
  return {};
}

// ==================== Auth API Calls ====================

export async function registerUser(email: string, password: string, name: string) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Registration failed");
  }
  const data = await res.json();
  saveAccount({
    id: data.user.id,
    email: data.user.email,
    name: data.user.name,
    token: data.access_token,
    role: data.user.role,
    location: data.user.location,
  });
  return data;
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Login failed");
  }
  const data = await res.json();
  saveAccount({
    id: data.user.id,
    email: data.user.email,
    name: data.user.name,
    token: data.access_token,
    role: data.user.role,
    location: data.user.location,
  });
  return data;
}

export async function logoutUser(): Promise<void> {
  const active = getActiveAccount();
  if (active) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
    } catch {
      // Ignore network errors on logout
    }
    removeAccount(active.id);
  }
}

export async function fetchCurrentUser() {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error("Unauthorized");
  }
  return res.json();
}

// ==================== Fields API Calls ====================

export interface FieldRecord {
  id: number;
  user_id: number;
  name: string;
  lat?: number;
  lon?: number;
  district?: string;
  sowing_date?: string;
  variety?: string;
  variety_trait?: string;
  bt_status?: string;
  nitrogen_level?: string;
  irrigation?: string;
  alternate_hosts?: string;
  created_at?: string;
}

export async function fetchUserFields(): Promise<FieldRecord[]> {
  const res = await fetch(`${API_BASE_URL}/fields`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    return [];
  }
  return res.json();
}

export async function createUserField(data: Partial<FieldRecord>): Promise<FieldRecord> {
  const res = await fetch(`${API_BASE_URL}/fields`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to save field");
  }
  return res.json();
}

// ==================== Prediction & Model-Info API Calls ====================

export interface ModelInfoResponse {
  pipeline_stages: Array<{
    step: number;
    name: string;
    file: string;
    function: string;
    description: string;
  }>;
  detector_metrics: {
    model_architecture?: string;
    held_out_test_metrics?: {
      test_images: number;
      precision: number;
      recall: number;
      mAP_50: number;
      count_mae_per_image: {
        adults_mae: number;
        nymphs_mae: number;
        total_pest_mae: number;
      };
    };
    heuristic_fallback_metrics?: {
      method: string;
      count_mae_per_image: number;
    };
  };
  hopper_burn_metrics: {
    method?: string;
    standard?: string;
    evaluation_summary?: {
      mean_grade_on_redding_set: number;
      mean_grade_on_healthy_set: number;
    };
    burn_grade_thresholds?: Record<string, string>;
  };
  risk_metrics: {
    version?: string;
    validation_method?: string;
    persistence_baseline_mae?: number;
    best_regression_architecture?: string;
    best_regression_mae?: number;
    beats_persistence_baseline?: boolean;
    delta_mae_vs_baseline?: number;
    honest_assessment?: string;
    regression_models_losocv?: Record<string, { mae: number; rmse: number; r2: number }>;
    classification_models_losocv?: Record<string, { accuracy: number; macro_f1: number }>;
  };
  app_config: AppConfig;
  datasets: Array<{
    name: string;
    files: string[];
    source: string;
    license: string;
    size: string;
    columns: string;
    use: string;
  }>;
  limitations: string[];
  file_map: Array<{
    path: string;
    role: string;
    exists: boolean;
  }>;
}

export async function fetchAppConfig(): Promise<AppConfig> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/config`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }
  return DEFAULT_APP_CONFIG;
}

export async function fetchModelInfo(): Promise<ModelInfoResponse> {
  const res = await fetch(`${API_BASE_URL}/api/model-info`);
  if (!res.ok) {
    throw new Error(`Failed to fetch model info (${res.status})`);
  }
  return res.json();
}

export interface DetailedPredictionResponse {
  prediction_id: number;
  field_id?: number;
  field_name?: string;
  risk_class: "Low" | "Medium" | "High";
  final_score: number;
  score_per_leaf: number;
  confidence: "High" | "Medium" | "Low" | "Very Low";
  base_score: number;
  compound_multiplier: number;
  modifiers: Array<{
    category: string;
    input: string;
    multiplier: number;
    explanation: string;
    disclaimer: string;
  }>;
  shap_drivers: Array<{
    feature: string;
    value?: number;
    contribution: number;
  }>;
  image_aggregates: {
    n_images_uploaded: number;
    n_images_used: number;
    n_images_rejected: number;
    mean_per_leaf: number;
    jassid_per_3_leaves: number;
    total_pests_counted: number;
    total_adults: number;
    total_nymphs: number;
    sd: number;
    cv: number;
    variance_to_mean_ratio: number;
    bootstrap_ci_95: { lower: number; upper: number };
    mean_burn_grade: number;
    share_of_images_with_grade_ge_2: number;
    confidence_level: string;
  };
  weather_snapshot: {
    source: string;
    max_temp_c: number;
    min_temp_c: number;
    rh_morning_pct: number;
    rh_evening_pct: number;
    rainfall_mm: number;
    rainy_days: number;
    wind_speed_kmh?: number;
    sunshine_hours?: number;
    forecast_7d_rainfall_mm?: number;
    forecast_7d_max_temp_mean?: number;
    is_weather_available: boolean;
    weather_flag: string;
  };
  recommendation: {
    risk_class: string;
    urgency: string;
    headline: string;
    rescout_date: string;
    rescout_days: number;
    actions: string[];
    spray_guidance: string;
    rotation_note?: string;
    disclaimer: string;
  };
  images: Array<{
    slot: number;
    filename: string;
    saved_path: string;
    total_jassids: number;
    burn_grade: number;
    is_valid: boolean;
    quality_warning?: string;
  }>;
  per_image_results?: Array<{
    filename: string;
    total: number;
    n_adults: number;
    n_nymphs: number;
    confidence: number;
    quality_flags: Record<string, boolean>;
    hopper_burn: { burn_grade: number; grade_label?: string } | null;
    method_used: string;
  }>;
  created_at?: string;
}

export async function submitMultiLeafCheck(
  formData: FormData,
): Promise<DetailedPredictionResponse> {
  const headers = getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    let detail = "Prediction submission failed.";
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch {
      detail = res.statusText;
    }
    throw new Error(detail);
  }

  return res.json();
}

export async function fetchPredictionDetail(
  id: number | string,
): Promise<DetailedPredictionResponse> {
  const res = await fetch(`${API_BASE_URL}/predictions/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Prediction #${id} not found.`);
  }
  return res.json();
}

export async function fetchLatestPrediction(): Promise<DetailedPredictionResponse | null> {
  const res = await fetch(`${API_BASE_URL}/predictions?limit=1`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return null;
  const list = await res.json();
  if (!Array.isArray(list) || list.length === 0) return null;
  // list items may be abbreviated — fetch full detail for the latest
  const latestId = list[0]?.id;
  if (!latestId) return null;
  try {
    return await fetchPredictionDetail(latestId);
  } catch {
    return null;
  }
}

// ==================== Client-Side Image Compression ====================

export async function compressImageToJpeg(
  file: File,
  maxDimension = 1600,
  quality = 0.85,
): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return reject(new Error(`File ${file.name} is not an image.`));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(file);
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            const compressedFile = new File([blob], cleanName, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          quality,
        );
      };
      img.onerror = () => reject(new Error(`Failed to decode image ${file.name}`));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
    reader.readAsDataURL(file);
  });
}

// ==================== Legacy Interfaces & Functions ====================

export interface JassidPredictionInput {
  jassid_per_3_leaves: number;
  jassid_lag_1: number;
  jassid_lag_2: number;
  max_temp_c: number;
  min_temp_c: number;
  rh_morning_pct: number;
  rh_evening_pct: number;
  rainfall_mm: number;
  rainy_days: number;
  wind_speed_kmh: number;
  sunshine_hours: number;
  max_temp_c_lag_1: number;
  min_temp_c_lag_1: number;
  rh_morning_pct_lag_1: number;
  rh_evening_pct_lag_1: number;
  rainfall_mm_lag_1: number;
  rainy_days_lag_1: number;
  wind_speed_kmh_lag_1: number;
  sunshine_hours_lag_1: number;
}

export interface FeatureContribution {
  feature: string;
  value?: number;
  contribution: number;
}

export interface PredictionResponse {
  predicted_next_week_jassid: number;
  risk: "HIGH" | "LOW" | "Medium" | "High";
  risk_threshold: number;
  model_used: string;
  threshold_disclaimer?: string;
  explanation: FeatureContribution[];
}

export interface LiveWeatherResponse {
  source: string;
  location: string;
  max_temp_c: number;
  min_temp_c: number;
  rh_morning_pct: number;
  rh_evening_pct: number;
  rainfall_mm: number;
  rainy_days: number;
  wind_speed_kmh: number;
  sunshine_hours: number;
  mean_temp_c: number;
  mean_rh_pct: number;
  timestamp: string;
}

export interface VisionDetectionResult {
  filename: string;
  image_width: number;
  image_height: number;
  detected_spots_on_leaf: number;
  jassid_per_3_leaves: number;
  severity: "HIGH" | "MODERATE" | "LOW";
  headline: string;
  confidence: number;
  affected_area_pct: number;
  detections: Array<{
    id: string;
    label: string;
    confidence: number;
    box: { x_pct: number; y_pct: number; w_pct: number; h_pct: number };
  }>;
  symptoms: Array<{ title: string; body: string }>;
}

export interface PreviousWeekData {
  source: string;
  report_year: string;
  smw: number;
  location: string;
  jassid_per_3_leaves: number;
  jassid_lag_1: number;
  jassid_lag_2: number;
  max_temp_c: number;
  min_temp_c: number;
  rh_morning_pct: number;
  rh_evening_pct: number;
  rainfall_mm: number;
  rainy_days: number;
  wind_speed_kmh: number;
  sunshine_hours: number;
  max_temp_c_lag_1: number;
  min_temp_c_lag_1: number;
  rh_morning_pct_lag_1: number;
  rh_evening_pct_lag_1: number;
  rainfall_mm_lag_1: number;
  rainy_days_lag_1: number;
  wind_speed_kmh_lag_1: number;
  sunshine_hours_lag_1: number;
}

export interface SavedPredictionRecord {
  id: number;
  created_at: string;
  image_name: string;
  detected_jassid: number;
  prev_week_smw: number;
  prev_week_jassid_lag_1: number;
  prev_week_jassid_lag_2: number;
  weather_source: string;
  max_temp_c: number;
  min_temp_c: number;
  rh_morning_pct: number;
  rh_evening_pct?: number;
  rainfall_mm: number;
  rainy_days?: number;
  wind_speed_kmh?: number;
  sunshine_hours?: number;
  predicted_next_week_jassid: number;
  risk: "HIGH" | "LOW" | "Medium" | "High";
  risk_threshold: number;
  model_used: string;
  explanation?: FeatureContribution[];
}

export interface UnifiedPredictionResponse {
  vision_analysis: VisionDetectionResult;
  live_weather: LiveWeatherResponse;
  previous_week_data: PreviousWeekData;
  prediction: PredictionResponse;
  db_record: {
    id: number;
    created_at: string;
    status: string;
  };
}

export interface AutoPredictResponse {
  vision_analysis: VisionDetectionResult;
  live_weather: LiveWeatherResponse;
  prediction: PredictionResponse;
}

export async function fetchLiveCoimbatoreWeather(): Promise<LiveWeatherResponse> {
  const res = await fetch(`${API_BASE_URL}/weather/coimbatore`);
  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`Weather API Error (${res.status}): ${errorText}`);
  }
  return res.json();
}

export async function fetchPreviousWeekData(): Promise<PreviousWeekData> {
  const res = await fetch(`${API_BASE_URL}/dataset/previous-week`);
  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`Previous Week API Error (${res.status}): ${errorText}`);
  }
  return res.json();
}

export async function fetchRecentPredictions(limit = 15): Promise<SavedPredictionRecord[]> {
  const res = await fetch(`${API_BASE_URL}/predictions?limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`Predictions API Error (${res.status}): ${errorText}`);
  }
  return res.json();
}

export async function analyzeLeafPhoto(file: File): Promise<VisionDetectionResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE_URL}/analyze-leaf-image`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`Vision API Error (${res.status}): ${errorText}`);
  }
  return res.json();
}

export async function runUnifiedPrediction(params: {
  file?: File;
  sampleId?: string;
  overrideJassid?: number;
  overrideLag1?: number;
  overrideLag2?: number;
  overrideMaxTemp?: number;
  overrideMinTemp?: number;
  overrideRainfall?: number;
  overrideRh?: number;
}): Promise<UnifiedPredictionResponse> {
  const formData = new FormData();
  if (params.file) formData.append("file", params.file);
  if (params.sampleId) formData.append("sample_id", params.sampleId);
  if (params.overrideJassid !== undefined)
    formData.append("override_jassid", params.overrideJassid.toString());
  if (params.overrideLag1 !== undefined)
    formData.append("override_lag_1", params.overrideLag1.toString());
  if (params.overrideLag2 !== undefined)
    formData.append("override_lag_2", params.overrideLag2.toString());
  if (params.overrideMaxTemp !== undefined)
    formData.append("override_max_temp", params.overrideMaxTemp.toString());
  if (params.overrideMinTemp !== undefined)
    formData.append("override_min_temp", params.overrideMinTemp.toString());
  if (params.overrideRainfall !== undefined)
    formData.append("override_rainfall", params.overrideRainfall.toString());
  if (params.overrideRh !== undefined) formData.append("override_rh", params.overrideRh.toString());

  const res = await fetch(`${API_BASE_URL}/predict-unified`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const errJson = await res.json();
      detail = errJson.detail || JSON.stringify(errJson);
    } catch {
      // fallback
    }
    throw new Error(`Unified Prediction Error (${res.status}): ${detail}`);
  }
  return res.json();
}

export async function autoPredictFromPhotoAndWeather(
  file: File,
  lag1 = 1.8,
  lag2 = 1.5,
): Promise<AutoPredictResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("jassid_lag_1", lag1.toString());
  formData.append("jassid_lag_2", lag2.toString());

  const res = await fetch(`${API_BASE_URL}/auto-predict`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`Auto Predict API Error (${res.status}): ${errorText}`);
  }
  return res.json();
}

export async function fetchLivePrediction(
  inputData: JassidPredictionInput,
): Promise<PredictionResponse> {
  const res = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inputData),
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const errJson = await res.json();
      detail = errJson.detail || JSON.stringify(errJson);
    } catch {
      // fallback
    }
    throw new Error(`Prediction Error (${res.status}): ${detail}`);
  }
  return res.json();
}

export async function fetchLatestDatasetPrediction(): Promise<PredictionResponse> {
  const res = await fetch(`${API_BASE_URL}/dataset/predict-latest`);
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const errJson = await res.json();
      detail = errJson.detail || JSON.stringify(errJson);
    } catch {
      // fallback
    }
    throw new Error(`Dataset Prediction Error (${res.status}): ${detail}`);
  }
  return res.json();
}
