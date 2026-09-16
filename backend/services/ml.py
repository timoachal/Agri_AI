import os
from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import torch

MODEL_NAME = "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification"
PROCESSOR_NAME = "google/mobilenet_v2_1.0_224" # Fallback processor for MobileNetV2

# Global variables for model and processor
_processor = None
_model = None

def load_model():
    """Loads the model and processor into memory."""
    global _processor, _model
    if _processor is None or _model is None:
        print(f"Loading model {MODEL_NAME}...")
        _processor = AutoImageProcessor.from_pretrained(PROCESSOR_NAME)
        _model = AutoModelForImageClassification.from_pretrained(MODEL_NAME)
        print("Model loaded successfully.")

def predict_image(image: Image.Image, top_k: int = 3):
    """Runs inference on the provided image and returns top predictions."""
    if _processor is None or _model is None:
        load_model()
    
    # Convert image to RGB if it isn't
    if image.mode != "RGB":
        image = image.convert("RGB")
        
    inputs = _processor(images=image, return_tensors="pt")
    
    with torch.no_grad():
        outputs = _model(**inputs)
        
    logits = outputs.logits
    # Convert logits to probabilities
    probs = torch.nn.functional.softmax(logits, dim=-1)[0]
    
    # Get top k predictions
    top_prob, top_indices = torch.topk(probs, top_k)
    
    results = []
    for i in range(top_k):
        label_idx = top_indices[i].item()
        confidence = top_prob[i].item()
        label = _model.config.id2label[label_idx]
        
        # Clean up label if it contains __background__ or similar
        label = label.replace("_", " ").title()
        
        results.append({
            "label": label,
            "confidence": confidence
        })
        
    return results
