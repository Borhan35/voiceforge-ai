import { useEffect } from 'react';
import { Play, Pause, Download, X, Clock } from 'lucide-react';
import type { GeneratedAudio } from '../types';

interface GeneratedHistoryProps {
    isOpen: boolean;
    onClose: () => void;
    history: GeneratedAudio[];
    onDelete: (id: string) => void;
    onClearAll: () => void;
    onPlay: (item: GeneratedAudio) => void;
    currentPlayingId: string | null;
}

export function GeneratedHistory({ isOpen, onClose, history, onDelete, onClearAll, onPlay, currentPlayingId }: GeneratedHistoryProps) {
    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleDownload = (item: GeneratedAudio) => {
        const binaryString = window.atob(item.audioBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const mimeType = item.format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${item.voiceName.replace(/\s+/g, '_')}_${Date.now()}.${item.format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-[2px] animate-fade-in"
                onClick={onClose}
            />

            {/* Side Panel Drawer */}
            <div className="relative w-80 h-full bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] shadow-2xl animate-fade-in-right flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 backdrop-blur-xl z-10">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-[var(--text-secondary)]" />
                        <h3 className="font-semibold text-sm text-[var(--text-primary)]">History</h3>
                        <span className="bg-[var(--bg-surface-light)] text-[var(--text-secondary)] text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                            {history.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        {history.length > 0 && (
                            <button
                                onClick={onClearAll}
                                className="text-[10px] text-[var(--text-muted)] hover:text-red-400 px-2 py-1 rounded hover:bg-[var(--bg-active)] transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-lg transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Content List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-2">
                            <Clock size={32} className="opacity-20" />
                            <p className="text-xs">No history yet</p>
                        </div>
                    ) : (
                        history.map((item) => {
                            const isPlaying = currentPlayingId === item.id;
                            return (
                                <div
                                    key={item.id}
                                    className={`relative p-3 rounded-xl border transition-all group ${isPlaying
                                        ? 'bg-[var(--accent-neon)]/5 border-[var(--accent-neon)]/30'
                                        : 'bg-[var(--bg-deep)] border-[var(--border-subtle)] hover:border-[var(--border-accent)]'
                                        }`}
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        {/* Play Button */}
                                        <button
                                            onClick={() => onPlay(item)}
                                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all mt-0.5 ${isPlaying
                                                ? 'bg-[var(--accent-neon)] text-[var(--bg-deep)] shadow-[0_0_10px_var(--accent-glow)]'
                                                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                                                }`}
                                        >
                                            {isPlaying ? <Pause size={12} className="animate-pulse" /> : <Play size={12} className="ml-0.5" />}
                                        </button>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                                                    {item.voiceName}
                                                </span>
                                                <span className="text-[9px] text-[var(--text-muted)] font-mono">
                                                    {formatDuration(item.duration)}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-2">
                                                {item.text}
                                            </p>

                                            {/* Action Bar */}
                                            <div className="flex items-center justify-end gap-1 pt-2 border-t border-[var(--border-subtle)]/50">
                                                <button
                                                    onClick={() => handleDownload(item)}
                                                    className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-all"
                                                >
                                                    <Download size={10} />
                                                    Download
                                                </button>
                                                <button
                                                    onClick={() => onDelete(item.id)}
                                                    className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                >
                                                    <X size={10} />
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
