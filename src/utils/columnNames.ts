/**
 * Mapping of database field names to user-friendly display names
 * Used throughout the UI to display readable column headers and labels
 */

export const COLUMN_NAME_MAP: Record<string, string> = {
  // Jassid pest counts
  jassid_per_3_leaves: "Jassid Count per 3 Leaves",
  jassid_lag_1: "Previous Week Jassid (Lag 1)",
  jassid_lag_2: "Two Weeks Ago Jassid (Lag 2)",
  target_next_week_jassid: "Predicted Next Week Jassid",

  // Current weather parameters
  max_temp_c: "Maximum Temperature (°C)",
  min_temp_c: "Minimum Temperature (°C)",
  rh_morning_pct: "Morning Relative Humidity (%)",
  rh_evening_pct: "Evening Relative Humidity (%)",
  rainfall_mm: "Daily Rainfall (mm)",
  rainy_days: "Rainy Days Count",
  wind_speed_kmh: "Wind Speed (km/h)",
  sunshine_hours: "Sunshine Hours",

  // Derived weather features
  mean_temp_c: "Mean Temperature (°C)",
  mean_rh_pct: "Mean Relative Humidity (%)",

  // Lagged weather parameters (previous week)
  max_temp_c_lag_1: "Previous Week Max Temperature",
  min_temp_c_lag_1: "Previous Week Min Temperature",
  rh_morning_pct_lag_1: "Previous Week Morning RH",
  rh_evening_pct_lag_1: "Previous Week Evening RH",
  rainfall_mm_lag_1: "Previous Week Rainfall",
  rainy_days_lag_1: "Previous Week Rainy Days",
  wind_speed_kmh_lag_1: "Previous Week Wind Speed",
  sunshine_hours_lag_1: "Previous Week Sunshine Hours",

  // Temporal and metadata fields
  smw: "Standard Meteorological Week",
  report_year: "Report Year",
  source: "Data Source",
  id: "Record ID",
  created_at: "Created Timestamp",

  // Prediction fields
  predicted_next_week_jassid: "Predicted Jassid Count",
  risk_threshold: "Risk Threshold",
  risk: "Risk Level",
  model_used: "Model Used",
  image_name: "Leaf Sample / Source",
  detected_jassid: "Detected Jassid Count",
  prev_week_jassid_lag_1: "Previous Week Jassid (Lag 1)",
  prev_week_jassid_lag_2: "Two Weeks Ago Jassid (Lag 2)",
  weather_source: "Weather Data Source",
};

/**
 * Convert a database field name to a user-friendly display name
 * If no mapping exists, returns the original field name with underscores replaced by spaces and title-cased
 */
export function toDisplayName(fieldName: string): string {
  if (COLUMN_NAME_MAP[fieldName]) {
    return COLUMN_NAME_MAP[fieldName];
  }

  // Fallback: convert snake_case to Title Case
  return fieldName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
