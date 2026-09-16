from pydantic import BaseModel
from typing import List, Optional

class PredictionResult(BaseModel):
    label: str
    confidence: float

class PredictResponse(BaseModel):
    predictions: List[PredictionResult]
    low_confidence: bool

class RecommendRequest(BaseModel):
    crop: str
    disease_name: str
    confidence: float
    location: Optional[str] = None
    recent_weather: Optional[str] = None

class RecommendResponse(BaseModel):
    explanation: str
    severity: str
    treatment_steps: List[str]
    prevention_tips: List[str]
    weather_note: Optional[str] = None

class WeatherResponse(BaseModel):
    current_conditions: dict
    forecast: List[dict]
    agricultural_risk_summary: str
