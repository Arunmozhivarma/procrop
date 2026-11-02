from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any

# ==================== Authentication Schemas ====================

class UserRegisterInput(BaseModel):
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=6, description="Password (at least 6 characters)")
    name: str = Field(..., min_length=1, description="Farmer or Agronomist full name")
    role: Optional[str] = Field("Farmer", description="User role (Farmer, Extension Officer, Researcher)")
    location: Optional[str] = Field("Coimbatore, Tamil Nadu", description="Location or District")

class UserLoginInput(BaseModel):
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="Account password")

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: Optional[str] = "Farmer"
    location: Optional[str] = "Coimbatore, Tamil Nadu"
    token_version: int = 1
    created_at: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ==================== Field Management Schemas ====================

class FieldCreateInput(BaseModel):
    name: str = Field(..., min_length=1, description="Field or plot identifier")
    lat: Optional[float] = Field(None, description="GPS Latitude")
    lon: Optional[float] = Field(None, description="GPS Longitude")
    district: Optional[str] = Field("Coimbatore", description="District location")
    sowing_date: Optional[str] = Field(None, description="Crop sowing date (YYYY-MM-DD)")
    variety: Optional[str] = Field("Hybrid Cotton", description="Cotton variety name")
    variety_trait: Optional[str] = Field("unknown", description="tolerant_hairy, susceptible, or unknown")
    bt_status: Optional[str] = Field("Bt", description="Bt or Non-Bt")
    nitrogen_level: Optional[str] = Field("medium", description="low, medium, or high")
    irrigation: Optional[str] = Field("rainfed", description="rainfed, drip, or flood")
    alternate_hosts: Optional[str] = Field("none", description="okra, brinjal, or none")

class FieldResponse(BaseModel):
    id: int
    user_id: int
    name: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    district: Optional[str] = None
    sowing_date: Optional[str] = None
    variety: Optional[str] = None
    variety_trait: Optional[str] = None
    bt_status: Optional[str] = None
    nitrogen_level: Optional[str] = None
    irrigation: Optional[str] = None
    alternate_hosts: Optional[str] = None
    created_at: Optional[str] = None

# ==================== Multi-Leaf Prediction & Submission Schemas ====================

class PredictionSubmissionInput(BaseModel):
    field_id: Optional[int] = Field(None, description="Selected existing field ID")
    field_name: Optional[str] = Field("Field Block 1", description="Field name")
    sowing_date: Optional[str] = Field(None, description="Sowing date (YYYY-MM-DD)")
    variety: Optional[str] = Field("Cotton Hybrid", description="Cotton cultivar")
    variety_trait: Optional[str] = Field("unknown", description="tolerant_hairy, susceptible, or unknown")
    bt_status: Optional[str] = Field("Bt", description="Bt or Non-Bt")
    last_spray_date: Optional[str] = Field(None, description="Last spray date (YYYY-MM-DD) or 'no spray yet'")
    spray_product_class: Optional[str] = Field("none", description="none, botanical_neem, neonicotinoid, organophosphate, pyrethroid, other")
    spray_product_name: Optional[str] = Field(None, description="Commercial name or formulation notes")
    nitrogen_level: Optional[str] = Field("medium", description="low, medium, or high")
    irrigation: Optional[str] = Field("rainfed", description="rainfed, drip, or flood")
    alternate_hosts: Optional[str] = Field("none", description="okra, brinjal, or none")
    latitude: Optional[float] = Field(11.0168, description="Latitude for Open-Meteo weather")
    longitude: Optional[float] = Field(76.9558, description="Longitude for Open-Meteo weather")

# ==================== Legacy Schemas (Preserved) ====================

class JassidPredictionInput(BaseModel):
    jassid_per_3_leaves: float = Field(..., description="Current week Jassids per 3 leaves")
    jassid_lag_1: float = Field(..., description="Previous week Jassids per 3 leaves")
    jassid_lag_2: float = Field(..., description="Jassids per 3 leaves 2 weeks ago")
    
    max_temp_c: float = Field(..., description="Maximum temperature (°C)")
    min_temp_c: float = Field(..., description="Minimum temperature (°C)")
    rh_morning_pct: float = Field(..., description="Morning Relative Humidity (%)")
    rh_evening_pct: float = Field(..., description="Evening Relative Humidity (%)")
    rainfall_mm: float = Field(..., description="Rainfall (mm)")
    rainy_days: int = Field(..., description="Rainy days count")
    wind_speed_kmh: float = Field(..., description="Wind speed (km/h)")
    sunshine_hours: float = Field(..., description="Sunshine hours")
    
    max_temp_c_lag_1: float = Field(..., description="Previous week max temperature (°C)")
    min_temp_c_lag_1: float = Field(..., description="Previous week min temperature (°C)")
    rh_morning_pct_lag_1: float = Field(..., description="Previous week morning RH (%)")
    rh_evening_pct_lag_1: float = Field(..., description="Previous week evening RH (%)")
    rainfall_mm_lag_1: float = Field(..., description="Previous week rainfall (mm)")
    rainy_days_lag_1: int = Field(..., description="Previous week rainy days count")
    wind_speed_kmh_lag_1: float = Field(..., description="Previous week wind speed (km/h)")
    sunshine_hours_lag_1: float = Field(..., description="Previous week sunshine hours")

class FeatureContribution(BaseModel):
    feature: str
    value: Optional[float] = None
    contribution: float

class PredictionResponse(BaseModel):
    predicted_next_week_jassid: float
    risk: str
    risk_threshold: float = 6.0
    model_used: str
    threshold_disclaimer: str = "ICAR-CICR / TNAU Economic Threshold Level: 2 nymphs/leaf (6 per 3 leaves)"
    explanation: List[FeatureContribution]
