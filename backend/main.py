from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from backend.routers import predict, recommend, weather

app = FastAPI(
    title="AgriAI API",
    description="Backend API for AgriAI crop disease detection app",
    version="1.0.0",
)

# Configure CORS for the frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], # Default Vite dev server ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(predict.router, prefix="/predict", tags=["predict"])
app.include_router(recommend.router, prefix="/recommend", tags=["recommend"])
app.include_router(weather.router, prefix="/weather", tags=["weather"])

@app.get("/")
def root():
    return {"message": "AgriAI API is running"}
