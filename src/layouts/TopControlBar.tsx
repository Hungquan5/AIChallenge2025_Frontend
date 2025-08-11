import React from 'react';
import type { ViewMode } from '../features/results/types';

interface Props {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onShowShortcuts: () => void;
  // ✅ 1. ADD NEW PROPS FOR THE TOGGLE
  isAutoTranslateEnabled: boolean;
  onAutoTranslateChange: (enabled: boolean) => void;
}

const TopControlBar: React.FC<Props> = ({
  viewMode,
  onViewModeChange,
  onShowShortcuts,
  isAutoTranslateEnabled,
  onAutoTranslateChange,
}) => {
  return (
    <div className="flex justify-between items-center p-4 bg-white/60 backdrop-blur-sm border-b border-slate-200/70">
      <div className="flex items-center gap-4">
        {/* View Mode Toggles */}
        <div className="flex items-center gap-2 p-1 bg-slate-100/80 rounded-xl">
          <button
            onClick={() => onViewModeChange('sortByConfidence')}
            className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
              viewMode === 'sortByConfidence'
                ? 'bg-white text-blue-600 shadow-md'
                : 'bg-transparent text-slate-600 hover:bg-white/70'
            }`}
          >
            Sort by Confidence
          </button>
          <button
            onClick={() => onViewModeChange('groupByVideo')}
            className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
              viewMode === 'groupByVideo'
                ? 'bg-white text-blue-600 shadow-md'
                : 'bg-transparent text-slate-600 hover:bg-white/70'
            }`}
          >
            Group by Video
          </button>
        </div>

 {/* ✅ 2. ADD THE AUTO-TRANSLATE TOGGLE SWITCH */}
 <div className="border-l border-slate-300/60 pl-4">
          <label htmlFor="auto-translate-toggle" className="flex items-center cursor-pointer select-none">
            <span className="mr-3 text-sm font-semibold text-slate-700">Auto-Translate</span>
            <div className="relative">
              <input
                type="checkbox"
                id="auto-translate-toggle"
                className="sr-only peer"
                checked={isAutoTranslateEnabled}
                onChange={(e) => onAutoTranslateChange(e.target.checked)}
              />
              <div className="block bg-gray-300 w-12 h-7 rounded-full transition"></div>
              <div className="dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-full peer-checked:bg-blue-500"></div>
            </div>
          </label>
        </div>
      </div>  

      {/* Shortcuts Button */}
      <button
        onClick={onShowShortcuts}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-600 bg-slate-100/80 rounded-lg hover:bg-white/90 hover:shadow-md transition-all"
      >
        <span className="text-base">⌨️</span>
        <span>Shortcuts</span>
      </button>
    </div>
  );
};

export default TopControlBar;