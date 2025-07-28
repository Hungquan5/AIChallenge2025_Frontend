import React, { useState, useRef } from 'react';
import './App.css';
import AppShell from './layouts/AppShell';
import InputPanel from './features/search/components/InputPanel/InputPanel';
import ResultsPanel from './features/results/components/ResultsPanel/ResultsPanel';
import TopControlBar from './layouts/TopControlBar';
import ShortcutsHelp from './components/ShortcutsHelp';
import { useShortcuts } from './utils/shortcuts';
import type { ResultItem, GroupedResult, ViewMode } from './features/results/types';
import type { SearchMode } from './features/search/types';

const App: React.FC = () => {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [groupedResults, setGroupedResults] = useState<GroupedResult[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('sortByConfidence');
  const [searchMode, setSearchMode] = useState<SearchMode>('normal');
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  const inputPanelRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSearch = (newResults: ResultItem[]) => {
    setResults(newResults);
    const grouped = newResults.reduce((acc, item) => {
      const group = acc.find(g => g.videoId === item.videoId);
      if (group) {
        group.items.push(item);
      } else {
        acc.push({ videoId: item.videoId, videoTitle: item.title, items: [item] });
      }
      return acc;
    }, [] as GroupedResult[]);
    setGroupedResults(grouped);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'sortByConfidence' ? 'groupByVideo' : 'sortByConfidence');
  };

  // Register shortcuts
  useShortcuts({
    TOGGLE_VIEW_MODE: toggleViewMode,
    SWITCH_TO_NORMAL: () => setSearchMode('normal'),
    SWITCH_TO_CHAIN: () => setSearchMode('chain'),
    FOCUS_SEARCH: () => inputPanelRef.current?.focus(),
    NEXT_RESULT: () => {
      const currentFocus = document.activeElement;
      const results = resultsRef.current?.querySelectorAll('.result-item');
      if (results?.length) {
        const currentIndex = Array.from(results).indexOf(currentFocus as Element);
        const nextIndex = currentIndex < results.length - 1 ? currentIndex + 1 : 0;
        (results[nextIndex] as HTMLElement)?.focus();
      }
    },
    PREV_RESULT: () => {
      const currentFocus = document.activeElement;
      const results = resultsRef.current?.querySelectorAll('.result-item');
      if (results?.length) {
        const currentIndex = Array.from(results).indexOf(currentFocus as Element);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : results.length - 1;
        (results[prevIndex] as HTMLElement)?.focus();
      }
    },
  });

  const leftPanel = (
    <div ref={inputPanelRef} tabIndex={-1}>
      <InputPanel 
        onSearch={handleSearch} 
        searchMode={searchMode}
        onSearchModeChange={setSearchMode}
      />
    </div>
  );

  const rightPanel = (
    <>
      <TopControlBar
        searchMode={searchMode}
        onSearchModeChange={setSearchMode}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onShowShortcuts={() => setShowShortcuts(true)}
      />
      <div ref={resultsRef}>
        <ResultsPanel
          viewMode={viewMode}
          results={results}
          groupedResults={groupedResults}
        />
      </div>
    </>
  );

  return (
    <>
      <AppShell leftPanel={leftPanel} rightPanel={rightPanel} />
      {showShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowShortcuts(false)}
            >
              ✕
            </button>
            <ShortcutsHelp />
          </div>
        </div>
      )}
    </>
  );
};

export default App;
