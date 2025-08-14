// src/App.tsx

import React, { useCallback, useRef, useState } from 'react';
import './App.css';

// --- Core Components & Layouts ---
import AppShell from './layouts/AppShell';
import TopControlBar from './layouts/TopControlBar';
import InputPanel from './features/search/components/InputPanel/InputPanel';
import ResultsPanel from './features/results/components/ResultsPanel/ResultsPanel';
import VideoPanel from './features/detail_info/components/VideoPanel/VideoPanel';
import FramesPanel from './features/detail_info/components/RelativeFramePanel/FramePanel';
import FrameDetailModal from './features/detail_info/components/FrameDetailModal/FrameDetailModal';
// --- Types & API ---
import type { ResultItem, GroupedResult, ViewMode } from './features/results/types';
import { searchByText } from './features/search/components/SearchRequest/searchApi'; // The API call now lives here.
import type { ApiQuery,SearchMode } from './features/search/types';
import type { WebSocketMessage } from './features/communicate/types';
// --- Hooks & Utilities ---
import { useSession } from './features/communicate/hooks/useSession';
import { useWebSocket } from './features/communicate/hooks/useWebsocket';
import { useKeyframeLoader } from './features/results/hooks/useKeyframeLoader';
import { useShortcuts } from './utils/shortcuts';
import { performSimilaritySearch } from './features/search/components/SimilaritySearch/SimilaritySearch';

// --- Other Components ---
import { UsernamePrompt } from './features/communicate/components/User/UsernamePrompt';
import ShortcutsHelp from './components/ShortcutsHelp';
import { X } from 'lucide-react';



const PAGE_SIZE = 100; // Define your page size, matching the backend default
const App: React.FC = () => {
  // ✅ 1. Add state to manage the video modal
   const [videoPanelState, setVideoPanelState] = useState<{
    isOpen: boolean;
    videoId: string | null;
    timestamp: string | null; // The panel needs the frame ID as a timestamp
  }>({
    isOpen: false,
    videoId: null,
    timestamp: null,
  });
    // Search Results & View State
    const [results, setResults] = useState<ResultItem[]>([]);
    const [groupedResults, setGroupedResults] = useState<GroupedResult[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('sortByConfidence');
    
    // ✅ Pagination & Search Context State
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [lastQueries, setLastQueries] = useState<ApiQuery[]>([]);
    const [lastSearchMode, setLastSearchMode] = useState<SearchMode>('normal');
  
    // UI & App-level State
    const [isAutoTranslateEnabled, setIsAutoTranslateEnabled] = useState(true);
    const [showShortcuts, setShowShortcuts] = useState(false);
    
    // Refs for focusing and scrolling
    const inputPanelRef = useRef<HTMLDivElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
  const [broadcastMessages, setBroadcastMessages] = useState<ResultItem[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  // State to hold the title for the FramesPanel, captured on click
  const [currentVideoTitle, setCurrentVideoTitle] = useState('');
  // Session and WebSocket hooks
  const { user, createSession, isLoading: isSessionLoading } = useSession();
 // State for the new FramesPanel
 const [framesPanelState, setFramesPanelState] = useState<{
  isOpen: boolean;
  frames: ResultItem[];
  videoTitle: string;
  isLoading: boolean;
}>({
  isOpen: false,
  frames: [],
  videoTitle: '',
  isLoading: false,
});
const [detailModalItem, setDetailModalItem] = useState<ResultItem | null>(null);
 // ✅ 2. Create handlers to open and close the new modal
 const handleOpenDetailModal = useCallback((item: ResultItem) => {
  setDetailModalItem(item);
}, []);

const handleCloseDetailModal = useCallback(() => {
  setDetailModalItem(null);
}, []);
const executeSearch = useCallback(async (queries: ApiQuery[], mode: SearchMode, page: number) => {
  setIsLoading(true);
  try {
    const newResults = await searchByText(queries, mode, page, PAGE_SIZE);

    setResults(newResults);
    setHasNextPage(newResults.length === PAGE_SIZE); // If we got a full page, there might be more.

    // Group results (logic is unchanged)
    const grouped = newResults.reduce((acc, item) => {
      const group = acc.find(g => g.videoId === item.videoId);
      if (group) group.items.push(item);
      else acc.push({ videoId: item.videoId, videoTitle: item.title, items: [item] });
      return acc;
    }, [] as GroupedResult[]);
    setGroupedResults(grouped);

    // Scroll to top of results view
    resultsRef.current?.scrollTo(0, 0);

  } catch (error) {
    console.error("Search failed:", error);
    alert(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    setHasNextPage(false); // Reset on error
  } finally {
    setIsLoading(false);
  }
}, []); // Empty dependency array as it uses state setters and constants
const handleInitiateSearch = useCallback((queries: ApiQuery[], mode: SearchMode) => {
  // A new search always starts at page 1
  setCurrentPage(1); 
  
  // Save the context of this search so we can paginate it later
  setLastQueries(queries);
  setLastSearchMode(mode);
  
  // Execute the search for the first page
  executeSearch(queries, mode, 1);
}, [executeSearch]); // Depends on executeSearch
const handlePageChange = useCallback((newPage: number) => {
  if (lastQueries.length > 0) {
    setCurrentPage(newPage);
    executeSearch(lastQueries, lastSearchMode, newPage);
  }
}, [lastQueries, lastSearchMode, executeSearch]); // Depends on saved context and executeSearch

// A handler for when a single query is searched from within QueryItem
const handleSingleItemSearch = (newResults: ResultItem[]) => {
  setResults(newResults);
   // A single item search should not affect the main pagination context
  setHasNextPage(false); 
  setCurrentPage(1);

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
}
  // Keyframe loader hooks
   // --- Updated Keyframe Loader Hook ---
  // The hook now manages the state for the FramesPanel internally.
  const {
    carouselFrames,    // This is now the array of all frames for the panel.
    isLoading: isLoadingFrames, // Renamed to avoid conflict.
    activeFrameId, // ✅ We will use this to highlight the frame
    handleResultClick: loadFramesForPanel, // Renamed for clarity.
    handleCarouselClose: closeFramesPanel, // Renamed for clarity.
  } = useKeyframeLoader();
  const handleVqaSubmit = useCallback((item: ResultItem, question: string) => {
    if (!question.trim()) {
      console.warn('VQA question is empty.');
      return;
    }
    // In a real implementation, you would send this data to your backend API.
    console.log('Submitting VQA:', {
      videoId: item.videoId,
      frameId: item.timestamp, // The original, correct frame ID
      question: question.trim(),
    });
  }, []);

  // Enhanced WebSocket message handler
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (!message) return;

    switch (message.type) {
      case 'broadcast_image':
        if (message.payload) {
          // ✅ FIX: Do NOT overwrite the original timestamp.
          // Instead, create a new 'receivedAt' property for display.
          const newMessage: ResultItem = {
            ...(message.payload as ResultItem), // Spread the original, untouched payload
          };
          setBroadcastMessages(prevMessages => [newMessage, ...prevMessages.slice(0, 19)]);
        }
        break;
      
      default:
        console.log('Unknown message type:', message.type);
    }
  }, []);

  const { isConnected, sendMessage, reconnect } = useWebSocket({
    username: user?.username || '',
    onMessage: handleWebSocketMessage,
  });

  // Enhanced broadcast handler with better UX
  const handleItemBroadcast = useCallback((itemToBroadcast: ResultItem) => {
    if (!user?.username) {
      console.warn('Cannot broadcast: No username available');
      return;
    }

    // Prepare enhanced message with metadata
    const enhancedItem = {
      ...itemToBroadcast,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      username: user.username,
      broadcasted: true
    };

    // Add to local broadcast feed immediately for instant feedback
    setBroadcastMessages(prevMessages => [enhancedItem, ...prevMessages.slice(0, 19)]);

    // Send to other users via WebSocket
    const message = {
      type: 'broadcast_image',
      payload: itemToBroadcast,
      username: user.username,
      timestamp: Date.now()
    };

    sendMessage(JSON.stringify(message));
  }, [user?.username, sendMessage]);

  // Enhanced broadcast message removal handler
  const handleRemoveBroadcastMessage = useCallback((messageId: string, index: number) => {
    setBroadcastMessages(prevMessages => 
      prevMessages.filter((_, i) => i !== index)
    );

    // Optionally, send removal notification to other users
    const message = {
      type: 'remove_broadcast',
      messageId,
      username: user?.username,
      timestamp: Date.now()
    };

    sendMessage(JSON.stringify(message));
  }, [user?.username, sendMessage]);
  const handleBroadcastFeedRightClick = useCallback((item: ResultItem, event: React.MouseEvent) => {
    // We already have a function to open the video panel from the carousel.
    // It just needs a videoId and a timestamp.
    if (item.videoId && item.timestamp) {
      handleOpenVideoPanel(item.videoId, item.timestamp);
    }
}, []);
const handleClearBroadcastFeed = useCallback(() => {
  setBroadcastMessages([]);
}, []);

  const handleSimilarityResults = (newResults: ResultItem[]) => {
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
    closeFramesPanel(); 
    
    await performSimilaritySearch(imageSrc, cardId, (newResults: ResultItem[]) => {
      handleSimilarityResults(newResults);
    });
  };

// ✅ NEW: Handler to be passed to ResultsPanel for right-clicks.
const handleResultRightClick = (item: ResultItem, event: React.MouseEvent) => {
  event.preventDefault(); // Prevent the default browser context menu.
  if (item.videoId && item.timestamp) {
    handleOpenVideoPanel(item.videoId, item.timestamp);
  }
};
  // --- All your existing hooks (useSession, useKeyframeLoader, etc.) ---
  const handleMasterResultClick = (item: ResultItem) => {
    // 1. Capture the title of the video that was clicked.
    setCurrentVideoTitle(item.title);
    // 2. Trigger the keyframe loader to fetch all frames for that video.
    loadFramesForPanel(item);
  };
  const handleFrameRightClickInPanel = (frame: ResultItem, event: React.MouseEvent) => {
    event.preventDefault();
    handleOpenVideoPanel(frame.videoId, frame.timestamp);
  };
// --- NEW: Handlers for interactions inside the FramesPanel ---
const handleFrameClickInPanel = (frame: ResultItem) => {
  handleOpenVideoPanel(frame.videoId, frame.timestamp);
};
  // ✅ 3. Create handlers to open and close the VideoPanel
  const handleOpenVideoPanel = useCallback((videoId: string, timestamp: string) => {
    console.log(`Opening VideoPanel for videoId: ${videoId} at timestamp: ${timestamp}`);
    setVideoPanelState({ isOpen: true, videoId, timestamp });
  }, []);

  const handleCloseVideoPanel = useCallback(() => {
    setVideoPanelState({ isOpen: false, videoId: null, timestamp: null });
  }, []);


 // ✅ --- NEW: Handler for the 'Escape' key shortcut ---
 const handleCloseModal = useCallback(() => {
  // The VideoPanel is the top-most modal, so check for it first.
  if (videoPanelState.isOpen) {
    handleCloseVideoPanel();
    return; // Exit after closing one layer
  }
  // If the video panel isn't open, check if the frames panel is.
  if (carouselFrames !== null) {
    closeFramesPanel();
  }
}, [videoPanelState.isOpen, handleCloseVideoPanel, carouselFrames, closeFramesPanel]);
  // Keyboard shortcuts
  useShortcuts({
    TOGGLE_VIEW_MODE: () => setViewMode(prev => prev === 'sortByConfidence' ? 'groupByVideo' : 'sortByConfidence'),
    FOCUS_SEARCH: () => inputPanelRef.current?.focus(),
    TOGGLE_AUTO_TRANSLATE: () => setIsAutoTranslateEnabled(prev => !prev),
    CLOSE_MODAL: handleCloseModal, // Add the new handler here
  });

  // Create panel components
  // Create panel components
 // ✅ 2. PASS THE NEW STATE TO THE INPUTPANEL INSTANCE
 // ✅ Create the InputPanel instance, passing the new handler and loading state
 const { 
  panelContent, 
  searchButton, 
  chainSearchButton 
} = InputPanel({
  onSearch: handleInitiateSearch, // Pass the new search initiator
  // Note: To make `onSingleSearchResult` work, you'd also need to pass `handleSingleItemSearch`
  // down through InputPanel -> QueryList -> QueryItem. Let's assume this prop is added.
  onSingleSearchResult: handleSingleItemSearch,
  isAutoTranslateEnabled: isAutoTranslateEnabled,
  // Pass loading state down so InputPanel can disable its buttons
  isLoading: isLoading, 
});
  const leftPanel = (
    <div ref={inputPanelRef} tabIndex={-1}>
      {panelContent}
    </div> 
  );
  // Show username prompt if no user
  if (!user) {
    return <UsernamePrompt onConnect={createSession} isLoading={isSessionLoading} />;
  }

  const rightPanel = (
    <>
    {/* ✅ 3. PASS THE STATE AND SETTER TO THE TOPCONTROLBAR */}
    <TopControlBar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onShowShortcuts={() => setShowShortcuts(true)}
            isAutoTranslateEnabled={isAutoTranslateEnabled}
            onAutoTranslateChange={setIsAutoTranslateEnabled}
            
            // ✅ PASS all pagination props HERE
            currentPage={currentPage}
            onPageChange={handlePageChange}
            hasNextPage={hasNextPage}
            isLoading={isLoading}
            totalResults={results.length}
          />
      <div ref={resultsRef}>
        <ResultsPanel
          viewMode={viewMode}
          results={results}
          groupedResults={groupedResults}
          onResultClick={handleMasterResultClick}
          onSimilaritySearch={handleSimilaritySearch}
          onResultRightClick={handleResultRightClick}
          currentUser={user.username}
          sendMessage={sendMessage}
          onItemBroadcast={handleItemBroadcast}
          onResultDoubleClick={handleOpenDetailModal}

        />
      </div>
    </>
  );

 // ✅ 4. Update the carousel overlay to pass the new handler
 const framesPanelInstance = carouselFrames !== null ? (
  <FramesPanel
    frames={carouselFrames}
    videoTitle={currentVideoTitle}
    isLoading={isLoadingFrames}
    activeFrameId={activeFrameId} // Pass the active ID for highlighting

    onClose={closeFramesPanel}
    onFrameClick={handleFrameClickInPanel}
    onRightClick={handleFrameRightClickInPanel}
    onSimilaritySearch={handleSimilaritySearch}
    currentUser={user.username}
    sendMessage={sendMessage}

  />
) : null;

  // ✅ 5. Create the modal instance to pass to the AppShell
// ✅ 6. Create the VideoPanel instance to pass to the AppShell
const videoPanelInstance = videoPanelState.isOpen && videoPanelState.videoId && videoPanelState.timestamp ? (
  <VideoPanel
    videoId={videoPanelState.videoId}
    timestamp={videoPanelState.timestamp}
    onClose={handleCloseVideoPanel}
  />
) : null;
    // Show username prompt if no user
      // ✅ 4. Conditionally render the new modal
  const detailModalInstance = detailModalItem ? (
    <FrameDetailModal 
      item={detailModalItem} 
      onClose={handleCloseDetailModal} 
    />
  ) : null;
  if (!user) {
    return <UsernamePrompt onConnect={createSession} isLoading={isSessionLoading} />;
  }

  return (
    <>
      <AppShell
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        searchButton={searchButton}
        chainSearchButton={chainSearchButton}
        carouselOverlay={framesPanelInstance}
        broadcastMessages={broadcastMessages}
        isConnected={isConnected}
        activeUsers={activeUsers}
        onRemoveBroadcastMessage={handleRemoveBroadcastMessage}
        videoModal={videoPanelInstance} 
        onBroadcastResultClick={handleMasterResultClick}
        onBroadcastRightClick={handleBroadcastFeedRightClick}
        onBroadcastSimilaritySearch={handleSimilaritySearch}
        onClearBroadcastFeed={handleClearBroadcastFeed}
        onVqaSubmit={handleVqaSubmit}

      />
      {detailModalInstance}

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 p-2"
              onClick={() => setShowShortcuts(false)}
            >
                            <X className="h-5 w-5" />
            </button>
            <ShortcutsHelp />
          </div>
        </div>
      )}
    </>
  );
};

export default App;