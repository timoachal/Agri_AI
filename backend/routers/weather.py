from fastapi import APIRouter, HTTPException
import httpx
from backend.schemas.api import WeatherResponse

router = APIRouter()

@router.get("", response_model=WeatherResponse)
async def get_weather(lat: float, lon: float):
    # Free Open-Meteo API for current + 5-day forecast
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_max&timezone=auto"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
        current = data.get("current_weather", {})
        daily = data.get("daily", {})
        
        # Prepare forecast list
        forecast = []
        if daily and "time" in daily:
            for i in range(min(5, len(daily["time"]))):
                forecast.append({
                    "date": daily["time"][i],
                    "temp_max": daily["temperature_2m_max"][i],
                    "temp_min": daily["temperature_2m_min"][i],
                    "precip": daily["precipitation_sum"][i],
                })
        
        # Simple agricultural risk logic
        temp = current.get("temperature", 20)
        risk_summary = "Normal weather conditions."
        
        # Rough estimation for humidity (requires separate daily fetch normally, but we use temp & precip)
        # Using temp > 25 and some precipitation as a proxy for high fungal risk
        if temp > 25 and daily.get("precipitation_sum", [0])[0] > 5:
            risk_summary = "High humidity and warm temperatures create elevated fungal risk."
        elif temp > 35:
            risk_summary = "Extreme heat. Heat stress on crops is likely."
            
        return WeatherResponse(
            current_conditions=current,
            forecast=forecast,
            agricultural_risk_summary=risk_summary
        )
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Failed to contact weather API: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing weather data: {str(e)}")
