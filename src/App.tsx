import React, { useMemo, useRef, useState, useCallback } from 'react';
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
import PaginationContainer from './features/results/components/ResultsPanel/PaginationContainer';
import ObjectFilterDropdown from './features/results/components/ResultsPanel/ObjectFilterDropdown';

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
import type { ResultItem } from './features/results/types';
import { useObjectFilter } from './features/results/hooks/useObjectFilter';
// --- Notification System ---
import { useNotificationManager } from './features/notifications/NotificationsManagers';
import BubbleChat from './features/chat/components/ChatBubbleComponent';
// --- Other Components ---
import { UsernamePrompt } from './features/communicate/components/User/UsernamePrompt';
import { useShortcuts } from './utils/shortcuts';
import type { ViewMode } from './features/results/types';
import type { ModelSelection } from './features/search/types';

const App: React.FC = () => {
  // =================================================================
  // 1. ALL HOOKS ARE CALLED UNCONDITIONALLY AT THE TOP
  // =================================================================
  const inputPanelRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>('manual');
  // Core State Hooks
  const appState = useAppState();
  const modalState = useModalState();
  const broadcastState = useBroadcastState();
  const submissionState = useSubmissionState();
  const dislikeState = useDislikeState();
  const {
    selectedObjects,
    handleFilterChange,
    filterResults,
    fetchObjectMetadata, // Destructure this directly
    isLoadingMetadata,
    globalObjectCounts,

  } = useObjectFilter(); 
  // Notification System
  const {
    NotificationContainer,
    showVideoNotification,
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
    resultsRef,
    fetchObjectMetadata
  });

  // WebSocket Handlers
  const webSocketHandlers = useWebSocketHandlers({
    broadcastState,
    submissionState,
    modalState,
    onShowVideoNotification: showVideoNotification,
    onDresSubmission: showDresSubmissionNotification,
  });

  // WebSocket Connection
  const { isConnected, sendMessage, lastMessage } = useWebSocket({
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
    sendMessage,
    resultsRef
  });

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    appState.setViewMode(mode);
  }, [appState.setViewMode]);

  const handleAutoTranslateChange = useCallback((enabled: boolean) => {
    appState.setIsAutoTranslateEnabled(enabled);
  }, [appState.setIsAutoTranslateEnabled]);

  const handleModelSelectionChange = useCallback((selection: ModelSelection) => {
    appState.setModelSelection(selection);
  }, [appState.setModelSelection]);

  const handleShowShortcuts = useCallback(() => {
    modalState.setShowShortcuts(true);
  }, [modalState.setShowShortcuts]);
  // ✅ FIX: Create stable callback for submissions
  const handleResultSubmission = useCallback((item: ResultItem) => {
    submissionState.handleSubmission(item, user, sendMessage);
  }, [submissionState, user, sendMessage]);

  // ✅ FIX: Create stable callback for dislikes
  const handleResultDislike = useCallback((item: ResultItem) => {
    dislikeState.handleDislike(
      item,
      user,
      modalState.isDislikePanelOpen,
      modalState.handleToggleDislikePanel
    );
  }, [dislikeState, user, modalState.isDislikePanelOpen, modalState.handleToggleDislikePanel]);
  
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

  // ✅ SOLUTION: Activate the global keyboard shortcuts by calling the hook.
  useShortcuts(shortcutHandlers);



  // Apply filtering to results
   const filteredResults = useMemo(
    () => filterResults(appState.results),
    [appState.results, selectedObjects, filterResults] // Use filterResults directly
  );
  const handleRemoveBroadcastMessage = useCallback((messageId: string) => {
    // The original signature in AppShell had an 'index', but the hook doesn't use it.
    // We align with the hook's implementation for correctness.
    broadcastState.handleRemoveBroadcastMessage(messageId);
  }, [broadcastState.handleRemoveBroadcastMessage]);

  const handleClearBroadcastFeed = useCallback(() => {
    broadcastState.handleClearBroadcastFeed();
  }, [broadcastState.handleClearBroadcastFeed]);

  const handleToggleTrackMode = useCallback(() => {
    broadcastState.handleToggleTrackMode();
  }, [broadcastState.handleToggleTrackMode]);

  const handleBroadcastResultSubmission = useCallback((item: ResultItem) => {
    // This was previously an inline arrow function, which is a common
    // cause of performance issues with memoized components.
    submissionState.handleSubmission(item, user, sendMessage);
  }, [submissionState, user, sendMessage]); // Dependencies that the function relies on
  const handleSimilaritySearchAdapter = useCallback((imageSrc: string, cardId: string) => {
    console.log(`Adapter triggered for similarity search on card: ${cardId}`);
    // We ignore the cardId here and just call the clean handler from useSearch.
    searchHandlers.handleSimilaritySearch(imageSrc);
  }, [searchHandlers.handleSimilaritySearch]); // Dependency is the stable handler from the hook
  // =================================================================
  // 2. DEFINE UI LOGIC (Can use hooks' return values)
  // =================================================================
  // 4. Memoize panel components




const leftPanel = useMemo(() => (
  <div ref={inputPanelRef} tabIndex={-1} className="h-full">
    {searchMode === 'manual' ? (
      <InputPanel
        onSearch={searchHandlers.handleInitiateSearch}
        onSingleSearchResult={searchHandlers.handleSingleItemSearch}
        isAutoTranslateEnabled={appState.isAutoTranslateEnabled}  
        isLoading={appState.isLoading}
        user={user}
        modelSelection={appState.modelSelection}
      />
    ) : (
      <Chatbot
        isLoading={appState.isLoading}
      />
    )}
  </div>
), [
  searchMode,
  searchHandlers.handleInitiateSearch,
  searchHandlers.handleSingleItemSearch,
  appState.isAutoTranslateEnabled,
  appState.isLoading,
  appState.modelSelection,
  user,
  eventHandlers.handleAgentToolOutputs
]);

  const rightPanel = (
    <div className="relative h-full flex flex-col">
      {/* ✅ MODIFICATION: The container is now a flexbox layout */}
      <div className="flex-shrink-0 z-30 bg-white/60 backdrop-blur-sm border-b border-slate-200/70 flex justify-between items-center">
        {/* 1. The now-static TopControlBar */}
        <TopControlBar
          viewMode={appState.viewMode}
          onViewModeChange={handleViewModeChange}
          onShowShortcuts={handleShowShortcuts}
          isAutoTranslateEnabled={appState.isAutoTranslateEnabled}
          onAutoTranslateChange={handleAutoTranslateChange}
          modelSelection={appState.modelSelection}
          onModelSelectionChange={handleModelSelectionChange}
          searchMode={searchMode}
          onSearchModeChange={setSearchMode}
                  objectFilterSlot={
            <ObjectFilterDropdown
              results={appState.results} // Pass results directly here
              selectedObjects={selectedObjects}
              onFilterChange={handleFilterChange}
              globalObjectCounts={globalObjectCounts}
              isLoading={isLoadingMetadata}
            />
            }
        />

        {/* 2. The new dynamic PaginationContainer, centered */}
        <div className="flex-grow flex justify-center">
          <PaginationContainer
            currentPage={appState.currentPage}
            onPageChange={searchHandlers.handlePageChange}
            hasNextPage={appState.hasNextPage}
            totalResults={filteredResults.length} // Reflect total filtered results
          />
        </div>
      </div>
      {/* 2. Main content area - NOW A FLEX CONTAINER */}
      {/* ✅ FIX: This container now uses Flexbox to manage its children side-by-side. */}
      <div
        className="flex flex-1 overflow-hidden" // Use flex and hide potential overflow
      >
        {/* ResultsPanel container will grow and shrink */}
        {/* ✅ FIX: This div is now a flex item that grows to fill available space. */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ scrollbarGutter: 'stable' }}
        >
          <ResultsPanel
            viewMode={appState.viewMode}
            results={filteredResults} // <--- CHANGED: Pass filteredResults here
            onResultClick={eventHandlers.handleMasterResultClick}
            onSimilaritySearch={handleSimilaritySearchAdapter}
            onResultRightClick={eventHandlers.handleResultRightClick}
            currentUser={user?.username ?? ''}
            sendMessage={sendMessage}
            onResultDoubleClick={modalState.handleOpenDetailModal}
            onSubmission={handleResultSubmission} // ✅ USE STABLE HANDLER
            submissionStatuses={submissionState.submissionStatuses}
            optimisticSubmissions={submissionState.optimisticSubmissions}
            onResultDislike={handleResultDislike} // ✅ USE STABLE HANDLER
            onToggleViewMode={appState.toggleViewMode}
          />
        </div>

        {/* DislikePanel is now a direct flex child. */}
        {/* ✅ FIX: No more absolute positioning. It's now part of the flex layout and will "push" the ResultsPanel. */}
        <DislikePanel
          isOpen={modalState.isDislikePanelOpen}
          items={dislikeState.dislikedItems}
          onClose={modalState.handleToggleDislikePanel}
          onClear={() => dislikeState.handleClearDislikes(user)}
          onUndislike={(item) => dislikeState.handleUndislike(item, user)}
          onResultClick={eventHandlers.handleMasterResultClick}
            onSimilaritySearch={handleSimilaritySearchAdapter}
        />
      </div>
    </div>
  );

  const framesPanelInstance = keyframeLoader.carouselFrames !== null ? (
    <FramesPanel
      frames={keyframeLoader.carouselFrames}
      videoTitle={appState.currentVideoTitle}
      isLoading={keyframeLoader.isLoading}
      activeFrameId={keyframeLoader.activeFrameId}
      loadNextFrames={keyframeLoader.loadNextFrames}
      loadPreviousFrames={keyframeLoader.loadPreviousFrames}
      hasMoreNext={keyframeLoader.hasMoreNext}
      hasMorePrev={keyframeLoader.hasMorePrev}
      onClose={keyframeLoader.handleCarouselClose}
      onFrameClick={eventHandlers.handleFrameClickInPanel}
      onRightClick={eventHandlers.handleFrameRightClickInPanel}
            onSimilaritySearch={handleSimilaritySearchAdapter}
      currentUser={user?.username ?? ''}
      sendMessage={sendMessage}
      onResultDoubleClick={modalState.handleOpenDetailModal}
      onSubmission={handleResultSubmission} // ✅ USE STABLE HANDLER
      // ✅ FIX: Pass the correct props from the hook
      isFetchingNext={keyframeLoader.isFetchingNext}
      isFetchingPrev={keyframeLoader.isFetchingPrev}
    />
  ) : null;

  const videoPanelInstance = modalState.videoPanelState.isOpen &&
    modalState.videoPanelState.videoId &&
    modalState.videoPanelState.timestamp ? (
    <VideoPanel
      videoId={modalState.videoPanelState.videoId}
      timestamp={modalState.videoPanelState.timestamp}
      onClose={modalState.handleCloseVideoPanel}
      onBroadcast={eventHandlers.handleItemBroadcast}
      currentUser={user?.username ?? ''}
      sendMessage={sendMessage}
      // ✅ FIX 2: Pass the `lastMessage` prop down to the VideoPanel.
      lastMessage={lastMessage}
    />
  ) : null;

  const detailModalInstance = modalState.detailModalItem ? (
    <FrameDetailModal
      item={modalState.detailModalItem}
      onClose={modalState.handleCloseDetailModal}
    />
  ) : null;

  // =================================================================
  // 3. ✅ FIX: Moved the early return for authentication HERE.
  //    This is now AFTER all hooks have been called.
  // =================================================================
  if (!user) {
    return <UsernamePrompt onConnect={createSession} isLoading={isSessionLoading} />;
  }

  // =================================================================
  // 4. FINAL RENDER (when user exists)
  // =================================================================
  return (
    <>
      <AppShell
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        carouselOverlay={framesPanelInstance}
        broadcastMessages={broadcastState.broadcastMessages}
        isConnected={isConnected}
        activeUsers={broadcastState.activeUsers}
        videoModal={videoPanelInstance}
        onBroadcastResultClick={eventHandlers.handleMasterResultClick}
        onBroadcastRightClick={eventHandlers.handleBroadcastFeedRightClick}
        onBroadcastSimilaritySearch={searchHandlers.handleSimilaritySearch}
        onBroadcastResultDoubleClick={modalState.handleOpenDetailModal}
        onVqaSubmit={broadcastState.handleVqaSubmit}
        onExportBroadcastFeed={eventHandlers.handleExportBroadcast}
        isTrackModeActive={broadcastState.isTrackModeActive}
        vqaQuestions={broadcastState.vqaQuestions}
        onVqaQuestionChange={broadcastState.handleVqaQuestionChange}
        isChatbotMode={searchMode === 'chatbot'}

        // ✅ FIX: Pass the newly created stable handlers
        onRemoveBroadcastMessage={handleRemoveBroadcastMessage}
        onClearBroadcastFeed={handleClearBroadcastFeed}
        onToggleTrackMode={handleToggleTrackMode}
        onBroadcastResultSubmission={handleBroadcastResultSubmission}
      />

      <NotificationContainer
        onOpenVideo={(videoId, timestamp) => modalState.handleOpenVideoPanel(videoId, timestamp)}
      />

      {detailModalInstance}

      {submissionState.submissionResult && (
        <SubmissionStatusPanel
          key={submissionState.submissionResult.itemId}
          result={submissionState.submissionResult}
          onClose={() => submissionState.setSubmissionResult(null)}
        />
      )}


      <BubbleChat
        isVisible={searchMode === 'manual'}
      />
    </>
  );
};

export default React.memo(App);