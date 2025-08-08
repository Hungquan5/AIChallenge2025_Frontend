import React, { useState, useRef, useCallback } from 'react';
import './App.css';
import AppShell from './layouts/AppShell';
import InputPanel from './features/search/components/InputPanel/InputPanel';
import ResultsPanel from './features/results/components/ResultsPanel/ResultsPanel';
import TopControlBar from './layouts/TopControlBar';
import ShortcutsHelp from './components/ShortcutsHelp';
import { useShortcuts } from './utils/shortcuts';
import type { ResultItem, GroupedResult, ViewMode } from './features/results/types';
import type { BroadcastImageMessage, WebSocketMessage } from './features/communicate/types';
import ResultCard from './features/results/components/ResultsPanel/ResultCard';
import { performSimilaritySearch } from './features/search/components/SimilaritySearch/SimilaritySearch';
import FrameCarousel from './features/detail_info/components/RelativeFramePanel/FrameCarousel';
import { useKeyframeLoader } from './features/results/hooks/useKeyframeLoader';
import { useFrameNavigation } from './features/results/hooks/useFrameNavigation';
import { useSession } from './features/communicate/hooks/useSession';
import { useWebSocket } from './features/communicate/hooks/useWebsocket';
import { UsernamePrompt } from './features/communicate/components/User/UsernamePrompt';
import { ConnectionStatus } from './features/communicate/components/Communicate/ConnectionStatus';
import VideoPanel from './features/detail_info/components/VideoPanel/VideoPanel';

const App: React.FC = () => {
  // ✅ 1. Add state to manage the video modal
  const [videoModalState, setVideoModalState] = useState<{
    isOpen: boolean;
    videoId: string | null;
  }>({
    isOpen: false,
    videoId: null,
  });
  const [results, setResults] = useState<ResultItem[]>([]);
  const [groupedResults, setGroupedResults] = useState<GroupedResult[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('sortByConfidence');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [broadcastMessages, setBroadcastMessages] = useState<ResultItem[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  
  const inputPanelRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Session and WebSocket hooks
  const { user, createSession, isLoading: isSessionLoading } = useSession();

  // Keyframe loader hooks
  const {
    carouselFrames,
    activeFrameId,
    isLoading,
    isLoadingBatch,
    currentVideoId,
    handleResultClick,
    handleCarouselClose,
    handleFrameChange,
    setActiveFrameId,
    loadMoreFrames,
    hasMoreNext,
    hasMorePrev,
  } = useKeyframeLoader();

  // Frame navigation hooks
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

  // Enhanced WebSocket message handler
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (!message) return;

    switch (message.type) {
      case 'broadcast_image':
        if (message.payload) {
          const newMessage = {
            ...message.payload as ResultItem,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setBroadcastMessages(prevMessages => [newMessage, ...prevMessages.slice(0, 19)]); // Keep only last 20 messages
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
  // Search handlers (unchanged)
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
    
    await performSimilaritySearch(imageSrc, cardId, (newResults: ResultItem[]) => {
      handleCarouselClose();
      handleSimilarityResults(newResults);
    });
  };
   // ✅ 2. Create state specifically for your VideoPanel
   const [videoPanelState, setVideoPanelState] = useState<{
    isOpen: boolean;
    videoId: string | null;
    timestamp: string | null; // The panel needs the frame ID as a timestamp
  }>({
    isOpen: false,
    videoId: null,
    timestamp: null,
  });

  // --- All your existing hooks (useSession, useKeyframeLoader, etc.) ---

  // ✅ 3. Create handlers to open and close the VideoPanel
  const handleOpenVideoPanel = useCallback((videoId: string, timestamp: string) => {
    console.log(`Opening VideoPanel for videoId: ${videoId} at timestamp: ${timestamp}`);
    setVideoPanelState({ isOpen: true, videoId, timestamp });
  }, []);

  const handleCloseVideoPanel = useCallback(() => {
    setVideoPanelState({ isOpen: false, videoId: null, timestamp: null });
  }, []);

  // ✅ 4. Create the right-click handler to be passed to the carousel
  // This function receives the entire `frame` object
  const handleCarouselRightClick = useCallback((item: ResultItem) => {
    if (item.videoId && item.timestamp) {
      handleOpenVideoPanel(item.videoId, item.timestamp);
    }
  }, [handleOpenVideoPanel]);
  const handleResultMiddleClick = (imageSrc: string, cardId: string) => {
    console.log(`Selected card for submission: ${cardId} with image: ${imageSrc}`);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'sortByConfidence' ? 'groupByVideo' : 'sortByConfidence');
  };

  // Keyboard shortcuts
  useShortcuts({
    TOGGLE_VIEW_MODE: toggleViewMode,
    FOCUS_SEARCH: () => inputPanelRef.current?.focus(),
  });


  // Create panel components
  const inputPanelInstance = InputPanel({
    onSearch: handleSearch,
  });
  const { panelContent, searchButton, chainSearchButton } = inputPanelInstance;
  // Show username prompt if no user
  if (!user) {
    return <UsernamePrompt onConnect={createSession} isLoading={isSessionLoading} />;
  }

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
          onSimilaritySearch={handleSimilaritySearch}
          currentUser={user.username}
          sendMessage={sendMessage}
          onItemBroadcast={handleItemBroadcast} // Pass the broadcast handler
        />
      </div>
    </>
  );

 // ✅ 4. Update the carousel overlay to pass the new handler
 const carouselOverlay = carouselFrames && activeFrameId !== null ? (
  <FrameCarousel
    frames={carouselFrames}
    activeFrameId={activeFrameId}
    onClose={handleCarouselClose}
    onNext={navigateToNextFrame}
    onPrev={navigateToPrevFrame}
    onFrameChange={handleFrameChange}
    isLoading={isLoading || isLoadingBatch}
    onSimilaritySearch={handleSimilaritySearch}
    onResultClick={handleResultClick}
    // Pass the right-click handler down
    onRightClick={handleCarouselRightClick} 
    // You might need to pass these down too if not already
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
  return (
    <>
      <AppShell
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        searchButton={searchButton}
        chainSearchButton={chainSearchButton}
        carouselOverlay={carouselOverlay}
        broadcastMessages={broadcastMessages}
        isConnected={isConnected}
        activeUsers={activeUsers}
        onRemoveBroadcastMessage={handleRemoveBroadcastMessage}
        videoModal={videoPanelInstance} 
        onBroadcastResultClick={handleResultClick}
        onBroadcastRightClick={handleBroadcastFeedRightClick}
        onBroadcastSimilaritySearch={handleSimilaritySearch}

      />

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 p-2"
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