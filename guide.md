Build a full-stack crop disease detection app called "AgrAI" — an AI-powered agriculture assistant for smallholder farmers in Mozambique. 

Just use english language

## Stack
- Backend: FastAPI (Python)
- Frontend: React (with Tailwind CSS)
- ML inference: Hugging Face Transformers, model = "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification"
- Recommendation layer: an LLM call (Groq) that takes the disease classification result and generates human-readable, actionable advice

## Backend requirements (FastAPI)

1. `POST /predict` — accepts an uploaded image file, runs it through the MobileNetV2 plant-disease model via `transformers.AutoImageProcessor` + `AutoModelForImageClassification`. Load the model once at app startup, not per-request. Return the top 3 predictions with confidence scores as JSON. If the top confidence is below 0.6, flag the response as "low_confidence": true.

2. `POST /recommend` — accepts the disease classification result (crop, disease name, confidence) plus optional context (location, recent weather). Calls an LLM to generate a structured recommendation containing:
   - Plain-language explanation of the disease
   - Severity/urgency level (low / medium / high)
   - 2-4 concrete treatment steps, prioritizing low-cost/organic options accessible to smallholder farmers before expensive imported pesticides
   - Prevention tips for future seasons
   - A note on whether weather conditions in the next few days make the disease likely to spread (use the weather context if provided)
   Return this as structured JSON (not free text) so the frontend can render it in distinct sections.

3. `GET /weather?lat=&lon=` — fetches current + 5-day forecast from Open-Meteo (free, no API key needed) for the given coordinates, and returns a simplified "agricultural risk" summary (e.g., high humidity + warm temps = elevated fungal risk) alongside the raw forecast.

4. Add proper error handling: invalid image formats, model load failures, LLM API timeouts should all return clean error JSON, never raw stack traces.

5. Add CORS configured for the React frontend's origin.

6. Structure the backend cleanly: separate routers for `predict`, `recommend`, `weather`; a `services/` folder for the model loading logic and LLM client; a `schemas/` folder for Pydantic models defining request/response shapes.

## Frontend requirements (React)

Build a clean, warm, modern agri-tech UI — not a generic dashboard template. Design direction:
- Color palette: earthy greens, warm terracotta/amber accents, off-white backgrounds — should feel grounded and trustworthy, not sterile/corporate
- Mobile-first layout (most users will be on phones), large touch targets, minimal text-heavy screens
- Typography: clean, highly legible sans-serif, generous sizing (accessibility matters for varying literacy levels)

Screens/components needed:
1. **Home/scan screen** — big, obvious camera/upload button as the primary action. Recent scans shown below as cards.
2. **Scanning/loading state** — show a friendly progress animation, not a bare spinner (e.g., "Analyzing your crop..." with subtle plant-growth-themed animation).
3. **Results screen** — shows the uploaded image, the detected disease with a confidence indicator (visual, e.g., a colored badge/ring — green for high confidence, amber for low), then the AI-generated recommendation broken into clear sections (What's happening / What to do now / How to prevent it next time / Weather-related risk note).
4. **Low-confidence fallback UI** — when confidence is below threshold, show "We're not fully sure — here are the closest matches" instead of asserting a single answer.
5. **Weather widget** — compact card showing current conditions + a simple agricultural risk indicator, usable from the home screen.
6. **History/past scans view** — simple list/grid of previous scans, stored client-side is fine for now.

Technical details:
- Use `fetch`/`axios` to call the FastAPI endpoints
- Handle loading, error, and empty states gracefully everywhere — no blank screens
- Support image upload from both camera (mobile) and file picker
- Compress images client-side before upload to keep it usable on slow connections

## Non-functional requirements
- Optimize for low-bandwidth conditions: compress payloads, avoid heavy unused libraries, lazy-load non-critical assets
- Everything should degrade gracefully if the LLM recommendation call fails — still show the raw disease classification even if the advice layer times out
- Add loading skeletons rather than layout shift

Scaffold the project structure first, then implement the backend endpoints, then the frontend, wiring them together at the end. Ask me before making assumptions about the LLM provider/API key setup.