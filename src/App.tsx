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
import { ConnectionPrompt } from './features/communicate/components/User/ConnectionPrompt';
import { useShortcuts } from './utils/shortcuts';
import type { ViewMode } from './features/results/types';
import type { ModelSelection } from './features/search/types';
import { dresService } from './utils/DresService';

const App: React.FC = () => {
  // =================================================================
  // 1. ALL HOOKS ARE CALLED UNCONDITIONALLY AT THE TOP
  // =================================================================
  const inputPanelRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>('manual');
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  
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

  const handleResultSubmission = useCallback((item: ResultItem) => {
    submissionState.handleSubmission(item, user, sendMessage);
  }, [submissionState, user, sendMessage]);

  const handleResultDislike = useCallback((item: ResultItem) => {
    dislikeState.handleDislike(
      item,
      user,
      modalState.isDislikePanelOpen,
      modalState.handleToggleDislikePanel
    );
  }, [dislikeState, user, modalState.isDislikePanelOpen, modalState.handleToggleDislikePanel]);

  const handleConnect = useCallback(async (username: string, dresSessionId: string, dresBaseUrl: string) => {
    dresService.setConfig(dresBaseUrl, dresSessionId);
    await createSession(username);
  }, [createSession]);

  // ✅ FIX 1: Define the function to toggle the broadcast feed's visibility.
  const handleToggleBroadcastFeed = useCallback(() => {
    setIsBroadcastOpen(prev => !prev);
  }, []);

  const shortcutHandlers = useMemo(() => ({
    TOGGLE_VIEW_MODE: appState.toggleViewMode,
    FOCUS_SEARCH: () => inputPanelRef.current?.focus(),
    TOGGLE_AUTO_TRANSLATE: appState.toggleAutoTranslate,
    CLOSE_MODAL: modalState.handleCloseModal,
    TOGGLE_DISLIKE_PANEL: modalState.handleToggleDislikePanel,
    GO_TO_PAGE: searchHandlers.handlePageChange,
    
    // ✅ FIX 2: Correctly wire the shortcut to the new handler.
    TOGGLE_BROADCAST_FEED: handleToggleBroadcastFeed,
    CLEAR_BROADCAST_FEED: broadcastState.handleClearBroadcastFeed,
  }), [
    appState.toggleViewMode,
    appState.toggleAutoTranslate,
    modalState.handleCloseModal,
    modalState.handleToggleDislikePanel,
    searchHandlers.handlePageChange,
    
    // ✅ FIX 3: Add the new handler to the dependency array.
    handleToggleBroadcastFeed,
    broadcastState.handleClearBroadcastFeed,
  ]);

  useShortcuts(shortcutHandlers);

  const filteredResults = useMemo(
    () => filterResults(appState.results),
    [appState.results, selectedObjects, filterResults]
  );

  const handleRemoveBroadcastMessage = useCallback((messageId: string) => {
    broadcastState.handleRemoveBroadcastMessage(messageId);
  }, [broadcastState.handleRemoveBroadcastMessage]);

  const handleClearBroadcastFeed = useCallback(() => {
    broadcastState.handleClearBroadcastFeed();
  }, [broadcastState.handleClearBroadcastFeed]);

  const handleToggleTrackMode = useCallback(() => {
    broadcastState.handleToggleTrackMode();
  }, [broadcastState.handleToggleTrackMode]);

  const handleBroadcastResultSubmission = useCallback((item: ResultItem) => {
    submissionState.handleSubmission(item, user, sendMessage);
  }, [submissionState, user, sendMessage]);

  const handleSimilaritySearchAdapter = useCallback((imageSrc: string, cardId: string) => {
    console.log(`Adapter triggered for similarity search on card: ${cardId}`);
    searchHandlers.handleSimilaritySearch(imageSrc);
  }, [searchHandlers.handleSimilaritySearch]);

  // (The rest of the component remains the same)
  // ... leftPanel, rightPanel, etc.
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
  ]);
  
    const rightPanel = (
      <div className="relative h-full flex flex-col">
        <div className="flex-shrink-0 z-30 bg-white/60 backdrop-blur-sm border-b border-slate-200/70 flex justify-between items-center">
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
                results={appState.results}
                selectedObjects={selectedObjects}
                onFilterChange={handleFilterChange}
                globalObjectCounts={globalObjectCounts}
                isLoading={isLoadingMetadata}
              />
              }
          />
          <div className="flex-grow flex justify-center">
            <PaginationContainer
              currentPage={appState.currentPage}
              onPageChange={searchHandlers.handlePageChange}
              hasNextPage={appState.hasNextPage}
              totalResults={filteredResults.length}
            />
          </div>
        </div>
        <div
          className="flex flex-1 overflow-hidden"
        >
          <div
            className="flex-1 overflow-y-auto"
            style={{ scrollbarGutter: 'stable' }}
          >
            <ResultsPanel
              viewMode={appState.viewMode}
              results={filteredResults}
              onResultClick={eventHandlers.handleMasterResultClick}
              onSimilaritySearch={handleSimilaritySearchAdapter}
              onResultRightClick={eventHandlers.handleResultRightClick}
              currentUser={user?.username ?? ''}
              sendMessage={sendMessage}
              onResultDoubleClick={modalState.handleOpenDetailModal}
              onSubmission={handleResultSubmission}
              submissionStatuses={submissionState.submissionStatuses}
              optimisticSubmissions={submissionState.optimisticSubmissions}
              onResultDislike={handleResultDislike}
              onToggleViewMode={appState.toggleViewMode}
            />
          </div>
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
        onSubmission={handleResultSubmission}
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
        lastMessage={lastMessage}
      />
    ) : null;
  
    const detailModalInstance = modalState.detailModalItem ? (
      <FrameDetailModal
        item={modalState.detailModalItem}
        onClose={modalState.handleCloseDetailModal}
      />
    ) : null;

  if (!user) {
    return <ConnectionPrompt onConnect={handleConnect} isLoading={isSessionLoading} />;
  }
  
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
        isBroadcastOpen={isBroadcastOpen}
        onToggleBroadcastFeed={handleToggleBroadcastFeed}
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