# AgriAI

AgriAI is a full-stack application providing AI-driven insights, recommendations, and weather predictions for agriculture. 

## Tech Stack
* **Backend:** Python, FastAPI
* **Frontend:** Vite (Node.js)
* **AI/LLM:** Groq API

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/timoachal/Agri_AI.git
   cd Agri_AI
   ```

2. **Set up Environment Variables:**
   Make sure you have your Groq API key set. You can set it in your system environment variables or add it to a `.env` file for the backend.

3. **Run the Project:**
   For Windows users, simply run the included PowerShell script from the root directory to start both the frontend and backend servers simultaneously:
   ```powershell
   .\start.ps1
   ```

   * **Backend API** will run on `http://localhost:8000`
   * **Frontend** will run on `http://localhost:5173`
