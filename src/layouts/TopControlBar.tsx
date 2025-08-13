// src/layouts/TopControlBar.tsx

import React from 'react';
// ✅ 1. Import necessary icons
import { ListChecks, Library, Keyboard, Languages } from 'lucide-react';
import type { ViewMode } from '../features/results/types';
import PaginationControls from '../features/results/components/ResultsPanel/PaginationControls';
interface Props {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onShowShortcuts: () => void;
  isAutoTranslateEnabled: boolean;
  onAutoTranslateChange: (enabled: boolean) => void;
  
  // ✅ 2. Add all pagination-related props
  currentPage: number;
  onPageChange: (newPage: number) => void;
  hasNextPage: boolean;
  isLoading: boolean;
  totalResults: number; // To know when to show the controls
}

const TopControlBar: React.FC<Props> = ({
  viewMode,
  onViewModeChange,
  onShowShortcuts,
  isAutoTranslateEnabled,
  onAutoTranslateChange,
  currentPage,
  onPageChange,
  hasNextPage,
  isLoading,
  totalResults,
}) => {
  return (
    <div className="flex justify-between items-center bg-white/60 backdrop-blur-sm border-b border-slate-200/70">
      <div className="flex items-center gap-4">
        {/* View Mode Toggles */}
        <div className="flex items-center gap-2 p-1 bg-slate-100/80 rounded-xl">
          {/* ✅ 2. Add icons to view mode buttons */}
          <button
            onClick={() => onViewModeChange('sortByConfidence')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
              viewMode === 'sortByConfidence'
                ? 'bg-white text-blue-600 shadow-md'
                : 'bg-transparent text-slate-600 hover:bg-white/70'
            }`}
          >
            <ListChecks className="w-5 h-5" />
            Conf
          </button>
          <button
            onClick={() => onViewModeChange('groupByVideo')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
              viewMode === 'groupByVideo'
                ? 'bg-white text-blue-600 shadow-md'
                : 'bg-transparent text-slate-600 hover:bg-white/70'
            }`}
          >
            <Library className="w-5 h-5" />
            Group
          </button>
        </div>

        {/* ✅ 3. Add icon to Auto-Translate toggle label */}
        <div className="border-l border-slate-300/60 pl-4">
          <label htmlFor="auto-translate-toggle" className="flex items-center cursor-pointer select-none">
            <Languages className="w-5 h-5 mr-3 text-slate-600" />
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

      {/* ✅ 4. Add the PaginationControls in the center */}
      <div className="flex-grow flex justify-center">
        {(totalResults > 0 || currentPage > 1) && (
          <PaginationControls
            currentPage={currentPage}
            onPageChange={onPageChange}
            hasNextPage={hasNextPage}
          />
        )}
          </div>

      {/* ✅ 4. Add icon to Shortcuts Button */}
      <button
        onClick={onShowShortcuts}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-600 bg-slate-100/80 rounded-lg hover:bg-white/90 hover:shadow-md transition-all"
      >
        <Keyboard className="w-5 h-5" />
        <span>Shortcuts</span>
      </button>
    </div>
  );
};

export default TopControlBar;