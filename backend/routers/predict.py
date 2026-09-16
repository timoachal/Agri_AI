from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image
import io

from backend.schemas.api import PredictResponse
from backend.services.ml import predict_image

router = APIRouter()

@router.post("", response_model=PredictResponse)
async def predict(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
        
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Run inference
        predictions = predict_image(image)
        
        # Check confidence
        low_confidence = False
        if predictions and predictions[0]["confidence"] < 0.6:
            low_confidence = True
            
        return PredictResponse(
            predictions=predictions,
            low_confidence=low_confidence
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
