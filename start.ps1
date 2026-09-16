# Start FastAPI Backend in background
Write-Host "Starting Backend API on http://localhost:8000..." -ForegroundColor Green
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd backend; .\.venv\Scripts\Activate.ps1; cd ..; `$env:GROQ_API_KEY='YOUR_API_KEY'; uvicorn backend.main:app --reload" -WindowStyle Normal

# Start Vite Frontend
Write-Host "Starting Vite Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host "AgriAI is starting! Two new terminal windows have been opened." -ForegroundColor Yellow
