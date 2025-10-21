// src/App.tsx (Updated with Chatbot integration)
import React, { useMemo, useRef, useState } from 'react';
import './App.css';

// --- Core Components & Layouts ---
import AppShell from './layouts/AppShell';
import TopControlBar from './layouts/TopControlBar';
import type { SearchMode } from './layouts/TopControlBar';
import InputPanel from './features/search/components/InputPanel/InputPanel';
import Chatbot from './features/chat/components/ChatComponents';
import ResultsPanel from './features/results/components/ResultsPanel/ResultsPanel';
import VideoPanel from './features/detail_info/components/VideoPanel/VideoPanel';
import FramesPanel from './features/detail_info/components/RelativeFramePanel/FramePanel';
import FrameDetailModal from './features/detail_info/components/FrameDetailModal/FrameDetailModal';
import SubmissionStatusPanel from './features/submit/components/SubmissionStatusPanel/SubmisionStatusPanel';
import DislikePanel from './features/dislike/components/DislikePanel';

// --- Custom Hooks ---
import { useAppState } from './hooks/useAppState';
import { useModalState } from './hooks/useModalState';
import { useBroadcastState } from './features/communicate/hooks/useBroadcastState';
import { useSubmissionState } from './features/submit/hooks/useSubmissionState';
import { useDislikeState } from './features/dislike/hooks/useDislikeState';

// --- Feature Hooks ---
import { useSession } from './features/communicate/hooks/useSession';
import { useWebSocket } from './features/communicate/hooks/useWebsocket';
import { useKeyframeLoader } from './features/results/hooks/useKeyframeLoader';
import { useSearch } from './features/search/hooks/useSearch';
import { useEventHandlers } from './hooks/useEventHandlers';
import { useWebSocketHandlers } from './features/communicate/hooks/useWebSocketHandlers';

// --- Notification System ---
import { useNotificationManager } from './features/notifications/NotificationsManagers';
import BubbleChat from './features/chat/components/ChatBubbleComponent';
import type { BubbleChatRef } from './features/chat/components/ChatBubbleComponent';
// --- Other Components ---
import { UsernamePrompt } from './features/communicate/components/User/UsernamePrompt';
import ShortcutsHelp from './components/ShortcutsHelp';
import { useShortcuts } from './utils/shortcuts';
import { X } from 'lucide-react';
const App: React.FC = () => {
  // Refs
  const inputPanelRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
const bubbleChatRef = useRef<BubbleChatRef>(null);
  // ✅ NEW: Search Mode State
  const [searchMode, setSearchMode] = useState<SearchMode>('manual');

  // Core State Hooks
  const appState = useAppState();
  const modalState = useModalState();
  const broadcastState = useBroadcastState();
  const submissionState = useSubmissionState();
  const dislikeState = useDislikeState();

  // Notification System
  const {
    NotificationContainer,
    showVideoNotification,
    showEventFrameNotification,
    showDresSubmissionNotification,
  } = useNotificationManager();

  // Session and User
  const { user, createSession, isLoading: isSessionLoading } = useSession();

  // Keyframe Loader
  const keyframeLoader = useKeyframeLoader();

  // Search Handlers
  const searchHandlers = useSearch({
    appState,
    user,
    resultsRef
  });

  // WebSocket Handlers
  const webSocketHandlers = useWebSocketHandlers({
    broadcastState,
    submissionState,
    modalState,
    onShowVideoNotification: showVideoNotification,
    onEventFrameAdded: showEventFrameNotification,
    onDresSubmission: showDresSubmissionNotification,
  });

  // WebSocket Connection
  const { isConnected, sendMessage, reconnect } = useWebSocket({
    username: user?.username || '',
    onMessage: webSocketHandlers.handleWebSocketMessage,
  });

  // Event Handlers
  const eventHandlers = useEventHandlers({
    appState,
    modalState,
    broadcastState,
    submissionState,
    dislikeState,
    keyframeLoader,
    searchHandlers,
    user,
    sendMessage
  });

  // // ✅ NEW: Chatbot search handler
  // const handleChatbotSearch = (query: string) => {
  //   // Convert natural language to search query
  //   // For now, use it as a text query
  //   searchHandlers.handleInitiateSearch([{ type: 'text', value: query }], 'normal');
  // };

  // Shortcut handlers
  const shortcutHandlers = useMemo(() => ({
    TOGGLE_VIEW_MODE: appState.toggleViewMode,
    FOCUS_SEARCH: () => inputPanelRef.current?.focus(),
    TOGGLE_AUTO_TRANSLATE: appState.toggleAutoTranslate,
    CLOSE_MODAL: modalState.handleCloseModal,
    TOGGLE_DISLIKE_PANEL: modalState.handleToggleDislikePanel,
    GO_TO_PAGE: searchHandlers.handlePageChange,
  }), [
    appState.toggleViewMode,
    appState.toggleAutoTranslate,
    modalState.handleCloseModal,
    modalState.handleToggleDislikePanel,
    searchHandlers.handlePageChange,
  ]);
  
  useShortcuts(shortcutHandlers);


  // Create panel instances based on search mode
  const { panelContent, searchButton, chainSearchButton } = InputPanel({
    onSearch: searchHandlers.handleInitiateSearch,
    onSingleSearchResult: searchHandlers.handleSingleItemSearch,
    isAutoTranslateEnabled: appState.isAutoTranslateEnabled,
    isLoading: appState.isLoading,
    user: user,
    modelSelection: appState.modelSelection,
    // ✅ NEW: Add this callback to send queries to bubble chat
    onSendToBubbleChat: (query) => {
      // Automatically send the search query to bubble chat
      bubbleChatRef.current?.sendMessage(query);
    }
  });

  // ✅ NEW: Conditional left panel based on search mode
  // Update the leftPanel to include the new handler:
const leftPanel = (
  <div ref={inputPanelRef} tabIndex={-1} className="h-full">
    {searchMode === 'manual' ? (
      panelContent
    ) : (
      <Chatbot 
        // onSearch={handleChatbotSearch}
        onToolOutputs={eventHandlers.handleAgentToolOutputs}
        isLoading={appState.isLoading}
        user={user}
      />
    )}
  </div>
);
  // Early return for authentication
  if (!user) {
    return <UsernamePrompt onConnect={createSession} isLoading={isSessionLoading} />;
  }

  const rightPanel = (
    <div className="relative h-full flex flex-col">
      {/* Top Control Bar */}
      <div className="flex-shrink-0 z-30 bg-white/60 backdrop-blur-sm border-b border-slate-200/70">
        <TopControlBar
          viewMode={appState.viewMode}
          onViewModeChange={appState.setViewMode}
          onShowShortcuts={() => modalState.setShowShortcuts(true)}
          isAutoTranslateEnabled={appState.isAutoTranslateEnabled}
          onAutoTranslateChange={appState.setIsAutoTranslateEnabled}
          currentPage={appState.currentPage}
          onPageChange={searchHandlers.handlePageChange}
          hasNextPage={appState.hasNextPage}
          isLoading={appState.isLoading}
          totalResults={appState.results.length}
          modelSelection={appState.modelSelection}
          onModelSelectionChange={appState.setModelSelection}
          searchMode={searchMode}
          onSearchModeChange={setSearchMode}
        />
      </div>

      {/* Content area with DislikePanel */}
      <div className="relative flex-1 overflow-hidden">
        {/* Dislike Panel */}
        <div className={`
          absolute top-0 bottom-0 right-0 z-20
          transition-transform duration-300 ease-in-out
          ${modalState.isDislikePanelOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <DislikePanel
            isOpen={modalState.isDislikePanelOpen}
            items={dislikeState.dislikedItems}
            onClose={modalState.handleToggleDislikePanel}
            onClear={() => dislikeState.handleClearDislikes(user)}
            onUndislike={(item) => dislikeState.handleUndislike(item, user)}
            onResultClick={eventHandlers.handleMasterResultClick}
            onSimilaritySearch={searchHandlers.handleSimilaritySearch}
          />
        </div>

        {/* Results Panel */}
        <div
          ref={resultsRef}
          className={`
            h-full overflow-y-auto p-2
            transition-all duration-300 ease-in-out
            ${modalState.isDislikePanelOpen ? 'pr-[calc(10vw+8px)]' : 'pr-2'}
          `}
          style={{ scrollbarGutter: 'stable' }}
        >
          <ResultsPanel
            viewMode={appState.viewMode}
            results={appState.results}
            groupedResults={appState.groupedResults}
            onResultClick={eventHandlers.handleMasterResultClick}
            onSimilaritySearch={searchHandlers.handleSimilaritySearch}
            onResultRightClick={eventHandlers.handleResultRightClick}
            currentUser={user.username}
            sendMessage={sendMessage}
            onItemBroadcast={eventHandlers.handleItemBroadcast}
            onResultDoubleClick={modalState.handleOpenDetailModal}
            onSubmission={(item) => submissionState.handleSubmission(item, user, sendMessage)}
            submissionStatuses={submissionState.submissionStatuses}
            optimisticSubmissions={submissionState.optimisticSubmissions}
            onResultDislike={(item) => dislikeState.handleDislike(
              item, 
              user, 
              modalState.isDislikePanelOpen, 
              modalState.handleToggleDislikePanel
            )}
          />
        </div>
      </div>
    </div>
  );

  // Frames Panel Instance
  const framesPanelInstance = keyframeLoader.carouselFrames !== null ? (
    <FramesPanel
      frames={keyframeLoader.carouselFrames}
      videoTitle={appState.currentVideoTitle}
      isLoading={keyframeLoader.isLoading}
      activeFrameId={keyframeLoader.activeFrameId}
      loadNextFrames={keyframeLoader.loadNextFrames}
      hasMoreNext={keyframeLoader.hasMoreNext}
      hasMorePrev={keyframeLoader.hasMorePrev}
      loadPreviousFrames={keyframeLoader.loadPreviousFrames}
      onClose={keyframeLoader.handleCarouselClose}
      onFrameClick={eventHandlers.handleFrameClickInPanel}
      onRightClick={eventHandlers.handleFrameRightClickInPanel}
      onSimilaritySearch={searchHandlers.handleSimilaritySearch}
      currentUser={user.username}
      sendMessage={sendMessage}
      onResultDoubleClick={modalState.handleOpenDetailModal}
      onSubmission={(item) => submissionState.handleSubmission(item, user, sendMessage)}
      isFetchingNext={false}
      isFetchingPrev={false}
    />
  ) : null;

  // Video Panel Instance
  const videoPanelInstance = modalState.videoPanelState.isOpen && 
    modalState.videoPanelState.videoId && 
    modalState.videoPanelState.timestamp ? (
    <VideoPanel
      videoId={modalState.videoPanelState.videoId}
      timestamp={modalState.videoPanelState.timestamp}
      onClose={modalState.handleCloseVideoPanel}
      onBroadcast={eventHandlers.handleItemBroadcast}
      currentUser={user.username}
      sendMessage={sendMessage}
    />
  ) : null;

  // Detail Modal Instance
  const detailModalInstance = modalState.detailModalItem ? (
    <FrameDetailModal
      item={modalState.detailModalItem}
      onClose={modalState.handleCloseDetailModal}
    />
  ) : null;

  return (
    <>
      <AppShell
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        searchButton={searchMode === 'manual' ? searchButton : null}
        chainSearchButton={searchMode === 'manual' ? chainSearchButton : null}
        carouselOverlay={framesPanelInstance}
        broadcastMessages={broadcastState.broadcastMessages}
        isConnected={isConnected}
        activeUsers={broadcastState.activeUsers}
        onRemoveBroadcastMessage={eventHandlers.handleRemoveBroadcastMessage}
        videoModal={videoPanelInstance}
        onBroadcastResultClick={eventHandlers.handleMasterResultClick}
        onBroadcastRightClick={eventHandlers.handleBroadcastFeedRightClick}
        onBroadcastSimilaritySearch={searchHandlers.handleSimilaritySearch}
        onClearBroadcastFeed={broadcastState.handleClearBroadcastFeed}
        onBroadcastResultDoubleClick={modalState.handleOpenDetailModal}
        onBroadcastResultSubmission={(item) => submissionState.handleSubmission(item, user, sendMessage)}
        onVqaSubmit={broadcastState.handleVqaSubmit}
        onExportBroadcastFeed={eventHandlers.handleExportBroadcast}
        isTrackModeActive={broadcastState.isTrackModeActive}
        onToggleTrackMode={broadcastState.handleToggleTrackMode}
        vqaQuestions={broadcastState.vqaQuestions}
        onVqaQuestionChange={broadcastState.handleVqaQuestionChange}
        isChatbotMode={searchMode === 'chatbot'}
      />

      {/* Notification System */}
      <NotificationContainer 
        onOpenVideo={(videoId, timestamp) => modalState.handleOpenVideoPanel(videoId, timestamp)}
      />

      {/* Modals */}
      {detailModalInstance}

      {/* Submission Status Panel */}
      {submissionState.submissionResult && (
        <SubmissionStatusPanel
          key={submissionState.submissionResult.itemId}
          result={submissionState.submissionResult}
          onClose={() => submissionState.setSubmissionResult(null)}
        />
      )}

      {/* Shortcuts Modal */}
      {modalState.showShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 p-2"
              onClick={() => modalState.setShowShortcuts(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <ShortcutsHelp />
          </div>
        </div>
      )}
      <BubbleChat
        ref={bubbleChatRef}
        onToolOutputs={eventHandlers.handleAgentToolOutputs}
        user={user}
        isVisible={searchMode === 'manual'}
      />
    </>
  );
};

export default App;