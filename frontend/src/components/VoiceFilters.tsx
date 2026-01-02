import React, { useState } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import type { VoiceFilters } from '../types';

export const LANGUAGE_NAME_MAP: Record<string, string> = {
    'en': 'English', 'ko': 'Korean', 'zh': 'Chinese', 'es': 'Spanish',
    'ar': 'Arabic', 'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese',
    'de': 'German', 'fr': 'French', 'id': 'Indonesian', 'it': 'Italian',
    'ms': 'Malay', 'pl': 'Polish', 'nl': 'Dutch', 'uk': 'Ukrainian',
    'el': 'Greek', 'ta': 'Tamil', 'sv': 'Swedish', 'cs': 'Czech',
    'da': 'Danish', 'fi': 'Finnish', 'tl': 'Tagalog', 'sk': 'Slovak',
    'bg': 'Bulgarian', 'hr': 'Croatian', 'ro': 'Romanian'
};

interface VoiceFiltersProps {
    filters: VoiceFilters;
    onFiltersChange: (filters: VoiceFilters) => void;
    availableStyles: string[];
    availableLanguages: string[];
    availableAges: string[];
    filteredCount: number;
}

export const VoiceFiltersComponent: React.FC<VoiceFiltersProps> = ({
    filters,
    onFiltersChange,
    availableStyles,
    availableLanguages,
    availableAges,
    filteredCount
}) => {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const updateFilters = (updates: Partial<VoiceFilters>) => {
        onFiltersChange({ ...filters, ...updates });
    };

    const hasActiveFilters = filters.searchQuery ||
        filters.selectedGenders?.length > 0 ||
        filters.selectedLanguages.length > 0 ||
        filters.selectedAges.length > 0 ||
        filters.selectedStyles.length > 0 ||
        filters.nativeOnly;

    const clearAllFilters = () => {
        onFiltersChange({
            searchQuery: '',
            selectedLanguages: [],
            selectedAges: [],
            selectedStyles: [],
            selectedGenders: [],
            nativeOnly: false
        });
    };

    return (
        <div className="space-y-3">
            {/* Search Bar - Clean and Minimal */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                <input
                    type="text"
                    placeholder="Search voices..."
                    value={filters.searchQuery}
                    onChange={(e) => updateFilters({ searchQuery: e.target.value })}
                    className="w-full bg-[var(--bg-surface-light)] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] border border-transparent focus:border-[var(--border-accent)] focus:outline-none transition-all"
                />
                {filters.searchQuery && (
                    <button
                        onClick={() => updateFilters({ searchQuery: '' })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Quick Filters - Pill Style */}
            <div className="flex flex-wrap gap-2">
                {/* Gender Pills */}
                {['Male', 'Female'].map((gender) => {
                    const isSelected = filters.selectedGenders?.includes(gender);
                    return (
                        <button
                            key={gender}
                            onClick={() => {
                                const current = filters.selectedGenders || [];
                                const next = current.includes(gender)
                                    ? current.filter(g => g !== gender)
                                    : [...current, gender];
                                updateFilters({ selectedGenders: next });
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isSelected
                                    ? 'bg-[var(--brand-violet)] text-white shadow-sm'
                                    : 'bg-[var(--bg-surface-light)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                                }`}
                        >
                            {gender}
                        </button>
                    );
                })}

                {/* Language Dropdown Pill */}
                {availableLanguages.length > 0 && (
                    <div className="relative">
                        <select
                            className={`appearance-none px-3 py-1.5 pr-7 rounded-full text-xs font-medium cursor-pointer transition-all ${filters.selectedLanguages.length > 0
                                    ? 'bg-[var(--brand-violet)] text-white'
                                    : 'bg-[var(--bg-surface-light)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                                }`}
                            onChange={(e) => {
                                const val = e.target.value;
                                updateFilters({ selectedLanguages: val === 'all' ? [] : [val] });
                            }}
                            value={filters.selectedLanguages[0] || 'all'}
                        >
                            <option value="all">Language</option>
                            {availableLanguages.map(lang => (
                                <option key={lang} value={lang}>
                                    {LANGUAGE_NAME_MAP[lang.toLowerCase()] || lang.toUpperCase()}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" size={12} />
                    </div>
                )}

                {/* Age Dropdown Pill */}
                {availableAges.length > 0 && (
                    <div className="relative">
                        <select
                            className={`appearance-none px-3 py-1.5 pr-7 rounded-full text-xs font-medium cursor-pointer transition-all ${filters.selectedAges.length > 0
                                    ? 'bg-[var(--brand-violet)] text-white'
                                    : 'bg-[var(--bg-surface-light)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                                }`}
                            onChange={(e) => {
                                const val = e.target.value;
                                updateFilters({ selectedAges: val === 'all' ? [] : [val] });
                            }}
                            value={filters.selectedAges[0] || 'all'}
                        >
                            <option value="all">Age</option>
                            {availableAges.map(age => (
                                <option key={age} value={age}>{age}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" size={12} />
                    </div>
                )}

                {/* Native Only Toggle Pill */}
                <button
                    onClick={() => updateFilters({ nativeOnly: !filters.nativeOnly })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filters.nativeOnly
                            ? 'bg-[var(--brand-violet)] text-white shadow-sm'
                            : 'bg-[var(--bg-surface-light)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                        }`}
                >
                    Native Only
                </button>

                {/* Advanced Styles Toggle */}
                {availableStyles.length > 0 && (
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${filters.selectedStyles.length > 0
                                ? 'bg-[var(--brand-violet)] text-white'
                                : 'bg-[var(--bg-surface-light)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                            }`}
                    >
                        Styles
                        {filters.selectedStyles.length > 0 && (
                            <span className="bg-white/20 px-1.5 rounded-full text-[10px]">
                                {filters.selectedStyles.length}
                            </span>
                        )}
                        <ChevronDown size={12} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                    </button>
                )}
            </div>

            {/* Expandable Styles Section */}
            {showAdvanced && availableStyles.length > 0 && (
                <div className="bg-[var(--bg-surface-light)] rounded-xl p-3 animate-fade-in">
                    <div className="flex flex-wrap gap-1.5">
                        {availableStyles.map((style) => (
                            <button
                                key={style}
                                onClick={() => {
                                    const current = filters.selectedStyles;
                                    const next = current.includes(style)
                                        ? current.filter(s => s !== style)
                                        : [...current, style];
                                    updateFilters({ selectedStyles: next });
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${filters.selectedStyles.includes(style)
                                        ? 'bg-[var(--brand-violet)] text-white'
                                        : 'bg-[var(--bg-deep)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                    }`}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Results & Clear - Minimal Footer */}
            <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[var(--text-muted)]">
                    <span className="text-[var(--text-primary)] font-medium">{filteredCount}</span> voices
                </span>
                {hasActiveFilters && (
                    <button
                        onClick={clearAllFilters}
                        className="text-[var(--brand-violet-light)] hover:text-[var(--accent-neon)] font-medium transition-colors"
                    >
                        Clear all
                    </button>
                )}
            </div>
        </div>
    );
};
