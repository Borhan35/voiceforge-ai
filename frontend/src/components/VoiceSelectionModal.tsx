import React, { useState } from 'react';
import { Search, Bookmark, MoreVertical, Check } from 'lucide-react';
import type { Voice, VoiceFilters } from '../types';
import { LANGUAGE_NAME_MAP } from './VoiceSelector';

interface VoiceSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    voices: Voice[];
    filters: VoiceFilters;
    onFiltersChange: (filters: VoiceFilters) => void;
    selectedVoiceId: string;
    onSelectVoice: (voiceId: string) => void;
    apiKey: string;
    previewStates: Record<string, 'idle' | 'loading' | 'playing'>;
    handlePlayPreview: (e: React.MouseEvent, voiceId: string) => void;
    savedVoiceIds: Set<string>;
    onToggleSave: (voiceId: string) => void;
    selectedModel: string;
    onSelectModel: (model: string) => void;
    availableStyles: string[];
    availableAges: string[];
    availableLanguages: string[];
    availableGenders: string[];
}

const MODELS = [
    { id: 'ssfm-v21', name: 'SSFM 2.1', description: 'Low latency multilingual model (default)' },
];

export const VoiceSelectionModal: React.FC<VoiceSelectionModalProps> = ({
    isOpen, onClose, voices, filters, onFiltersChange, selectedVoiceId, onSelectVoice, previewStates, handlePlayPreview, savedVoiceIds, onToggleSave, selectedModel, onSelectModel, availableStyles, availableAges, availableLanguages, availableGenders
}) => {
    const [activeTab, setActiveTab] = useState<'explore' | 'saved'>('explore');
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [dropdownPosition, setDropdownPosition] = useState<React.CSSProperties | null>(null);

    // Toggle a style filter chip (Multi-select - can select multiple styles)
    const handleChipClick = (style: string) => {
        const currentStyles = filters.selectedStyles || [];
        if (currentStyles.includes(style)) {
            onFiltersChange({ ...filters, selectedStyles: currentStyles.filter(s => s !== style) });
        } else {
            onFiltersChange({ ...filters, selectedStyles: [...currentStyles, style] });
        }
    };

    const handleOpenDropdown = (e: React.MouseEvent<HTMLButtonElement>, voiceId: string) => {
        e.stopPropagation();
        if (openDropdownId === voiceId) {
            setOpenDropdownId(null);
            setDropdownPosition(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const dropdownHeight = 220; // approximate max height for 3 items + padding
        const showAbove = spaceBelow < dropdownHeight;

        if (showAbove) {
            setDropdownPosition({
                position: 'fixed',
                bottom: (window.innerHeight - rect.top) + 5, // 5px above the button top
                right: window.innerWidth - rect.right,
                zIndex: 60,
                transformOrigin: 'bottom right'
            });
        } else {
            setDropdownPosition({
                position: 'fixed',
                top: rect.bottom + 5, // 5px below the button bottom
                right: window.innerWidth - rect.right,
                zIndex: 60,
                transformOrigin: 'top right'
            });
        }
        setOpenDropdownId(voiceId);
    };

    if (!isOpen) return null;

    // Filter voices based on tab
    const displayVoices = voices.filter(voice => {
        if (activeTab === 'saved') {
            return savedVoiceIds.has(voice.voice_id);
        }
        return true;
    });

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => { setOpenDropdownId(null); onClose(); }}
        >
            <div className="w-full max-w-2xl bg-[var(--bg-surface)] rounded-xl shadow-2xl border border-[var(--border-subtle)] flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>

                {/* HeaderTabs */}
                <div className="flex border-b border-[var(--border-subtle)]">
                    <button
                        onClick={() => setActiveTab('explore')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === 'explore' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        Explore
                        {activeTab === 'explore' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--text-primary)]" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === 'saved' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        <Bookmark size={14} className="inline mr-2" fill={activeTab === 'saved' ? "currentColor" : "none"} />
                        Saved
                        {activeTab === 'saved' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--text-primary)]" />}
                    </button>
                </div>

                {/* Premium Filters Section */}
                <div className="p-4 space-y-3 bg-gradient-to-b from-[var(--bg-surface-light)]/50 to-transparent">

                    {/* Search Bar - Always Visible, Beautiful */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-violet)]/20 to-[var(--brand-magenta)]/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative flex items-center bg-[var(--bg-deep)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--brand-violet)]/40 transition-all duration-300">
                            <Search size={16} className="ml-4 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                value={filters.searchQuery}
                                onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
                                placeholder="Search by name, style, or language..."
                                className="flex-1 bg-transparent text-sm px-3 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
                            />
                            {filters.searchQuery && (
                                <button
                                    onClick={() => onFiltersChange({ ...filters, searchQuery: '' })}
                                    className="mr-3 p-1 rounded-full hover:bg-[var(--bg-surface-light)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Pills Container - Glassmorphism Card */}
                    <div className="bg-[var(--bg-deep)]/60 backdrop-blur-sm rounded-xl border border-[var(--border-subtle)] p-3 space-y-3">

                        {/* Styles - Horizontal Scroll with Gradient Fade */}
                        <div className="relative">
                            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 pr-8" style={{ maskImage: 'linear-gradient(to right, black 90%, transparent 100%)' }}>
                                {availableStyles.map(style => {
                                    const isActive = filters.selectedStyles?.includes(style);
                                    return (
                                        <button
                                            key={style}
                                            onClick={() => handleChipClick(style)}
                                            className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 transform hover:scale-[1.02] ${isActive
                                                ? 'bg-gradient-to-r from-[var(--brand-violet)] to-[var(--brand-magenta)] text-white shadow-lg shadow-[var(--brand-violet)]/30'
                                                : 'bg-[var(--bg-surface-light)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)]'
                                                }`}
                                        >
                                            <span className={`${isActive ? '' : 'opacity-60'}`}>#</span>{style}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent" />

                        {/* Quick Filters Grid - All Dropdowns */}
                        <div className="grid grid-cols-3 gap-4">

                            {/* Gender Dropdown */}
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-[var(--brand-pink)]"></span>
                                    Gender
                                </span>
                                <div className="relative">
                                    <select
                                        className={`w-full appearance-none text-[11px] font-medium rounded-lg px-3 py-2 pr-7 border focus:outline-none cursor-pointer transition-all ${filters.selectedGenders?.length > 0
                                            ? 'bg-[var(--brand-pink)] text-white border-[var(--brand-pink)]'
                                            : 'bg-[var(--bg-surface-light)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] focus:border-[var(--brand-pink)]'
                                            }`}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'all') {
                                                onFiltersChange({ ...filters, selectedGenders: [] });
                                            } else {
                                                onFiltersChange({ ...filters, selectedGenders: [val] });
                                            }
                                        }}
                                        value={filters.selectedGenders?.[0] || 'all'}
                                    >
                                        <option value="all">All Genders</option>
                                        {availableGenders.map(gender => (
                                            <option key={gender} value={gender}>
                                                {gender === 'Male' ? '♂ ' : gender === 'Female' ? '♀ ' : ''}{gender}
                                            </option>
                                        ))}
                                    </select>
                                    <div className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs ${filters.selectedGenders?.length > 0 ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                                        ▾
                                    </div>
                                </div>
                            </div>

                            {/* Age Dropdown */}
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-[var(--brand-violet)]"></span>
                                    Age Group
                                </span>
                                <div className="relative">
                                    <select
                                        className={`w-full appearance-none text-[11px] font-medium rounded-lg px-3 py-2 pr-7 border focus:outline-none cursor-pointer transition-all ${filters.selectedAges?.length > 0
                                            ? 'bg-[var(--brand-violet)] text-white border-[var(--brand-violet)]'
                                            : 'bg-[var(--bg-surface-light)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] focus:border-[var(--brand-violet)]'
                                            }`}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'all') {
                                                onFiltersChange({ ...filters, selectedAges: [] });
                                            } else {
                                                onFiltersChange({ ...filters, selectedAges: [val] });
                                            }
                                        }}
                                        value={filters.selectedAges?.[0] || 'all'}
                                    >
                                        <option value="all">All Ages</option>
                                        {availableAges.map(age => (
                                            <option key={age} value={age}>{age}</option>
                                        ))}
                                    </select>
                                    <div className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs ${filters.selectedAges?.length > 0 ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                                        ▾
                                    </div>
                                </div>
                            </div>

                            {/* Language Dropdown */}
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-[var(--accent-neon)]"></span>
                                    Language
                                </span>
                                <div className="relative">
                                    <select
                                        className={`w-full appearance-none text-[11px] font-medium rounded-lg px-3 py-2 pr-7 border focus:outline-none cursor-pointer transition-all ${filters.selectedLanguages?.length > 0
                                            ? 'bg-[var(--accent-neon)] text-black border-[var(--accent-neon)]'
                                            : 'bg-[var(--bg-surface-light)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] focus:border-[var(--accent-neon)]'
                                            }`}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'all') {
                                                onFiltersChange({ ...filters, selectedLanguages: [] });
                                            } else {
                                                onFiltersChange({ ...filters, selectedLanguages: [val] });
                                            }
                                        }}
                                        value={filters.selectedLanguages?.[0] || 'all'}
                                    >
                                        <option value="all">All Languages</option>
                                        {availableLanguages.map(lang => (
                                            <option key={lang} value={lang}>
                                                {LANGUAGE_NAME_MAP[lang] || lang.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                    <div className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs ${filters.selectedLanguages?.length > 0 ? 'text-black/50' : 'text-[var(--text-muted)]'}`}>
                                        ▾
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Native Only Toggle - Sleek Switch Style */}
                        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-[var(--text-secondary)]">Show only</span>
                                <span className="text-xs font-semibold text-[var(--text-primary)]">Native (Expert) Voices</span>
                            </div>
                            <button
                                onClick={() => onFiltersChange({ ...filters, nativeOnly: !filters.nativeOnly })}
                                className={`relative w-10 h-5 rounded-full transition-all duration-300 ${filters.nativeOnly
                                    ? 'bg-gradient-to-r from-[var(--brand-violet)] to-[var(--brand-magenta)]'
                                    : 'bg-[var(--bg-surface-hover)]'
                                    }`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${filters.nativeOnly ? 'left-[22px]' : 'left-0.5'
                                    }`} />
                            </button>
                        </div>

                        {/* Active Filters Summary */}
                        {(filters.selectedStyles?.length > 0 || filters.selectedGenders?.length > 0 || filters.selectedAges?.length > 0 || filters.selectedLanguages?.length > 0 || filters.nativeOnly) && (
                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] text-[var(--text-muted)]">Active:</span>
                                    {filters.selectedStyles?.map(s => (
                                        <span key={s} className="px-2 py-0.5 bg-[var(--brand-violet)]/20 text-[var(--brand-violet-light)] text-[10px] rounded-full">#{s}</span>
                                    ))}
                                    {filters.selectedGenders?.map(g => (
                                        <span key={g} className="px-2 py-0.5 bg-[var(--brand-pink)]/20 text-[var(--brand-pink)] text-[10px] rounded-full">{g}</span>
                                    ))}
                                    {filters.selectedAges?.map(a => (
                                        <span key={a} className="px-2 py-0.5 bg-[var(--brand-violet)]/20 text-[var(--brand-violet-light)] text-[10px] rounded-full">{a}</span>
                                    ))}
                                    {filters.selectedLanguages?.map(l => (
                                        <span key={l} className="px-2 py-0.5 bg-[var(--accent-neon)]/20 text-[var(--accent-neon)] text-[10px] rounded-full">{LANGUAGE_NAME_MAP[l] || l}</span>
                                    ))}
                                    {filters.nativeOnly && (
                                        <span className="px-2 py-0.5 bg-[var(--brand-magenta)]/20 text-[var(--brand-magenta)] text-[10px] rounded-full">Native Only</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => onFiltersChange({
                                        searchQuery: '',
                                        selectedLanguages: [],
                                        selectedAges: [],
                                        selectedStyles: [],
                                        selectedGenders: [],
                                        nativeOnly: false
                                    })}
                                    className="text-[10px] text-[var(--text-muted)] hover:text-[var(--brand-pink)] transition-colors font-medium"
                                >
                                    Clear All
                                </button>
                            </div>
                        )}
                    </div>
                </div>


                {/* Voice List */}
                <div
                    className="flex-1 overflow-y-auto custom-scrollbar p-0"
                    onClick={() => setOpenDropdownId(null)}
                    onScroll={() => setOpenDropdownId(null)} // Close dropdown on scroll
                >
                    <div className="p-4">
                        <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                            {activeTab === 'saved' ? `Saved Voices (${displayVoices.length})` : `All Voices (${displayVoices.length})`}
                        </h3>

                        <div className="space-y-1 pb-24">
                            {displayVoices.length === 0 && (
                                <div className="text-center py-8 text-[var(--text-secondary)] text-sm">
                                    {activeTab === 'saved' ? "No saved voices yet." : "No voices found."}
                                </div>
                            )}

                            {displayVoices.map(voice => {
                                const isSelected = selectedVoiceId === voice.voice_id;
                                const isSaved = savedVoiceIds.has(voice.voice_id);
                                const isDropdownOpen = openDropdownId === voice.voice_id;

                                return (
                                    <div
                                        key={voice.voice_id}
                                        onClick={() => onSelectVoice(voice.voice_id)}
                                        className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer group transition-colors relative ${isSelected ? 'bg-[var(--bg-surface-light)]' : 'hover:bg-[var(--bg-surface-light)]'}`}
                                    >
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-700 flex-shrink-0">
                                            {voice.image_url ? (
                                                <img src={voice.image_url} alt={voice.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-bold text-lg text-white/50">{voice.name.charAt(0)}</div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold">
                                                <span>{voice.name}</span>
                                                {/* Multilingual Badge */}
                                                {voice.languages && voice.languages.length > 1 && (
                                                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-gradient-to-r from-[var(--brand-cyan)] to-[var(--brand-violet)] text-white uppercase tracking-wider">
                                                        {voice.languages.length} Lang
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-1">
                                                <span>Native: {LANGUAGE_NAME_MAP[voice.native_language?.toLowerCase() || 'en'] || voice.native_language}</span>
                                                {voice.languages && voice.languages.length > 1 && (
                                                    <>
                                                        <span className="w-px h-3 bg-[var(--text-secondary)] opacity-30" />
                                                        <span className="text-[var(--text-accent)] text-[10px]">
                                                            +{voice.languages.length - 1} more
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                className={`p-2 transition-colors ${isSaved ? 'text-[var(--text-accent)] opacity-100' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100'}`}
                                                onClick={(e) => { e.stopPropagation(); onToggleSave(voice.voice_id); }}
                                                title="Bookmark Voice"
                                            >
                                                <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
                                            </button>

                                            <button
                                                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors opacity-0 group-hover:opacity-100"
                                                onClick={(e) => handlePlayPreview(e, voice.voice_id)}
                                                title="Preview Voice"
                                            >
                                                {previewStates[voice.voice_id] === 'loading' ? (
                                                    <div className="w-4 h-4 border-2 border-[var(--text-secondary)] border-t-transparent rounded-full animate-spin" />
                                                ) : previewStates[voice.voice_id] === 'playing' ? (
                                                    <div className="w-4 h-4 bg-[var(--text-accent)] rounded-sm animate-pulse" />
                                                ) : (
                                                    <div className="w-0 h-0 border-l-[14px] border-l-current border-y-[8px] border-y-transparent ml-1" />
                                                )}
                                            </button>

                                            {/* Model Dropdown Trigger */}
                                            <button
                                                className={`p-2 transition-colors ${isDropdownOpen ? 'text-[var(--text-primary)] opacity-100' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100'}`}
                                                onClick={(e) => handleOpenDropdown(e, voice.voice_id)}
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Fixed Dropdown Menu (Portal-style) */}
                {openDropdownId && dropdownPosition && (
                    <div
                        className="fixed w-72 bg-[var(--bg-card)] rounded-xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden animate-fade-in-up"
                        style={dropdownPosition}
                    >
                        {MODELS.map(model => (
                            <div
                                key={model.id}
                                onClick={(e) => { e.stopPropagation(); onSelectModel(model.id); setOpenDropdownId(null); }}
                                className="flex items-start gap-3 p-4 hover:bg-[var(--bg-surface-light)] cursor-pointer transition-colors border-b border-[var(--border-subtle)] last:border-0"
                            >
                                <div className={`mt-0.5 ${selectedModel === model.id ? 'text-[var(--text-accent)]' : 'text-transparent'}`}>
                                    <Check size={16} />
                                </div>
                                <div className="flex-1">
                                    <div className={`text-sm font-medium mb-0.5 ${selectedModel === model.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
                                        {model.name}
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                        {model.description}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};
