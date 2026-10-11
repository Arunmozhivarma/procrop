import { getToken } from "@/services/auth";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

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
  value?: number | null;
  contribution: number;
}

export interface PredictionResponse {
  predicted_next_week_jassid: number;
  risk: "HIGH" | "LOW";
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

/** A row of weekly_observations. Columns other than the Jassid count may be NULL. */
export interface PreviousWeekData {
  id: number;
  source: string;
  report_year: string | null;
  smw: number | null;
  location: string | null;
  jassid_per_3_leaves: number;
  jassid_lag_1: number | null;
  jassid_lag_2: number | null;
  max_temp_c: number | null;
  min_temp_c: number | null;
  rh_morning_pct: number | null;
  rh_evening_pct: number | null;
  rainfall_mm: number | null;
  rainy_days: number | null;
  wind_speed_kmh: number | null;
  sunshine_hours: number | null;
  max_temp_c_lag_1: number | null;
  min_temp_c_lag_1: number | null;
  rh_morning_pct_lag_1: number | null;
  rh_evening_pct_lag_1: number | null;
  rainfall_mm_lag_1: number | null;
  rainy_days_lag_1: number | null;
  wind_speed_kmh_lag_1: number | null;
  sunshine_hours_lag_1: number | null;
}

/** A row of the predictions table. */
export interface SavedPredictionRecord {
  id: number;
  created_at: string;
  image_name: string;
  detected_jassid: number;
  prev_week_smw: number | null;
  prev_week_jassid_lag_1: number;
  prev_week_jassid_lag_2: number;
  weather_source: string;
  max_temp_c: number;
  min_temp_c: number;
  rh_morning_pct: number;
  rh_evening_pct: number;
  rainfall_mm: number;
  rainy_days: number;
  wind_speed_kmh: number;
  sunshine_hours: number;
  predicted_next_week_jassid: number;
  risk: "HIGH" | "LOW";
  risk_threshold: number;
  model_used: string;
  explanation: FeatureContribution[];
}

export interface UnifiedPredictionResponse {
  vision_analysis: VisionDetectionResult | null;
  live_weather: LiveWeatherResponse;
  previous_week_data: PreviousWeekData;
  prediction: PredictionResponse;
  db_record: {
    id: number;
    created_at: string;
    status: string;
  };
}

/** A photo was uploaded, so the vision analysis is always present. */
export type AutoPredictResponse = UnifiedPredictionResponse & {
  vision_analysis: VisionDetectionResult;
};

export interface DatasetSummary {
  total_rows: number;
  columns_count: number;
  columns: string[];
  years_covered: string[];
  first_smw: number | null;
  last_smw: number | null;
  sample_records: Record<string, unknown>[];
}

/** A row of the users table (without the password hash). */
export interface UserAccount {
  id: number;
  name: string;
  email: string;
  created_at: string | null;
}

export interface AuthResponse {
  token: string;
  user: UserAccount;
}

/** Error raised for every failed API call. `status` is 0 when the backend is unreachable. */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error.";
}

async function readErrorDetail(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json();
    const detail = (body as { detail?: unknown }).detail;
    if (typeof detail === "string") return detail;
    // FastAPI validation errors: [{ loc, msg, ... }]
    if (Array.isArray(detail)) {
      return detail
        .map((item: { loc?: unknown[]; msg?: string }) => {
          const field = item.loc?.[item.loc.length - 1];
          return field !== undefined ? `${String(field)}: ${item.msg ?? ""}` : (item.msg ?? "");
        })
        .join("; ");
    }
    return JSON.stringify(body);
  } catch {
    return res.statusText || `Request failed (${res.status})`;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      0,
      `Cannot reach the ProCrop API at ${API_BASE_URL}. Start the backend with "uvicorn backend.app:app --port 8000".`,
    );
  }
  if (!res.ok) throw new ApiError(res.status, await readErrorDetail(res));
  return res.json() as Promise<T>;
}

/** Resolves to null when the API answers 404, i.e. the table has no matching row. */
async function requestOrNull<T>(path: string): Promise<T | null> {
  try {
    return await request<T>(path);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

function jsonBody(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export function fetchDatasetSummary(): Promise<DatasetSummary> {
  return request("/dataset/summary");
}

export function fetchDatasetObservations(limit = 5000): Promise<Record<string, unknown>[]> {
  return request(`/dataset/observations?limit=${limit}`);
}

export function fetchLiveCoimbatoreWeather(): Promise<LiveWeatherResponse> {
  return request("/weather/coimbatore");
}

/** Latest row of weekly_observations, or null when the table is empty. */
export function fetchPreviousWeekData(): Promise<PreviousWeekData | null> {
  return requestOrNull("/dataset/previous-week");
}

export function fetchRecentPredictions(limit = 15): Promise<SavedPredictionRecord[]> {
  return request(`/predictions?limit=${limit}`);
}

/** Most recently saved prediction, or null when the predictions table is empty. */
export function fetchLatestPrediction(): Promise<SavedPredictionRecord | null> {
  return requestOrNull("/predictions/latest");
}

export function analyzeLeafPhoto(file: File): Promise<VisionDetectionResult> {
  const formData = new FormData();
  formData.append("file", file);
  return request("/analyze-leaf-image", { method: "POST", body: formData });
}

export function runUnifiedPrediction(params: {
  file?: File;
  overrideJassid?: number;
  overrideLag1?: number;
  overrideLag2?: number;
  overrideMaxTemp?: number;
  overrideMinTemp?: number;
  overrideRainfall?: number;
  overrideRh?: number;
}): Promise<UnifiedPredictionResponse> {
  const formData = new FormData();
  if (params.file) {
    formData.append("file", params.file);
  }
  if (params.overrideJassid !== undefined) {
    formData.append("override_jassid", params.overrideJassid.toString());
  }
  if (params.overrideLag1 !== undefined) {
    formData.append("override_lag_1", params.overrideLag1.toString());
  }
  if (params.overrideLag2 !== undefined) {
    formData.append("override_lag_2", params.overrideLag2.toString());
  }
  if (params.overrideMaxTemp !== undefined) {
    formData.append("override_max_temp", params.overrideMaxTemp.toString());
  }
  if (params.overrideMinTemp !== undefined) {
    formData.append("override_min_temp", params.overrideMinTemp.toString());
  }
  if (params.overrideRainfall !== undefined) {
    formData.append("override_rainfall", params.overrideRainfall.toString());
  }
  if (params.overrideRh !== undefined) {
    formData.append("override_rh", params.overrideRh.toString());
  }

  return request("/predict-unified", { method: "POST", body: formData });
}

/** Lag values are optional: when omitted the backend reads them from weekly_observations. */
export function autoPredictFromPhotoAndWeather(
  file: File,
  lags: { lag1?: number; lag2?: number } = {},
): Promise<AutoPredictResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (lags.lag1 !== undefined) formData.append("jassid_lag_1", lags.lag1.toString());
  if (lags.lag2 !== undefined) formData.append("jassid_lag_2", lags.lag2.toString());

  return request("/auto-predict", { method: "POST", body: formData });
}

export function fetchLivePrediction(inputData: JassidPredictionInput): Promise<PredictionResponse> {
  return request("/predict", jsonBody("POST", inputData));
}

/** Runs the model on the latest weekly_observations row and saves the result to predictions. */
export function runLatestObservationPrediction(): Promise<PredictionResponse> {
  return request("/dataset/predict-latest", { method: "POST" });
}

export function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return request("/auth/register", jsonBody("POST", input));
}

export function loginUser(input: { email: string; password: string }): Promise<AuthResponse> {
  return request("/auth/login", jsonBody("POST", input));
}

export function fetchCurrentUser(): Promise<UserAccount> {
  return request("/auth/me");
}

export function updateProfile(input: { name: string; email: string }): Promise<UserAccount> {
  return request("/auth/me", jsonBody("PUT", input));
}
