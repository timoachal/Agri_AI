import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, Leaf, CloudSun, AlertTriangle, CheckCircle, RefreshCcw, Loader2 } from 'lucide-react'
import axios from 'axios'

const API_BASE = 'http://localhost:8000'

function App() {
  const [activeTab, setActiveTab] = useState('scan') // 'scan', 'history', 'weather'
  const [image, setImage] = useState(null)
  const [loadingStep, setLoadingStep] = useState(null) // null, 'analyzing', 'recommending'
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [weatherData, setWeatherData] = useState(null)
  
  const fileInputRef = useRef(null)

  // Fetch weather on mount if possible
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords
            const res = await axios.get(`${API_BASE}/weather?lat=${latitude}&lon=${longitude}`)
            setWeatherData(res.data)
          } catch (err) {
            console.error("Failed to fetch weather", err)
          }
        },
        (err) => console.log("Geolocation denied or failed", err)
      )
    }
  }, [])

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    // Reset state
    setImage(URL.createObjectURL(file))
    setResults(null)
    setError(null)
    setLoadingStep('analyzing')
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // 1. Predict
      const predictRes = await axios.post(`${API_BASE}/predict`, formData)
      const topPrediction = predictRes.data.predictions[0]
      const isLowConfidence = predictRes.data.low_confidence
      
      setLoadingStep('recommending')
      
      // 2. Get Recommendation
      let recommendation = null
      try {
        const recRes = await axios.post(`${API_BASE}/recommend`, {
          crop: "Unknown Crop", // The model doesn't explicitly separate crop from disease
          disease_name: topPrediction.label,
          confidence: topPrediction.confidence,
          recent_weather: weatherData ? weatherData.agricultural_risk_summary : null
        })
        recommendation = recRes.data
      } catch (recErr) {
        console.error("Recommendation failed", recErr)
        // Fallback gracefully
        recommendation = {
          explanation: "Could not fetch AI advice at this time.",
          severity: "medium",
          treatment_steps: [],
          prevention_tips: []
        }
      }
      
      setResults({
        prediction: topPrediction,
        isLowConfidence,
        recommendation
      })
      
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred while analyzing the image.")
    } finally {
      setLoadingStep(null)
    }
  }

  const resetScan = () => {
    setImage(null)
    setResults(null)
    setError(null)
    setLoadingStep(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-[var(--color-agri-earth-50)] text-gray-900 pb-20 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-2 text-[var(--color-agri-green-700)]">
          <Leaf className="w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight">AgriAI</h1>
        </div>
        <button 
          onClick={() => setActiveTab('weather')}
          className="p-2 rounded-full bg-[var(--color-agri-earth-100)] text-[var(--color-agri-earth-800)] hover:bg-[var(--color-agri-earth-200)] transition-colors"
        >
          <CloudSun className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-md mx-auto">
        {activeTab === 'weather' ? (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CloudSun className="text-amber-500" /> Local Weather Risk
            </h2>
            {weatherData ? (
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b pb-4">
                  <div>
                    <p className="text-3xl font-bold">{weatherData.current_conditions.temperature}°C</p>
                    <p className="text-sm text-gray-500">Current Temperature</p>
                  </div>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <h3 className="font-semibold text-amber-800 mb-1 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Risk Assessment
                  </h3>
                  <p className="text-sm text-amber-900">{weatherData.agricultural_risk_summary}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Please allow location access to see weather insights.</p>
            )}
            <button onClick={() => setActiveTab('scan')} className="mt-6 w-full py-2 bg-gray-100 rounded-lg text-sm font-medium">Back to Scan</button>
          </div>
        ) : activeTab === 'scan' ? (
          <div className="flex flex-col gap-6">
            
            {/* Scan Card */}
            {!image ? (
              <div className="bg-white rounded-2xl shadow-sm p-6 text-center border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-[var(--color-agri-green-50)] text-[var(--color-agri-green-600)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Check your crop</h2>
                <p className="text-gray-500 text-sm mb-6">Take a photo of a diseased leaf to get AI-powered advice.</p>
                
                <div className="flex flex-col gap-4">
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    id="camera-upload"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                  <label htmlFor="camera-upload" className="w-full py-4 rounded-xl bg-[var(--color-agri-green-600)] text-white font-medium flex items-center justify-center gap-2 hover:bg-[var(--color-agri-green-700)] transition-colors active:scale-95 shadow-md shadow-green-200 cursor-pointer">
                    <Camera className="w-5 h-5" />
                    Take Photo
                  </label>
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    id="file-upload"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="file-upload" className="w-full py-3 rounded-xl bg-[var(--color-agri-earth-100)] text-[var(--color-agri-earth-800)] font-medium flex items-center justify-center gap-2 hover:bg-[var(--color-agri-earth-200)] transition-colors active:scale-95 cursor-pointer">
                    <Upload className="w-5 h-5" />
                    Upload from Gallery
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Image Preview */}
                <div className="relative rounded-2xl overflow-hidden shadow-sm aspect-video bg-black flex items-center justify-center">
                  <img src={image} alt="Crop" className="w-full h-full object-cover opacity-80" />
                  
                  {loadingStep && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                      <Loader2 className="w-10 h-10 animate-spin mb-3 text-[var(--color-agri-green-400)]" />
                      <p className="font-medium">
                        {loadingStep === 'analyzing' ? 'Analyzing your crop...' : 'Consulting the AI advisor...'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Error State */}
                {error && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Analysis Failed</p>
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {/* Results UI */}
                {results && (
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Top Result Banner */}
                    <div className={`p-4 border-b ${results.isLowConfidence ? 'bg-amber-50' : 'bg-[var(--color-agri-green-50)]'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Detection Result</p>
                          <h3 className="text-xl font-bold text-gray-900">{results.prediction.label}</h3>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-bold ${results.isLowConfidence ? 'bg-amber-200 text-amber-800' : 'bg-green-200 text-green-800'}`}>
                          {(results.prediction.confidence * 100).toFixed(0)}% Match
                        </div>
                      </div>
                      
                      {results.isLowConfidence && (
                        <p className="text-sm text-amber-700 mt-2 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> We're not completely sure. These results might be inaccurate.
                        </p>
                      )}
                    </div>

                    {/* Recommendation Content */}
                    {results.recommendation && (
                      <div className="p-5 space-y-6">
                        
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">What's happening?</h4>
                          <p className="text-gray-700 text-sm leading-relaxed">{results.recommendation.explanation}</p>
                        </div>

                        {results.recommendation.treatment_steps?.length > 0 && (
                          <div>
                            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-[var(--color-agri-green-600)]" /> What to do now
                            </h4>
                            <ul className="space-y-3 text-sm">
                              {results.recommendation.treatment_steps.map((step, i) => (
                                <li key={i} className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-agri-green-100)] text-[var(--color-agri-green-800)] flex items-center justify-center font-bold text-xs">{i+1}</span>
                                  <span className="text-gray-700 mt-0.5">{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {results.recommendation.prevention_tips?.length > 0 && (
                          <div>
                            <h4 className="font-bold text-gray-900 mb-2 text-sm text-gray-500 uppercase tracking-wide">How to prevent it next time</h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                              {results.recommendation.prevention_tips.map((tip, i) => (
                                <li key={i}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {results.recommendation.weather_note && (
                          <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex gap-2">
                            <CloudSun className="w-5 h-5 shrink-0" />
                            <p>{results.recommendation.weather_note}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Reset button */}
                {!loadingStep && (
                  <button onClick={resetScan} className="w-full py-4 rounded-xl bg-gray-100 text-gray-700 font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                    <RefreshCcw className="w-4 h-4" />
                    Scan Another Crop
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold mb-4">Scan History</h2>
            <div className="text-gray-400 text-sm italic bg-white p-6 rounded-2xl text-center shadow-sm">
              Your previous scans will appear here.
            </div>
          </div>
        )}
      </main>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around p-3 max-w-md mx-auto z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('scan')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'scan' ? 'text-[var(--color-agri-green-700)]' : 'text-gray-400'}`}
        >
          <Camera className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Scan</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'history' ? 'text-[var(--color-agri-green-700)]' : 'text-gray-400'}`}
        >
          <Leaf className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">History</span>
        </button>
      </nav>
    </div>
  )
}

export default App
