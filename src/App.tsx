import React, { useState, useRef } from 'react';
import './App.css';
import AppShell from './layouts/AppShell';
import InputPanel from './features/search/components/InputPanel/InputPanel';
import ResultsPanel from './features/results/components/ResultsPanel/ResultsPanel';
import TopControlBar from './layouts/TopControlBar';
import ShortcutsHelp from './components/ShortcutsHelp';
import { useShortcuts } from './utils/shortcuts';
import type { ResultItem, GroupedResult, ViewMode } from './features/results/types';

// NEW: Import the carousel component and its state management hooks
import FrameCarousel from './features/detail_info/components/RelativeFramePanel/FrameCarousel';
import { useKeyframeLoader } from './features/results/hooks/useKeyframeLoader';
import { useFrameNavigation } from './features/results/hooks/useFrameNavigation';

const App: React.FC = () => {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [groupedResults, setGroupedResults] = useState<GroupedResult[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('sortByConfidence');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const inputPanelRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // NEW: State management for the FrameCarousel is now lifted up to the App component.
  const {
    carouselFrames,
    activeFrameId,
    isLoading,
    isLoadingBatch,
    currentVideoId,
    handleResultClick, // This function will be passed to ResultsPanel
    handleCarouselClose,
    handleFrameChange,
    setActiveFrameId,
    loadMoreFrames,
    hasMoreNext,
    hasMorePrev,
  } = useKeyframeLoader();

  // NEW: Frame navigation logic is also managed here.
  const { navigateToNextFrame, navigateToPrevFrame } = useFrameNavigation({
    currentVideoId,
    activeFrameId,
    carouselFrames,
    setActiveFrameId,
    loadMoreFrames,
    hasMoreNext,
    hasMorePrev,
    isLoadingBatch,
  });


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

  // Keyboard shortcuts remain unchanged
  useShortcuts({
    TOGGLE_VIEW_MODE: toggleViewMode,
    FOCUS_SEARCH: () => inputPanelRef.current?.focus(),
    // ... other shortcuts
  });

  const inputPanelInstance = InputPanel({
    onSearch: handleSearch
  });

  const leftPanel = (
    <div ref={inputPanelRef} tabIndex={-1}>
      {inputPanelInstance.panelContent}
    </div>
  );

  const searchButton = inputPanelInstance.searchButton;

  const rightPanel = (
    <>
      <TopControlBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onShowShortcuts={() => setShowShortcuts(true)}
      />
      <div ref={resultsRef}>
        <ResultsPanel
          viewMode={viewMode}
          results={results}
          groupedResults={groupedResults}
          // NEW: Pass the click handler down to the ResultsPanel.
          // When a result is clicked, it will now call `handleResultClick` from useKeyframeLoader.
          onResultClick={handleResultClick}
        />
      </div>
    </>
  );

  // NEW: Conditionally render the carousel overlay based on the lifted state.
  const carouselOverlay = carouselFrames && activeFrameId !== null ? (
    <FrameCarousel
      frames={carouselFrames}
      activeFrameId={activeFrameId}
      onClose={handleCarouselClose}
      onNext={navigateToNextFrame}
      onPrev={navigateToPrevFrame}
      onFrameChange={handleFrameChange}
      isLoading={isLoading || isLoadingBatch}
    />
  ) : null;

  return (
    <>
      <AppShell
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        searchButton={searchButton}
        // NEW: Pass the carousel overlay to the AppShell.
        carouselOverlay={carouselOverlay}
      />
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