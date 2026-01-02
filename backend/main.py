from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from typecast_service import TypecastService
from emotion_analyzer import analyze_emotion, analyze_sentences
import base64
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="VoiceForge AI Backend")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://voiceforge-ai-psi.vercel.app",
        "https://voiceforge-backend.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

service = TypecastService()

class GenerateRequest(BaseModel):
    text: str
    voice_id: str
    emotion_preset: Optional[str] = "normal"
    emotion_intensity: Optional[float] = 1.0
    speed: Optional[float] = 1.0
    pitch: Optional[int] = 0
    tempo: Optional[float] = 1.0
    model: Optional[str] = "ssfm-v21"
    auto_emotion: Optional[bool] = False
    # New TTS parameters
    volume: Optional[int] = 100  # 0-200
    audio_format: Optional[str] = "wav"  # wav or mp3
    seed: Optional[int] = None  # For reproducibility

class EmotionAnalyzeRequest(BaseModel):
    text: str

class SentenceEmotion(BaseModel):
    text: str
    emotion: str
    confidence: float

class EmotionAnalyzeResponse(BaseModel):
    detected_emotion: str
    confidence: float
    scores: dict
    sentences: Optional[List[SentenceEmotion]] = None

@app.get("/")
def read_root():
    return {"message": "VoiceForge AI Backend is running"}

import json

import json

# Load Gender Map from external file
GENDER_MAP = {}
try:
    with open("gender_data.json", "r", encoding="utf-8") as f:
        GENDER_MAP = json.load(f)
    print(f"Loaded {len(GENDER_MAP)} gender mappings.")
except Exception as e:
    print(f"Warning: Could not load gender_data.json: {e}")

# Load Language Map from external file
LANGUAGE_MAP = {}
try:
    with open("language_data.json", "r", encoding="utf-8") as f:
        LANGUAGE_MAP = json.load(f)
    print(f"Loaded {len(LANGUAGE_MAP)} language mappings.")
except Exception as e:
    print(f"Warning: Could not load language_data.json: {e}")

# Load Style Map from external file
STYLE_MAP = {}
try:
    with open("style_data.json", "r", encoding="utf-8") as f:
        STYLE_MAP = json.load(f)
    print(f"Loaded {len(STYLE_MAP)} style mappings.")  # Updated with 18 categories
except Exception as e:
    print(f"Warning: Could not load style_data.json: {e}")

# Load Age Map from external file
AGE_MAP = {}
try:
    with open("age_data.json", "r", encoding="utf-8") as f:
        AGE_MAP = json.load(f)
    print(f"Loaded {len(AGE_MAP)} age mappings.")
except Exception as e:
    print(f"Warning: Could not load age_data.json: {e}")

# Load Avatar Map from external file
AVATAR_MAP = {}
try:
    with open("avatar_data.json", "r", encoding="utf-8") as f:
        AVATAR_MAP = json.load(f)
    print(f"Loaded {len(AVATAR_MAP)} avatar mappings.")
except Exception as e:
    print(f"Warning: Could not load avatar_data.json: {e}")

def detect_language(name: str) -> str:
    """Detect language from name using map and heuristics."""
    # 1. Check Map
    if name in LANGUAGE_MAP:
        return LANGUAGE_MAP[name]
    
    # 2. Check Map Partial Match (e.g. "Minsang (Happy)" -> matches "Minsang")
    for key, lang in LANGUAGE_MAP.items():
        if key in name:
            return lang

    # 3. Heuristics using Regex
    import re
    # Korean (Hangul)
    if re.search(r'[가-힣]', name):
        return 'ko'
    # Japanese (Hiragana/Katakana/Kanji - simple check)
    if re.search(r'[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FBF]', name):
        # This is broad (includes Chinese Kanji), but acceptable for now as specific Chinese names should be in map
        return 'ja' 
        
    # Default to English
    return 'en'

@app.get("/voices")
def get_voices(x_api_key: Optional[str] = Header(None), model: Optional[str] = None):
    print(f"DEBUG: /voices endpoint hit. API Key provided: {'Yes' if x_api_key else 'No'}")

    if not x_api_key:
         # Fallback to env var if not header provided (backward comp), or raise error
         x_api_key = os.getenv("TYPECAST_API_KEY")
    
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")

    try:
        voices = service.get_voices(api_key=x_api_key, model=model)
        
        results = []
        for v in voices:
            name = v.get("name", v.get("voice_name", "Unknown"))
            voice_id = v.get("voice_id")
            
            # Determine Gender
            gender = "Unknown"
            if name in GENDER_MAP:
                gender = GENDER_MAP[name]
            elif "(M)" in name or " Male" in name:
                gender = "Male"
            elif "(F)" in name or " Female" in name:
                gender = "Female"
            
            # Determine NATIVE Language
            native_language = "en" # Default
            
            # 1. Check raw data from provider (if present in future)
            raw_lang = v.get("language") or v.get("lang") or v.get("locale")
            if raw_lang:
                raw_lang = raw_lang.lower()
                if raw_lang.startswith("ko"): native_language = "ko"
                elif raw_lang.startswith("ja"): native_language = "ja"
                elif raw_lang.startswith("es"): native_language = "es"
                elif raw_lang.startswith("zh"): native_language = "zh"
                elif raw_lang.startswith("fr"): native_language = "fr"
                elif raw_lang.startswith("de"): native_language = "de"
                elif raw_lang.startswith("it"): native_language = "it"
                elif raw_lang.startswith("ru"): native_language = "ru"
            else:
                # 2. Check Map
                if name in LANGUAGE_MAP:
                    native_language = LANGUAGE_MAP[name]
                else:
                    # 3. Heuristics using Regex
                    import re
                    # Korean (Hangul)
                    if re.search(r'[가-힣]', name):
                        native_language = 'ko'
                    # Japanese (Hiragana/Katakana/Kanji)
                    elif re.search(r'[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FBF]', name):
                         native_language = 'ja'
            
            # Construct Supported Languages List
            # ssfm-v21 model is MULTILINGUAL - ALL voices support 27 languages per official docs
            # https://typecast.ai/docs/models
            # The native_language indicates the voice's origin/accent, but can speak all languages
            
            # Full list of 27 supported languages from Typecast ssfm-v21 documentation
            SSFM_V21_LANGUAGES = [
                "en", "ko", "zh", "es", "ar", "pt", "ru", "ja", "de", "fr",
                "id", "it", "ms", "pl", "nl", "uk", "el", "ta", "sv", "cs",
                "da", "fi", "tl", "sk", "bg", "hr", "ro"
            ]
            
            # Put native language first, then all other supported languages
            supported_languages = [native_language]
            for lang in SSFM_V21_LANGUAGES:
                if lang != native_language:
                    supported_languages.append(lang)

            # Get Style from map
            styles = STYLE_MAP.get(name, ["Conversational"])  # Default to Conversational
            
            # Get Age Group from map (overrides API if available)
            age_group = AGE_MAP.get(name, v.get("age_range") or "Young Adult")

            # Construct Avatar URL
            image_url = v.get("image_url")
            if not image_url:
                # 1. Try avatar map first (scraped from Typecast website)
                if name in AVATAR_MAP:
                    image_url = AVATAR_MAP[name]
                else:
                    # 2. Fallback to /All/{name}.webp pattern
                    safe_name = name.lower().replace(" ", "")
                    if "(" in safe_name:
                        safe_name = safe_name.split("(")[0]
                    image_url = f"https://static2.typecast.ai/c/All/{safe_name}.webp"

            results.append({
                "voice_id": voice_id,
                "name": name,
                "emotions": v.get("emotions", []),
                "model": v.get("model"),
                "gender": gender,
                "languages": supported_languages, 
                "native_language": native_language,
                "age_range": age_group,
                "styles": styles,
                "image_url": image_url
            })
            
        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate")
def generate_speech(request: GenerateRequest, x_api_key: Optional[str] = Header(None)):
    if not x_api_key:
         x_api_key = os.getenv("TYPECAST_API_KEY")
    
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key is required")
    
    # Determine emotion to use
    emotion_to_use = request.emotion_preset
    detected_emotion_info = None
    
    # Smart Emotion Detection
    if request.auto_emotion:
        # 1. Analyze locally for UI Feedback ONLY
        emotion_result = analyze_emotion(request.text)
        detected_emotion_info = {
            "detected_emotion": emotion_result["detected_emotion"],
            "confidence": emotion_result["confidence"]
        }
        print(f"[Smart Emotion] Local Detection: {emotion_result['detected_emotion']} (confidence: {emotion_result['confidence']:.2f})")
        
        # 2. Use Native Typecast Smart Emotion by passing None
        # This allows Typecast to automatically select the best emotion (or default to normal if unsupported)
        emotion_to_use = None 
        print(f"[Smart Emotion] delegating to Typecast Native Engine (emotion_preset=None)")

    try:
        audio_data, duration = service.generate_speech(
            api_key=x_api_key,
            text=request.text,
            voice_id=request.voice_id,
            emotion_preset=emotion_to_use,
            emotion_intensity=request.emotion_intensity,
            speed=request.speed,
            pitch=request.pitch,
            tempo=request.tempo,
            model=request.model or "ssfm-v21",
            volume=request.volume,
            audio_format=request.audio_format,
            seed=request.seed
        )
        audio_base64 = base64.b64encode(audio_data).decode("utf-8")
        
        response_data = {
            "audio_base64": audio_base64,
            "duration": duration,
            "format": "wav"
        }
        
        # Include detected emotion info if smart emotion was used
        if detected_emotion_info:
            response_data["detected_emotion"] = detected_emotion_info
            
        return response_data
    except Exception as e:
        # Check if it's a quota/payment issue
        error_msg = str(e)
        status_code = 500
        if "QUOTA_INSUFFICIENT" in error_msg or "Payment required" in error_msg:
             status_code = 402 # Payment Required
        elif "Validation error" in error_msg:
             status_code = 400 # Bad Request
             
        raise HTTPException(status_code=status_code, detail=error_msg)


@app.post("/analyze-emotion", response_model=EmotionAnalyzeResponse)
def analyze_text_emotion(request: EmotionAnalyzeRequest):
    """
    Analyze text and detect the dominant emotion.
    Returns the detected emotion, confidence score, and per-sentence breakdown.
    """
    try:
        # Get overall emotion
        emotion_result = analyze_emotion(request.text)
        
        # Get per-sentence analysis
        sentence_results = analyze_sentences(request.text)
        
        return EmotionAnalyzeResponse(
            detected_emotion=emotion_result["detected_emotion"],
            confidence=emotion_result["confidence"],
            scores=emotion_result["scores"],
            sentences=[
                SentenceEmotion(
                    text=s["text"],
                    emotion=s["emotion"],
                    confidence=s["confidence"]
                )
                for s in sentence_results
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

