// src/layouts/TopControlBar.tsx

import React, { useState } from 'react';
import { ListChecks, Library, Keyboard, Languages, Settings, ChevronDown, MessageSquare, Search } from 'lucide-react';
import type { ViewMode } from '../features/results/types';
import type { ModelSelection } from '../features/search/types';
import ModelSelectionPanel from '../features/search/components/ModelSelection/ModelSelection';
import PaginationContainer from '../features/results/components/ResultsPanel/PaginationContainer';
// ✅ ADD: SearchMode type
export type SearchMode = 'manual' | 'chatbot';
interface Props {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onShowShortcuts: () => void;
  isAutoTranslateEnabled: boolean;
  onAutoTranslateChange: (enabled: boolean) => void;
  
  
  // Model selection props
  modelSelection: ModelSelection;
  onModelSelectionChange: (selection: ModelSelection) => void;
  
  // Search mode props
  searchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
}

const TopControlBar: React.FC<Props> = ({
  viewMode,
  onViewModeChange,
  onShowShortcuts,
  isAutoTranslateEnabled,
  onAutoTranslateChange,
  modelSelection,
  onModelSelectionChange,
  searchMode,
  onSearchModeChange,
}) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const enabledModelsCount = Object.values(modelSelection).filter(Boolean).length;

  return (
    <div className="flex flex-1 justify-between items-center">
      <div className="flex items-center gap-4">
        {/* ✅ NEW: Search Mode Toggle - First Position */}
        <div className="flex items-center gap-2 bg-slate-100/80 rounded-xl">
          <button
            onClick={() => onSearchModeChange('manual')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
              searchMode === 'manual'
                ? 'bg-white text-blue-600 shadow-md'
                : 'bg-transparent text-slate-600 hover:bg-white/70'
            }`}
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => onSearchModeChange('chatbot')}
            className={`flex items-center gap-2 px-3  text-sm font-semibold rounded-lg transition-all duration-300 ${
              searchMode === 'chatbot'
                ? 'bg-white text-blue-600 shadow-md'
                : 'bg-transparent text-slate-600 hover:bg-white/70'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Toggles */}
        <div className="flex items-center gap-2 p-1 bg-slate-100/80 rounded-xl border-l border-slate-300/60 pl-4">
          <button
            onClick={() => onViewModeChange('sortByConfidence')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
              viewMode === 'sortByConfidence'
                ? 'bg-white text-blue-600 shadow-md'
                : 'bg-transparent text-slate-600 hover:bg-white/70'
            }`}
          >
            <ListChecks className="w-5 h-5" />
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
          </button>
        </div>

        {/* Model Selection Dropdown */}
        <div className="relative border-l border-slate-300/60 pl-4">
          <button
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5  text-sm font-semibold text-slate-600 bg-slate-100/80 rounded-lg hover:bg-white/90 hover:shadow-md transition-all"
          >
            <Settings className="w-4 h-4" />
            <ChevronDown className={`w-4 h-4 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isModelDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
              <div className="p-4">
                <ModelSelectionPanel
                  modelSelection={modelSelection}
                  onModelSelectionChange={onModelSelectionChange}
                  isCollapsed={false}
                  onToggleCollapse={undefined}
                />
              </div>
            </div>
          )}
        </div>

        {/* Auto-Translate toggle */}
        <div className="border-l border-slate-300/60 pl-4">
          <label htmlFor="auto-translate-toggle" className="flex items-center cursor-pointer select-none">
            <Languages className="w-5 h-5 mr-3 text-slate-600" />
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



      {/* Click outside handler to close dropdown */}
      {isModelDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsModelDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default React.memo(TopControlBar);