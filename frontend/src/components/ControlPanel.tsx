import React, { useState } from 'react';
import { Crown, Zap, Loader2, Sparkles, Volume2, Music, ChevronDown, FileAudio } from 'lucide-react';
import type { Voice, EmotionAnalysisResult } from '../types';

interface ControlPanelProps {
    emotion: string;
    intensity: number;
    speed: number;
    pitch: number;
    volume: number;
    audioFormat: string;
    voiceEmotions: string[];
    onUpdate: (field: string, value: any) => void;
    selectedVoice?: Voice;
    // Smart Emotion Props
    smartEmotion: boolean;
    onSmartEmotionChange: (enabled: boolean) => void;
    detectedEmotion: EmotionAnalysisResult | null;
    isAnalyzing: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
    emotion, intensity, speed, pitch, volume, audioFormat, voiceEmotions, onUpdate,
    smartEmotion, onSmartEmotionChange, detectedEmotion, isAnalyzing
}) => {
    // Local state
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Helper function to get emotion display name with emoji
    const getEmotionDisplay = (emotionName: string) => {
        const emotionEmojis: Record<string, string> = {
            happy: '😊', sad: '😢', angry: '😠', excited: '🎉', scared: '😨', normal: '😐'
        };
        const emoji = emotionEmojis[emotionName] || '';
        return `${emoji} ${emotionName.charAt(0).toUpperCase() + emotionName.slice(1)}`;
    };

    return (
        <div className="flex-shrink-0 bg-[var(--bg-surface)]/60 backdrop-blur-sm border-b border-[var(--border-subtle)]">
            {/* Main Controls Row - Compact & Clean */}
            <div className="max-w-5xl mx-auto w-full px-6 lg:px-8 py-3">
                <div className="flex items-center gap-4 flex-wrap">

                    {/* Smart Emotion - Compact Toggle */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onSmartEmotionChange(!smartEmotion)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${smartEmotion
                                ? 'bg-gradient-to-r from-[var(--accent-neon)]/20 to-[var(--brand-violet)]/20 text-[var(--accent-neon)] border border-[var(--accent-neon)]/40'
                                : 'bg-[var(--bg-surface-light)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-secondary)]'
                                }`}
                        >
                            <Sparkles size={12} className={smartEmotion ? 'text-[var(--accent-neon)]' : ''} />
                            <span>Smart Emotion</span>
                            {smartEmotion && (
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-neon)] animate-pulse" />
                            )}
                        </button>

                        {/* Detected Emotion Badge (when smart emotion is enabled) */}
                        {smartEmotion && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--bg-surface-light)]/50 rounded-full text-xs">
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 size={10} className="animate-spin text-[var(--accent-neon)]" />
                                        <span className="text-[var(--text-secondary)]">...</span>
                                    </>
                                ) : detectedEmotion ? (
                                    <span className="text-[var(--text-primary)]">
                                        {getEmotionDisplay(detectedEmotion.detected_emotion)}
                                    </span>
                                ) : (
                                    <span className="text-[var(--text-secondary)] italic">Auto</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Emotion Dropdown (when smart emotion is off) */}
                    {!smartEmotion && (
                        <div className="flex items-center gap-2">
                            <Crown size={12} className="text-[var(--text-accent)]" />
                            <select
                                value={emotion}
                                onChange={(e) => onUpdate('emotion', e.target.value)}
                                className="bg-[var(--bg-surface-light)] text-xs rounded-full px-3 py-1.5 border border-[var(--border-subtle)] outline-none focus:border-[var(--text-accent)] text-[var(--text-primary)] cursor-pointer hover:border-[var(--text-secondary)] transition-colors"
                            >
                                <option value="normal">Normal</option>
                                {voiceEmotions.map(em => (
                                    <option key={em} value={em}>{em.charAt(0).toUpperCase() + em.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="w-px h-5 bg-[var(--border-subtle)] hidden sm:block" />

                    {/* Speed - Compact Slider */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-secondary)]">Speed</span>
                        <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={speed}
                            onChange={(e) => onUpdate('speed', parseFloat(e.target.value))}
                            className="w-16 h-1 bg-[var(--bg-surface-light)] rounded-full appearance-none cursor-pointer accent-[var(--text-accent)]"
                        />
                        <span className="text-xs text-[var(--text-primary)] font-mono w-8">{speed}x</span>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-5 bg-[var(--border-subtle)] hidden sm:block" />

                    {/* Dynamics - Simple indicator */}
                    <div className="flex items-center gap-2">
                        <Zap size={12} className={intensity > 1 ? 'text-[var(--accent-neon)]' : 'text-[var(--text-secondary)]'} />
                        <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={intensity}
                            onChange={(e) => onUpdate('intensity', parseFloat(e.target.value))}
                            className="w-14 h-1 bg-[var(--bg-surface-light)] rounded-full appearance-none cursor-pointer accent-[var(--text-accent)]"
                        />
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Advanced Toggle Button */}
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${showAdvanced
                            ? 'bg-[var(--bg-surface-light)] text-[var(--text-primary)] border border-[var(--border-accent)]'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-light)]'
                            }`}
                    >
                        <span>More</span>
                        <ChevronDown
                            size={12}
                            className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
                        />
                    </button>
                </div>
            </div>

            {/* Advanced Controls - Expandable */}
            <div className={`overflow-hidden transition-all duration-300 ease-out ${showAdvanced ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="max-w-5xl mx-auto w-full px-6 lg:px-8 pb-3">
                    <div className="flex items-center gap-6 flex-wrap pt-2 border-t border-[var(--border-subtle)]/50">

                        {/* Pitch */}
                        <div className="flex items-center gap-2">
                            <Music size={12} className="text-[var(--text-secondary)]" />
                            <span className="text-xs text-[var(--text-secondary)]">Pitch</span>
                            <input
                                type="number"
                                step="1"
                                min="-12"
                                max="12"
                                value={pitch}
                                onChange={(e) => onUpdate('pitch', parseInt(e.target.value))}
                                className="w-14 bg-[var(--bg-surface-light)] text-xs rounded px-2 py-1 border border-[var(--border-subtle)] outline-none focus:border-[var(--text-accent)] text-center"
                            />
                            <span className="text-[10px] text-[var(--text-secondary)]">st</span>
                        </div>

                        {/* Volume */}
                        <div className="flex items-center gap-2">
                            <Volume2 size={12} className="text-[var(--text-secondary)]" />
                            <span className="text-xs text-[var(--text-secondary)]">Volume</span>
                            <input
                                type="number"
                                step="10"
                                min="0"
                                max="200"
                                value={volume}
                                onChange={(e) => onUpdate('volume', parseInt(e.target.value))}
                                className="w-14 bg-[var(--bg-surface-light)] text-xs rounded px-2 py-1 border border-[var(--border-subtle)] outline-none focus:border-[var(--text-accent)] text-center"
                            />
                            <span className="text-[10px] text-[var(--text-secondary)]">%</span>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-5 bg-[var(--border-subtle)]" />

                        {/* Audio Format */}
                        <div className="flex items-center gap-2">
                            <FileAudio size={12} className="text-[var(--text-secondary)]" />
                            <select
                                value={audioFormat}
                                onChange={(e) => onUpdate('audioFormat', e.target.value)}
                                className="bg-[var(--bg-surface-light)] text-xs rounded px-2 py-1 border border-[var(--border-subtle)] outline-none focus:border-[var(--text-accent)] text-[var(--text-primary)] cursor-pointer"
                            >
                                <option value="wav">WAV</option>
                                <option value="mp3">MP3</option>
                            </select>
                        </div>


                    </div>
                </div>
            </div>
        </div>
    );
};
