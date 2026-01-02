export interface Voice {
    voice_id: string;
    name: string;
    emotions: string[];
    languages: string[];
    gender: string;
    age_range?: string;
    image_url?: string;
    native_language?: string;
    styles?: string[];  // NEW: Voice style categories
}

export interface GenerateRequest {
    text: string;
    voice_id: string;
    emotion_preset?: string | null;
    emotion_intensity?: number;
    speed?: number;
    pitch?: number;
    tempo?: number;
    model?: string;
    // New TTS parameters
    volume?: number;  // 0-200
    audio_format?: string;  // "wav" or "mp3"
    seed?: number;  // For reproducibility
}

export interface GenerateResponse {
    audio_base64: string;
    duration: number;
    format: string;
}

export interface VoiceFilters {
    searchQuery: string;
    selectedLanguages: string[];
    selectedAges: string[];
    selectedStyles: string[];
    selectedGenders: string[];
    nativeOnly: boolean;
}

// Smart Emotion Types
export interface SentenceEmotion {
    text: string;
    emotion: string;
    confidence: number;
}

export interface EmotionAnalysisResult {
    detected_emotion: string;
    confidence: number;
    scores: Record<string, number>;
    sentences?: SentenceEmotion[];
}

export interface GenerateResponseWithEmotion extends GenerateResponse {
    detected_emotion?: {
        detected_emotion: string;
        confidence: number;
    };
}

// Generated Audio History
export interface GeneratedAudio {
    id: string;
    text: string;
    voiceId: string;
    voiceName: string;
    audioBase64: string;
    format: string;
    emotion: string;
    duration: number;
    timestamp: number;
}
