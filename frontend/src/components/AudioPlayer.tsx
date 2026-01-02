import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Download, SkipBack, SkipForward, Volume2, VolumeX, RefreshCw } from 'lucide-react';

interface AudioPlayerProps {
    audioUrl: string | null;
    onRegenerate?: () => void;
    isRegenerating?: boolean;
    autoPlay?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, onRegenerate, isRegenerating, autoPlay = false }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    // Toggle Play/Pause
    const togglePlay = () => {
        if (!audioRef.current || !audioUrl) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    // Update time
    const onTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const onLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const onEnded = () => setIsPlaying(false);

    // Volume control
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    const toggleMute = () => setIsMuted(!isMuted);

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (newVolume > 0 && isMuted) {
            setIsMuted(false);
        }
    };

    // Format time
    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
            if (audioUrl && autoPlay) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => setIsPlaying(true))
                        .catch(error => console.error("Auto-play failed:", error));
                }
            }
        }
    }, [audioUrl, autoPlay]);

    if (!audioUrl) return null;

    return (
        <div className="flex items-center justify-between w-full">
            <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                onEnded={onEnded}
            />

            {/* Left: Time */}
            <div className="text-[var(--text-primary)] font-mono text-sm w-24">
                {formatTime(currentTime)} <span className="text-[var(--text-secondary)]">/</span> {formatTime(duration)}
            </div>

            {/* Center: Controls */}
            <div className="flex items-center gap-6">
                <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <SkipBack size={20} />
                </button>
                <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-[var(--text-accent)] hover:bg-[var(--text-accent-hover)] text-black flex items-center justify-center transition-all shadow-lg shadow-orange-500/20 transform hover:scale-105"
                >
                    {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" className="ml-1" />}
                </button>
                <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <SkipForward size={20} />
                </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4 justify-end">
                {/* Volume Control */}
                <div className="flex items-center gap-2 group">
                    <button
                        onClick={toggleMute}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-20 h-1 bg-[var(--bg-card-hover)] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[var(--text-primary)] [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-110 transition-all opacity-0 group-hover:opacity-100 -ml-2 group-hover:ml-0 duration-200"
                    />
                </div>

                {/* Visual separator */}
                <div className="w-px h-4 bg-[var(--border-subtle)]"></div>

                {/* Regenerate Button */}
                {onRegenerate && (
                    <button
                        onClick={onRegenerate}
                        disabled={isRegenerating}
                        className={`p-2 rounded-full transition-colors ${isRegenerating
                            ? 'text-[var(--accent-neon)] animate-spin'
                            : 'text-[var(--text-secondary)] hover:text-[var(--accent-neon)] hover:bg-[var(--accent-subtle)]'
                            }`}
                        title="Regenerate with same settings"
                    >
                        <RefreshCw size={20} />
                    </button>
                )}

                <a
                    href={audioUrl}
                    download="voiceforge_output.wav"
                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-light)] rounded-full transition-colors"
                    title="Download"
                >
                    <Download size={20} />
                </a>
            </div>
        </div>
    );
};
