from fastapi import APIRouter, HTTPException
from backend.schemas.api import RecommendRequest, RecommendResponse
from backend.services.llm import generate_recommendation

router = APIRouter()

@router.post("", response_model=RecommendResponse)
async def recommend(request: RecommendRequest):
    try:
        recommendation = generate_recommendation(
            crop=request.crop,
            disease_name=request.disease_name,
            confidence=request.confidence,
            location=request.location,
            recent_weather=request.recent_weather
        )
        return recommendation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendation: {str(e)}")
