import { forwardRef } from 'react';
import { Send, Loader2, BookOpen, Mic2, Tv, Film, Type, Coins } from 'lucide-react';
import type { Voice } from '../types';

interface TextInputProps {
    text: string;
    onChange: (text: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    selectedVoice?: Voice;
    onVoiceClick?: () => void;
}

export const TextInput = forwardRef<HTMLTextAreaElement, TextInputProps>(({ text, onChange, onGenerate, isGenerating, selectedVoice, onVoiceClick }, ref) => {
    const examples = [
        { icon: <BookOpen size={14} />, text: "Tell a bedtime story" },
        { icon: <Mic2 size={14} />, text: "Introduce a podcast panel" },
        { icon: <Tv size={14} />, text: "Record a business voicemail" },
        { icon: <BookOpen size={14} />, text: "Create a training session" },
        { icon: <BookOpen size={14} />, text: "Teach the alphabet" },
        { icon: <Film size={14} />, text: "Dub a Sci-Fi movie scene" }
    ];

    return (
        <div className="h-full flex flex-col relative group">
            {/* Voice Pill */}
            {selectedVoice && (
                <div className="absolute top-0 left-0 z-10">
                    <div
                        onClick={onVoiceClick}
                        className="flex items-center gap-2 bg-[var(--bg-surface-light)] border border-[var(--border-subtle)] rounded-full pl-1 pr-3 py-1 cursor-pointer hover:border-[var(--text-accent)] transition-colors"
                    >
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-700">
                            {selectedVoice.image_url ? (
                                <img src={selectedVoice.image_url} alt={selectedVoice.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                                    {selectedVoice.name?.charAt(0)}
                                </div>
                            )}
                        </div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">{selectedVoice.name}</span>
                        <span className="text-[var(--text-secondary)]">›</span>
                    </div>
                </div>
            )}

            {/* Standard Textarea - No Overlay/Pause Processing */}
            <textarea
                ref={ref}
                value={text}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Type your script here."
                className="w-full h-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 pt-12 text-lg md:text-xl text-[var(--text-primary)] caret-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none font-serif leading-relaxed custom-scrollbar selection:bg-[var(--text-accent)]/30"
                disabled={isGenerating}
                spellCheck={false}
            />

            {/* Empty State Examples */}
            {!text && (
                <div className="absolute top-1/2 left-0 w-full px-4 transform -translate-y-1/2 opacity-50 pointer-events-none md:pointer-events-auto md:opacity-100 transition-opacity z-20">
                    <div className="flex flex-col gap-4 mt-32">
                        <span className="text-sm text-[var(--text-secondary)]">Get started with examples</span>
                        <div className="flex flex-wrap gap-2">
                            {examples.map((ex, i) => (
                                <button
                                    key={i}
                                    onClick={() => onChange(ex.text)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-light)] hover:bg-[var(--bg-surface)] hover:border-[var(--text-secondary)] transition-all text-xs font-medium text-[var(--text-secondary)]"
                                >
                                    {ex.icon}
                                    {ex.text}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Action Button for Generation */}
            {text.trim() && (
                <div className="absolute bottom-4 right-4 md:bottom-0 md:right-0 animate-fade-in z-20">
                    <button
                        onClick={onGenerate}
                        disabled={isGenerating}
                        className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm tracking-wide shadow-2xl transition-all transform hover:-translate-y-1 ${isGenerating
                            ? 'bg-[var(--bg-surface-light)] text-[var(--text-secondary)] cursor-not-allowed'
                            : 'bg-[var(--text-accent)] text-black hover:bg-[var(--text-accent-hover)]'
                            }`}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                <span>PROCESSING...</span>
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                <span>GENERATE SPEECH</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Character Counter & Credit Estimate */}
            {text.length > 0 && (
                <div className="absolute bottom-4 left-4 md:bottom-2 md:left-2 z-20 pointer-events-none animate-fade-in flex items-center gap-4 text-xs font-medium text-[var(--text-tertiary)]">
                    <div className="flex items-center gap-1.5 bg-[var(--bg-surface-light)]/50 px-2 py-1 rounded-full backdrop-blur-[2px]">
                        <Type size={12} className="text-[var(--text-secondary)]" />
                        <span>{text.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[var(--bg-surface-light)]/50 px-2 py-1 rounded-full backdrop-blur-[2px]">
                        <Coins size={12} className="text-amber-400" />
                        <span>~{text.length * 2}</span>
                    </div>
                </div>
            )}

        </div>
    );
});

TextInput.displayName = 'TextInput';
