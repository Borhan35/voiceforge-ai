import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import type { Voice, GenerateRequest, VoiceFilters, EmotionAnalysisResult, GenerateResponseWithEmotion, GeneratedAudio } from './types';
import { VoiceSelectionModal } from './components/VoiceSelectionModal';
import { ControlPanel } from './components/ControlPanel';
import { TextInput } from './components/TextInput';
import { AudioPlayer } from './components/AudioPlayer';
import { ApiKeyModal } from './components/ApiKeyModal';
import { GeneratedHistory } from './components/GeneratedHistory';
import { Sparkles, Settings, History } from 'lucide-react';
import logoImg from './assets/logo.png';

import { config } from './config';

// API Base URL from config
const API_BASE_URL = config.API_BASE_URL;

function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() => {
    // Load saved voice from localStorage
    return localStorage.getItem('selected_voice_id') || '';
  });
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Generated History State
  const [generatedHistory, setGeneratedHistory] = useState<GeneratedAudio[]>(() => {
    const saved = localStorage.getItem('generated_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [currentPlayingHistoryId, setCurrentPlayingHistoryId] = useState<string | null>(null);

  // Smart Emotion State
  const [smartEmotion, setSmartEmotion] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState<EmotionAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analyzeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preview Audio State
  const [previewStates, setPreviewStates] = useState<Record<string, 'idle' | 'loading' | 'playing'>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioCache, setAudioCache] = useState<Map<string, string>>(new Map());

  // Voice Filters
  const [filters, setFilters] = useState<VoiceFilters>({
    searchQuery: '',
    selectedLanguages: [],
    selectedAges: [],
    selectedStyles: [],
    selectedGenders: [],
    nativeOnly: false
  });

  // Controls
  const [emotion, setEmotion] = useState('normal');
  const [intensity, setIntensity] = useState(1.0);
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [volume, setVolume] = useState(100);
  const [audioFormat, setAudioFormat] = useState('wav');

  // Textarea ref for cursor position
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Debounced emotion analysis
  const analyzeEmotion = useCallback(async (textToAnalyze: string) => {
    if (!textToAnalyze.trim() || !smartEmotion) {
      setDetectedEmotion(null);
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await axios.post<EmotionAnalysisResult>(`${API_BASE_URL}/analyze-emotion`, {
        text: textToAnalyze
      });
      setDetectedEmotion(response.data);
    } catch (error) {
      console.error('Emotion analysis failed:', error);
      setDetectedEmotion(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, [smartEmotion]);

  // Trigger emotion analysis on text change (debounced)
  useEffect(() => {
    if (analyzeTimeoutRef.current) {
      clearTimeout(analyzeTimeoutRef.current);
    }

    if (smartEmotion && text.trim()) {
      analyzeTimeoutRef.current = setTimeout(() => {
        analyzeEmotion(text);
      }, 500); // 500ms debounce
    } else {
      setDetectedEmotion(null);
    }

    return () => {
      if (analyzeTimeoutRef.current) {
        clearTimeout(analyzeTimeoutRef.current);
      }
    };
  }, [text, smartEmotion, analyzeEmotion]);
  const [selectedModel, setSelectedModel] = useState('ssfm-v21'); // ssfm-v21 is the only model supported by Typecast library

  // Saved Voices
  const [savedVoiceIds, setSavedVoiceIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('saved_voices');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const toggleSaveVoice = (voiceId: string) => {
    setSavedVoiceIds(prev => {
      const next = new Set(prev);
      if (next.has(voiceId)) {
        next.delete(voiceId);
      } else {
        next.add(voiceId);
      }
      localStorage.setItem('saved_voices', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  useEffect(() => {
    const storedKey = localStorage.getItem('typecast_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    } else {
      setShowApiKeyModal(true);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (apiKey) {
      fetchVoices();
    }
  }, [apiKey]);

  const handleSaveApiKey = (key: string) => {
    if (key.trim()) {
      setApiKey(key.trim());
      localStorage.setItem('typecast_api_key', key.trim());
      setShowApiKeyModal(false);
    }
  };

  const handleClearApiKey = () => {
    setApiKey('');
    localStorage.removeItem('typecast_api_key');
    setShowApiKeyModal(true);
    setVoices([]);
  };

  const fetchVoices = async () => {
    try {
      const response = await axios.get<Voice[]>(`${API_BASE_URL}/voices`, {
        headers: {
          'x-api-key': apiKey
        }
      });

      // Normalize data: Fix 'jp' -> 'ja' duplicate issue
      const normalizedVoices = response.data.map(v => ({
        ...v,
        native_language: v.native_language?.toLowerCase() === 'jp' ? 'ja' : v.native_language?.toLowerCase(),
        languages: v.languages?.map(l => l.toLowerCase() === 'jp' ? 'ja' : l.toLowerCase())
      }));

      setVoices(normalizedVoices);

      // Only set default voice if no voice is currently selected
      const savedVoiceId = localStorage.getItem('selected_voice_id');
      const savedVoiceExists = savedVoiceId && normalizedVoices.some(v => v.voice_id === savedVoiceId);

      if (!savedVoiceExists && normalizedVoices.length > 0) {
        setSelectedVoiceId(normalizedVoices[0].voice_id);
      }
    } catch (error: any) {
      console.error('Failed to fetch voices:', error);
      alert(`Error fetching voices: ${error.message || 'Unknown error'}`);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        alert("Invalid API Key. Please check your key.");
        handleClearApiKey();
      }
    }
  };

  // Extract unique values for filters
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    voices.forEach(v => {
      // Add native language
      if (v.native_language) langs.add(v.native_language);
      // Add all supported languages
      if (v.languages) v.languages.forEach(l => langs.add(l));
    });
    return Array.from(langs).sort();
  }, [voices]);

  const availableAges = useMemo(() => {
    const ages = new Set<string>();
    voices.forEach(v => { if (v.age_range) ages.add(v.age_range); });
    return Array.from(ages).sort();
  }, [voices]);
  const availableStyles = useMemo(() => {
    const styles = new Set<string>();
    voices.forEach(v => v.styles?.forEach(s => styles.add(s)));
    return Array.from(styles).sort();
  }, [voices]);

  const availableGenders = useMemo(() => {
    const genders = new Set<string>();
    voices.forEach(v => { if (v.gender) genders.add(v.gender); });
    return Array.from(genders).sort();
  }, [voices]);

  // Filter voices based on active filters
  const filteredVoices = useMemo(() => {
    return voices.filter(voice => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!voice.name?.toLowerCase().includes(query)) {
          return false;
        }
      }



      // Language filter - supports both Native Only and Can Speak modes
      if (filters.selectedLanguages.length > 0) {
        const selectedLangs = filters.selectedLanguages.map(l => l.toLowerCase().trim());

        if (filters.nativeOnly) {
          // Native Only: filter by native language
          const voiceNative = (voice.native_language || 'en').toLowerCase().trim();
          if (!selectedLangs.includes(voiceNative)) {
            return false;
          }
        } else {
          // Can Speak: filter by all supported languages
          const voiceLangs = (voice.languages || []).map(l => l.toLowerCase().trim());
          // Fallback to native language if languages array is empty
          if (voiceLangs.length === 0 && voice.native_language) {
            voiceLangs.push(voice.native_language.toLowerCase().trim());
          }
          const canSpeak = voiceLangs.some(lang => selectedLangs.includes(lang));
          if (!canSpeak) {
            return false;
          }
        }
      }

      // Age filter
      if (filters.selectedAges.length > 0) {
        if (!voice.age_range || !filters.selectedAges.includes(voice.age_range)) {
          return false;
        }
      }

      // Style filter (using styles from backend)
      if (filters.selectedStyles.length > 0) {
        const hasStyle = voice.styles?.some(style =>
          filters.selectedStyles.includes(style)
        );
        if (!hasStyle) return false;
      }

      // Gender filter
      if (filters.selectedGenders.length > 0) {
        if (!voice.gender || !filters.selectedGenders.includes(voice.gender)) {
          return false;
        }
      }

      return true;
    });
  }, [voices, filters]);

  const selectedVoice = voices.find(v => v.voice_id === selectedVoiceId);

  // Auto-select first voice when filtered voice is not in the list
  useEffect(() => {
    if (filteredVoices.length > 0 && selectedVoiceId) {
      const isSelectedVoiceInFiltered = filteredVoices.some(v => v.voice_id === selectedVoiceId);
      if (!isSelectedVoiceInFiltered) {
        // Optionally maintain selected voice even if hidden, or generic logic
      }
    }
  }, [filteredVoices, selectedVoiceId]);

  const handleControlUpdate = (field: string, value: any) => {
    switch (field) {
      case 'emotion': setEmotion(value); break;
      case 'intensity': setIntensity(value); break;
      case 'speed': setSpeed(value); break;
      case 'pitch': setPitch(value); break;
      case 'volume': setVolume(value); break;
      case 'audioFormat': setAudioFormat(value); break;
    }
  };

  const handleGenerate = async () => {
    if (!text || !selectedVoiceId) return;

    setIsGenerating(true);
    try {
      // PROCESSED TEXT: Removed Pause System
      // Sending raw text as requested
      const processedText = text;

      console.log('Processed text for generation:', processedText);

      const request: GenerateRequest & { auto_emotion?: boolean } = {
        text: processedText,
        voice_id: selectedVoiceId,
        emotion_preset: smartEmotion ? null : emotion,
        emotion_intensity: intensity,
        speed,
        pitch,
        tempo: speed,
        model: selectedModel,
        auto_emotion: smartEmotion,
        volume,
        audio_format: audioFormat
      };

      const response = await axios.post<GenerateResponseWithEmotion>(`${API_BASE_URL}/generate`, request, {
        headers: {
          'x-api-key': apiKey
        }
      });

      // Log detected emotion if smart emotion was used
      if (response.data.detected_emotion) {
        console.log(`[Smart Emotion] Used: ${response.data.detected_emotion.detected_emotion} (confidence: ${response.data.detected_emotion.confidence})`);
      }

      // Create blob from base64
      const binaryString = window.atob(response.data.audio_base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const mimeType = response.data.format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);

      setAudioUrl(url);
      setCurrentPlayingHistoryId(`gen_${Date.now()}`); // Temp ID handling, ideally use same ID logic as below, but for now just clear history ID or set to something new so history doesn't show "playing" if new gen
      setCurrentPlayingHistoryId(null); // Reset history active state on new generation as it's not from history list

      // Save to history
      const historyItem: GeneratedAudio = {
        id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: processedText,
        voiceId: selectedVoiceId,
        voiceName: selectedVoice?.name || 'Unknown Voice',
        audioBase64: response.data.audio_base64,
        format: response.data.format,
        emotion: smartEmotion ? (response.data.detected_emotion?.detected_emotion || 'auto') : emotion,
        duration: response.data.duration,
        timestamp: Date.now()
      };

      setGeneratedHistory(prev => {
        const newHistory = [historyItem, ...prev].slice(0, 20); // Keep max 20 items
        localStorage.setItem('generated_history', JSON.stringify(newHistory));
        return newHistory;
      });

    } catch (error) {
      console.error('Generation failed:', error);
      alert('Failed to generate speech. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Preview Logic
  const handlePlayPreview = async (e: React.MouseEvent, voiceId: string) => {
    e.stopPropagation();

    // If currently playing this voice, stop it
    if (previewStates[voiceId] === 'playing') {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPreviewStates(prev => ({ ...prev, [voiceId]: 'idle' }));
      return;
    }

    // Stop any other playback
    if (audioRef.current) {
      audioRef.current.pause();
      setPreviewStates({}); // Reset all
    }

    // Check Cache
    if (audioCache.has(voiceId)) {
      playAudio(voiceId, audioCache.get(voiceId)!);
      return;
    }

    // Fetch New
    setPreviewStates(prev => ({ ...prev, [voiceId]: 'loading' }));
    try {
      const response = await axios.post<{ audio_base64: string }>(`${API_BASE_URL}/generate`, {
        text: "Hello, I am ready to create content for you.",
        voice_id: voiceId,
        emotion_preset: null,
        speed: 1.0
      }, {
        headers: { 'x-api-key': apiKey }
      });

      // Base64 to Blob URL
      const binaryString = window.atob(response.data.audio_base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      setAudioCache(prev => new Map(prev).set(voiceId, url));
      playAudio(voiceId, url);

    } catch (error) {
      console.error("Preview failed", error);
      setPreviewStates(prev => ({ ...prev, [voiceId]: 'idle' }));
    }
  };

  const playAudio = (voiceId: string, url: string) => {
    const audio = new Audio(url);
    audioRef.current = audio;

    setPreviewStates(prev => ({ ...prev, [voiceId]: 'playing' }));

    audio.onended = () => {
      setPreviewStates(prev => ({ ...prev, [voiceId]: 'idle' }));
      audioRef.current = null;
    };

    audio.play().catch(err => {
      console.error("Playback error", err);
      setPreviewStates(prev => ({ ...prev, [voiceId]: 'idle' }));
    });
  };

  // History Handlers
  const handleDeleteFromHistory = (id: string) => {
    setGeneratedHistory(prev => {
      const newHistory = prev.filter(item => item.id !== id);
      localStorage.setItem('generated_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const handleClearHistory = () => {
    setGeneratedHistory([]);
    localStorage.removeItem('generated_history');
  };

  const handleHistoryPlay = (item: GeneratedAudio) => {
    // Convert current item's base64 to blob/url
    const binaryString = window.atob(item.audioBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const mimeType = item.format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);

    setAudioUrl(url);
    setCurrentPlayingHistoryId(item.id);
  };

  return (
    <div className="flex h-screen bg-[var(--bg-deep)] text-[var(--text-primary)] overflow-hidden font-sans">

      {/* Voice Selection Modal */}
      <VoiceSelectionModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        voices={filteredVoices}
        filters={filters}
        onFiltersChange={setFilters}
        selectedVoiceId={selectedVoiceId}
        onSelectVoice={(id) => { setSelectedVoiceId(id); localStorage.setItem('selected_voice_id', id); setShowVoiceModal(false); }}
        apiKey={apiKey}
        previewStates={previewStates}
        handlePlayPreview={handlePlayPreview}
        savedVoiceIds={savedVoiceIds}
        onToggleSave={toggleSaveVoice}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        availableStyles={availableStyles}
        availableAges={availableAges}
        availableLanguages={availableLanguages}
        availableGenders={availableGenders}
      />

      {/* Main Content - The "Editor" */}
      <main className="flex-1 flex flex-col h-full relative bg-[var(--bg-deep)]">
        <ApiKeyModal
          isOpen={showApiKeyModal}
          onSave={handleSaveApiKey}
          onClose={() => setShowApiKeyModal(false)}
          onClear={handleClearApiKey}
          existingKey={apiKey}
        />

        {/* Top Navigation Header */}
        <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="VoiceForge AI" className="h-9 w-9 object-contain drop-shadow-[0_0_8px_var(--accent-glow)]" />
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-semibold text-[var(--text-primary)]">VoiceForge</span>
              <span className="text-lg font-bold text-brand">AI</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="flex items-center justify-center w-8 h-8 text-[var(--text-secondary)] hover:text-[var(--accent-neon)] hover:bg-[var(--accent-subtle)] rounded-lg transition-all duration-200"
              title="API Key Settings"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={() => setShowHistoryPanel(true)}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${showHistoryPanel ? 'text-[var(--accent-neon)] bg-[var(--accent-subtle)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'}`}
              title="View History"
            >
              <History size={18} />
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-lg hover:border-[var(--border-accent)] hover:bg-[var(--accent-subtle)] transition-all duration-200">
              <Sparkles size={12} className="text-[var(--brand-violet-light)]" />
              <span>New project</span>
            </button>


          </div>
        </header>

        {/* Controls Toolbar */}
        <div className="flex-shrink-0">
          <ControlPanel
            emotion={emotion}
            intensity={intensity}
            speed={speed}
            pitch={pitch}
            volume={volume}
            audioFormat={audioFormat}
            voiceEmotions={selectedVoice?.emotions || []}
            onUpdate={handleControlUpdate}
            selectedVoice={selectedVoice}
            smartEmotion={smartEmotion}
            onSmartEmotionChange={setSmartEmotion}
            detectedEmotion={detectedEmotion}
            isAnalyzing={isAnalyzing}
          />
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-8 max-w-5xl mx-auto w-full flex flex-col">
          <TextInput
            ref={textareaRef}
            text={text}
            onChange={setText}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            selectedVoice={selectedVoice}
            onVoiceClick={() => setShowVoiceModal(true)}
          />
        </div>

        {/* Generated History Panel */}
        <GeneratedHistory
          isOpen={showHistoryPanel}
          onClose={() => setShowHistoryPanel(false)}
          history={generatedHistory}
          onDelete={handleDeleteFromHistory}
          onClearAll={handleClearHistory}
          onPlay={handleHistoryPlay}
          currentPlayingId={currentPlayingHistoryId}
        />

        {/* Bottom Bar - Playback */}
        {audioUrl ? (
          <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 animate-fade-in z-20">
            <div className="max-w-4xl mx-auto">
              <AudioPlayer
                audioUrl={audioUrl}
                onRegenerate={handleGenerate}
                isRegenerating={isGenerating}
                autoPlay={true}
              />
            </div>
          </div>
        ) : null}
      </main>

    </div>
  );
}

export default App;
