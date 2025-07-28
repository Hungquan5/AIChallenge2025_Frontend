import React from 'react';
import type { ViewMode } from '../features/results/types';
import type { SearchMode } from '../features/search/types';

interface Props {
  searchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onShowShortcuts: () => void;
}

const TopControlBar: React.FC<Props> = ({
  searchMode,
  onSearchModeChange,
  viewMode,
  onViewModeChange,
  onShowShortcuts,
}) => {
  return (
    <div className="flex justify-between items-center p-4 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
      <div className="flex gap-4">
        <select
          value={searchMode}
          onChange={(e) => onSearchModeChange(e.target.value as SearchMode)}
          className="px-3 py-1 border border-[var(--border-color)] rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent transition-all"
        >
          <option value="normal">Normal Search</option>
          <option value="chain">Chain Search</option>
        </select>

        <div className="flex gap-2">
          <button
            onClick={() => onViewModeChange('sortByConfidence')}
            className={`px-3 py-1 rounded-lg ${
              viewMode === 'sortByConfidence'
                ? 'bg-[var(--accent-color)] text-[var(--bg-primary)] shadow-lg shadow-[var(--accent-color)]/20'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
            } hover:bg-[var(--accent-hover)] transition-all hover:-translate-y-0.5`}
          >
            Sort by Confidence
          </button>
          <button
            onClick={() => onViewModeChange('groupByVideo')}
            className={`px-3 py-1 rounded-lg ${
              viewMode === 'groupByVideo'
                ? 'bg-[var(--accent-color)] text-[var(--bg-primary)] shadow-lg shadow-[var(--accent-color)]/20'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
            } hover:bg-[var(--accent-hover)] transition-all hover:-translate-y-0.5`}
          >
            Group by Video
          </button>
        </div>
      </div>

      <button
        onClick={onShowShortcuts}
        className="px-3 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-all hover:-translate-y-0.5"
      >
        <span className="text-sm">⌨</span>
        <span>Shortcuts</span>
      </button>
    </div>
  );
};

export default TopControlBar;
