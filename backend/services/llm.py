import os
import json
from groq import Groq
from backend.schemas.api import RecommendResponse

# Initialize Groq client
# Ensure GROQ_API_KEY is set in environment variables
_client = None

def get_groq_client():
    global _client
    if _client is None:
        api_key = os.environ.get("GROQ_API_KEY", "")
        _client = Groq(api_key=api_key)
    return _client

def generate_recommendation(crop: str, disease_name: str, confidence: float, location: str = None, recent_weather: str = None) -> RecommendResponse:
    client = get_groq_client()
    
    prompt = f"""
    You are an expert agricultural advisor helping a smallholder farmer in Mozambique.
    A crop disease has been detected. 
    
    Crop: {crop}
    Disease: {disease_name}
    Detection Confidence: {confidence:.2%}
    Location context: {location or 'Not provided'}
    Recent weather context: {recent_weather or 'Not provided'}
    
    Provide actionable advice. Prioritize low-cost, organic, and locally accessible treatments before suggesting expensive imported chemicals.
    Ensure the advice is simple, human-readable, and supportive.
    
    Return the response EXCLUSIVELY as a JSON object matching this schema, without markdown formatting or any other text:
    {{
        "explanation": "Plain-language explanation of the disease.",
        "severity": "low", "medium", or "high",
        "treatment_steps": ["step 1", "step 2", "step 3"],
        "prevention_tips": ["tip 1", "tip 2"],
        "weather_note": "A note on whether weather conditions make it likely to spread, based on context."
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant", # Updated to current Groq model
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        data = json.loads(content)
        return RecommendResponse(**data)
    except Exception as e:
        print(f"Error calling LLM or parsing response: {e}")
        # Fallback if API call or JSON parsing fails
        return RecommendResponse(
            explanation=f"Detected {disease_name} on {crop}.",
            severity="medium",
            treatment_steps=["Please consult a local agricultural extension officer for specific treatment."],
            prevention_tips=["Ensure proper plant spacing", "Remove infected plant parts immediately"],
            weather_note="Monitor your crops closely."
        )
