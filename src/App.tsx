import React, { useState, useRef } from 'react';
import './App.css';
import AppShell from './layouts/AppShell';
import InputPanel from './features/search/components/InputPanel/InputPanel';
import ResultsPanel from './features/results/components/ResultsPanel/ResultsPanel';
import TopControlBar from './layouts/TopControlBar';
import ShortcutsHelp from './components/ShortcutsHelp';
import { useShortcuts } from './utils/shortcuts';
import type { ResultItem, GroupedResult, ViewMode } from './features/results/types';
import {  fileToBase64, } from './utils/fileConverter';
import {searchByText} from './features/search/components/SearchRequest/searchApi';
import { performSimilaritySearch } from './features/search/components/SimilaritySearch/SimilaritySearch';
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
const handleSimilarityResults = (newResults: ResultItem[]) => {
    // This will replace the current results with the new ones from the similarity search
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
    resultsRef.current?.scrollTo(0, 0);
  };
  const handleSimilaritySearch = async (imageSrc: string, cardId: string) => {
    console.log(`Starting similarity search for card: ${cardId} with image: ${imageSrc}`);
    
    // 1. TODO: Call your API service here to get new results.
    // This is a placeholder for your actual data fetching logic.
    // const newResults = await myApi.searchByImage(imageSrc);
    await performSimilaritySearch(imageSrc,cardId,  
        (newResults: ResultItem[]) => {
        // 3. Close the carousel if it's open, as the context is changing.
        handleCarouselClose();
        // 4. Call the state update function with the new data.
        handleSimilarityResults(newResults);
      }) // Example API call

  };
  // selected for submission
  const handleResultMiddleClick = (imageSrc: string, cardId: string) => {
    //select the image for submission
    console.log(`Selected card for submission: ${cardId} with image: ${imageSrc}`);
  }
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
    onSearch: handleSearch,
});
const { panelContent, searchButton, chainSearchButton } = inputPanelInstance;


  const leftPanel = (
    <div ref={inputPanelRef} tabIndex={-1}>
      {inputPanelInstance.panelContent}
    </div>
  );

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
          onResultClick={handleResultClick}
          // NEW: Pass the new handler to the ResultsPanel
          onSimilaritySearch={handleSimilaritySearch}
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
      // FINAL STEP: Pass the handler to the carousel
      onSimilaritySearch={handleSimilaritySearch} 
    />
  ) : null;

  return (
    <>
      <AppShell
  leftPanel={leftPanel}
  rightPanel={rightPanel}
  searchButton={searchButton}
  chainSearchButton={chainSearchButton} // ✅ Pass it in
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