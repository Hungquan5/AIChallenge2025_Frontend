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
import FramesPanel from './features/detail_info/components/RelativeFramePanel/FramePanel';
import { useKeyframeLoader } from './features/results/hooks/useKeyframeLoader';
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
  const [isAutoTranslateEnabled, setIsAutoTranslateEnabled] = useState(true); // Default to on  
  const [results, setResults] = useState<ResultItem[]>([]);
  const [groupedResults, setGroupedResults] = useState<GroupedResult[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('sortByConfidence');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [broadcastMessages, setBroadcastMessages] = useState<ResultItem[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  
  const inputPanelRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
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
    closeFramesPanel(); 
    
    await performSimilaritySearch(imageSrc, cardId, (newResults: ResultItem[]) => {
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

  // ✅ 4. Create the right-click handler to be passed to the carousel
  // This function receives the entire `frame` object
  const handleCarouselRightClick = useCallback((item: ResultItem) => {
    if (item.videoId && item.timestamp) {
      handleOpenVideoPanel(item.videoId, item.timestamp);
    }
  }, [handleOpenVideoPanel]);


  const toggleViewMode = () => {
    setViewMode(prev => prev === 'sortByConfidence' ? 'groupByVideo' : 'sortByConfidence');
  };
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
  const { 
  panelContent, 
  searchButton, 
  chainSearchButton 
} = InputPanel({
  onSearch: handleSearch,
  isAutoTranslateEnabled: isAutoTranslateEnabled, // Pass the state down
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
    />
      <div ref={resultsRef}>
        <ResultsPanel
          viewMode={viewMode}
          results={results}
          groupedResults={groupedResults}
          onResultClick={handleMasterResultClick}
          onSimilaritySearch={handleSimilaritySearch}
          currentUser={user.username}
          sendMessage={sendMessage}
          onItemBroadcast={handleItemBroadcast}
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