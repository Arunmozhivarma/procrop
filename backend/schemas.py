from pydantic import BaseModel, Field, StringConstraints
from typing import Annotated, List, Optional

class JassidPredictionInput(BaseModel):
    # Pest History
    jassid_per_3_leaves: float = Field(..., description="Current week Jassids per 3 leaves")
    jassid_lag_1: float = Field(..., description="Previous week Jassids per 3 leaves")
    jassid_lag_2: float = Field(..., description="Jassids per 3 leaves 2 weeks ago")
    
    # Current Weather
    max_temp_c: float = Field(..., description="Maximum temperature (°C)")
    min_temp_c: float = Field(..., description="Minimum temperature (°C)")
    rh_morning_pct: float = Field(..., description="Morning Relative Humidity (%)")
    rh_evening_pct: float = Field(..., description="Evening Relative Humidity (%)")
    rainfall_mm: float = Field(..., description="Rainfall (mm)")
    rainy_days: int = Field(..., description="Rainy days count")
    wind_speed_kmh: float = Field(..., description="Wind speed (km/h)")
    sunshine_hours: float = Field(..., description="Sunshine hours")
    
    # Previous Weather (Lag 1)
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
    risk_threshold: float = 1.95
    model_used: str
    threshold_disclaimer: str = "Experimental median rule: >= 1.95 Jassids/3 leaves (not an official ICAR threshold)"
    explanation: List[FeatureContribution]

# User accounts (users table)
UserName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
UserEmail = Annotated[
    str,
    StringConstraints(strip_whitespace=True, max_length=254, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$"),
]

class RegisterInput(BaseModel):
    name: UserName
    email: UserEmail
    password: str = Field(..., min_length=8, max_length=128, description="Account password (8+ characters)")

class LoginInput(BaseModel):
    email: UserEmail
    password: str = Field(..., min_length=1, max_length=128)

class ProfileUpdateInput(BaseModel):
    name: UserName
    email: UserEmail

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    created_at: Optional[str] = None

class AuthResponse(BaseModel):
    token: str
    user: UserOut
