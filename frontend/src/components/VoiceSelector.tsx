import React, { useState, useRef, useEffect } from 'react';
import { Play, Loader2, Square } from 'lucide-react';
import axios from 'axios';
import { config } from '../config';
import type { Voice } from '../types';

export const LANGUAGE_NAME_MAP: Record<string, string> = {
    // 27 languages supported by Typecast ssfm-v21 model (official docs)
    'en': 'English',
    'ko': 'Korean',
    'zh': 'Chinese',
    'es': 'Spanish',
    'ar': 'Arabic',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'de': 'German',
    'fr': 'French',
    'id': 'Indonesian',
    'it': 'Italian',
    'ms': 'Malay',
    'pl': 'Polish',
    'nl': 'Dutch',
    'uk': 'Ukrainian',
    'el': 'Greek',
    'ta': 'Tamil',
    'sv': 'Swedish',
    'cs': 'Czech',
    'da': 'Danish',
    'fi': 'Finnish',
    'tl': 'Tagalog',
    'sk': 'Slovak',
    'bg': 'Bulgarian',
    'hr': 'Croatian',
    'ro': 'Romanian'
};

interface VoiceSelectorProps {
    voices: Voice[];
    selectedVoiceId: string;
    onSelectVoice: (voiceId: string) => void;
    apiKey: string;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ voices, selectedVoiceId, onSelectVoice, apiKey }) => {

    // Audio State
    const [previewStates, setPreviewStates] = useState<Record<string, 'idle' | 'loading' | 'playing'>>({});
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [audioCache, setAudioCache] = useState<Map<string, string>>(new Map());
    const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

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
            const response = await axios.post<{ audio_base64: string }>(`${config.API_BASE_URL}/generate`, {
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
            // alert("Could not generate preview. Please check API Key."); 
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

    // Empty state
    if (voices.length === 0) {
        return (
            <div className="text-center p-8 text-[var(--text-secondary)] border border-dashed border-[var(--border-subtle)] rounded-xl">
                <p className="text-xs font-serif italic opacity-70">No voices match your criteria.</p>
            </div>
        );
    }

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <div className="space-y-1">
            {voices.map((voice) => {
                const isSelected = selectedVoiceId === voice.voice_id;

                return (
                    <div
                        key={voice.voice_id}
                        onClick={() => onSelectVoice(voice.voice_id)}
                        className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-300 border flex items-center gap-3 ${isSelected
                            ? 'border-[var(--text-accent)] bg-[var(--bg-surface-light)] shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]'
                            : 'border-transparent hover:bg-[var(--bg-surface-light)] hover:border-[var(--border-subtle)]'
                            }`}
                    >
                        {/* Avatar */}
                        <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold font-serif border ${isSelected
                            ? 'bg-[var(--text-accent)] text-black border-[var(--text-accent)]'
                            : 'bg-[var(--bg-deep)] text-[var(--text-secondary)] border-[var(--border-subtle)] group-hover:text-[var(--text-primary)] group-hover:border-[var(--text-secondary)] transition-colors'
                            }`}>
                            {voice.image_url && !failedImages[voice.voice_id] ? (
                                <img
                                    src={voice.image_url}
                                    alt={voice.name}
                                    className="w-full h-full object-cover rounded-full"
                                    onError={() => setFailedImages(prev => ({ ...prev, [voice.voice_id]: true }))}
                                />
                            ) : (
                                <span>{getInitials(voice.name)}</span>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h3 className={`font-serif text-sm truncate transition-colors ${isSelected
                                    ? 'text-[var(--text-primary)] font-semibold'
                                    : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                                    }`}>
                                    {voice.name}
                                </h3>
                                {/* Gender/Lang Tag */}
                                <span className="text-[9px] uppercase tracking-wider opacity-60 ml-2 flex-shrink-0">
                                    {voice.native_language
                                        ? (LANGUAGE_NAME_MAP[voice.native_language.toLowerCase()] || voice.native_language).toUpperCase()
                                        : (voice.languages?.[0] ? (LANGUAGE_NAME_MAP[voice.languages[0].toLowerCase()] || voice.languages[0]).toUpperCase() : '')
                                    }
                                </span>
                            </div>

                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] inline-flex items-center gap-1 ${isSelected ? 'text-[var(--text-accent)]' : 'text-[var(--text-secondary)] opacity-70'}`}>
                                    {voice.gender}
                                    {voice.age_range && <span>• {voice.age_range}</span>}
                                </span>
                            </div>
                        </div>

                        {/* Play Preview Button */}
                        <button
                            className={`p-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[var(--text-accent)] ${isSelected
                                ? 'text-[var(--text-accent)] hover:bg-black/20'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)]'
                                } ${previewStates[voice.voice_id] === 'loading' ? 'opacity-100 cursor-wait' : 'opacity-0 group-hover:opacity-100'}`}
                            title={previewStates[voice.voice_id] === 'playing' ? "Stop Preview" : "Play Preview"}
                            onClick={(e) => handlePlayPreview(e, voice.voice_id)}
                        >
                            {previewStates[voice.voice_id] === 'loading' ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : previewStates[voice.voice_id] === 'playing' ? (
                                <Square size={14} fill="currentColor" />
                            ) : (
                                <Play size={14} fill="currentColor" />
                            )}
                        </button>

                        {/* Active Indicator Line */}
                        {isSelected && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[var(--text-accent)] rounded-r-full" />
                        )}
                    </div>
                );
            })}
        </div>
    );
};
