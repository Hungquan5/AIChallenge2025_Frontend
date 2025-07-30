import React from 'react';
import type { ViewMode } from '../features/results/types';

interface Props {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onShowShortcuts: () => void;
}

const TopControlBar: React.FC<Props> = ({
  viewMode,
  onViewModeChange,
  onShowShortcuts,
}) => {
  return (
    <div className="flex justify-between items-center p-4 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
      <div className="flex gap-4">
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
