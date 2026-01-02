import React, { useState, useEffect } from 'react';
import { Key, Save, Eye, EyeOff, X, Trash2, Edit3 } from 'lucide-react';

interface ApiKeyModalProps {
    isOpen: boolean;
    onSave: (key: string) => void;
    onClose?: () => void;
    onClear?: () => void;
    existingKey?: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
    isOpen,
    onSave,
    onClose,
    onClear,
    existingKey = ''
}) => {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [isEditing, setIsEditing] = useState(!existingKey);

    useEffect(() => {
        if (isOpen) {
            setApiKey(existingKey ? '' : '');
            setIsEditing(!existingKey);
            setShowKey(false);
        }
    }, [isOpen, existingKey]);

    if (!isOpen) return null;

    const maskedKey = existingKey
        ? `${existingKey.slice(0, 8)}${'•'.repeat(Math.max(0, existingKey.length - 12))}${existingKey.slice(-4)}`
        : '';

    const handleSave = () => {
        if (apiKey.trim()) {
            onSave(apiKey.trim());
            setApiKey('');
            setIsEditing(false);
        }
    };

    const handleClear = () => {
        if (window.confirm('Are you sure you want to remove your API key? You will need to enter it again to use the app.')) {
            onClear?.();
        }
    };

    const canClose = !!existingKey && onClose;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 relative">
                {/* Close Button */}
                {canClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--accent-neon)] transition-colors p-1 rounded-lg hover:bg-[var(--accent-subtle)]"
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                )}

                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-[var(--brand-violet)]/20 via-[var(--brand-magenta)]/20 to-[var(--brand-rose)]/20 rounded-full flex items-center justify-center border border-[var(--border-accent)] shadow-[0_0_20px_var(--accent-glow)]">
                        <Key className="text-[var(--brand-violet-light)]" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                        {existingKey ? 'Manage API Key' : 'Enter API Key'}
                    </h2>
                    <p className="text-[var(--text-secondary)] text-center">
                        {existingKey
                            ? 'Your API key is stored locally in your browser. You can view, edit, or clear it below.'
                            : 'To use VoiceForge AI, you need a Typecast API Key. Your key is stored locally in your browser.'
                        }
                    </p>
                </div>

                {/* Existing Key Display */}
                {existingKey && !isEditing && (
                    <div className="space-y-4">
                        <div className="bg-[var(--bg-deep)] border border-[var(--border-subtle)] rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Current API Key</span>
                                <button
                                    onClick={() => setShowKey(!showKey)}
                                    className="text-[var(--text-secondary)] hover:text-[var(--accent-neon)] transition-colors p-1"
                                    title={showKey ? 'Hide key' : 'Show key'}
                                >
                                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <p className="font-mono text-[var(--text-primary)] mt-2 break-all">
                                {showKey ? existingKey : maskedKey}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex-1 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-[var(--brand-violet)] via-[var(--brand-magenta)] to-[var(--brand-rose)] hover:from-[var(--brand-violet-light)] hover:via-[var(--brand-pink)] hover:to-[var(--brand-rose)] flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_var(--accent-glow)] hover:shadow-[0_0_30px_var(--accent-glow-strong)]"
                            >
                                <Edit3 size={18} />
                                Change Key
                            </button>
                            <button
                                onClick={handleClear}
                                className="py-3 px-4 rounded-xl font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 flex items-center justify-center gap-2 transition-all"
                                title="Remove API Key"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Input Mode */}
                {(isEditing || !existingKey) && (
                    <div className="space-y-4">
                        {existingKey && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[var(--text-secondary)]">Enter new API key:</span>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-neon)] transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        <div className="relative">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Paste your Typecast API Key here"
                                className="w-full bg-[var(--bg-deep)] border border-[var(--border-subtle)] rounded-xl p-4 pr-12 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-violet)]/50 focus:border-[var(--brand-violet)] font-mono transition-all"
                                autoFocus
                            />
                            <button
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--accent-neon)] transition-colors"
                                title={showKey ? 'Hide key' : 'Show key'}
                            >
                                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={!apiKey.trim()}
                            className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${apiKey.trim()
                                ? 'bg-gradient-to-r from-[var(--brand-violet)] via-[var(--brand-magenta)] to-[var(--brand-rose)] hover:from-[var(--brand-violet-light)] hover:via-[var(--brand-pink)] hover:to-[var(--brand-rose)] shadow-[0_0_20px_var(--accent-glow)] hover:shadow-[0_0_30px_var(--accent-glow-strong)]'
                                : 'bg-[var(--bg-surface-light)] text-[var(--text-muted)] cursor-not-allowed opacity-50'
                                }`}
                        >
                            <Save size={20} />
                            {existingKey ? 'Update API Key' : 'Save API Key'}
                        </button>
                    </div>
                )}

                <p className="text-xs text-[var(--text-muted)] text-center">
                    Get your key from the <a href="https://typecast.ai/" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-violet-light)] hover:text-[var(--accent-neon)] hover:underline transition-colors">Typecast Console</a>
                </p>
            </div>
        </div>
    );
};
