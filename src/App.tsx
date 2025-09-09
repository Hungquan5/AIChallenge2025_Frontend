// src/App.tsx (Refactored)
import React, { useMemo, useRef } from 'react'; // ✅ Import useMemo
import './App.css';

// --- Core Components & Layouts ---
import AppShell from './layouts/AppShell';
import TopControlBar from './layouts/TopControlBar';
import InputPanel from './features/search/components/InputPanel/InputPanel';
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

// --- Other Components ---
import { UsernamePrompt } from './features/communicate/components/User/UsernamePrompt';
import ShortcutsHelp from './components/ShortcutsHelp';
import { useShortcuts } from './utils/shortcuts';
import { X } from 'lucide-react';

const App: React.FC = () => {
  // Refs
  const inputPanelRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Core State Hooks
  const appState = useAppState();
  const modalState = useModalState();
  const broadcastState = useBroadcastState();
  const submissionState = useSubmissionState();
  const dislikeState = useDislikeState();

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
    submissionState
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

  // ✅ Create a memoized object for shortcut handlers
  const shortcutHandlers = useMemo(() => ({
    TOGGLE_VIEW_MODE: appState.toggleViewMode,
    FOCUS_SEARCH: () => inputPanelRef.current?.focus(),
    TOGGLE_AUTO_TRANSLATE: appState.toggleAutoTranslate,
    CLOSE_MODAL: modalState.handleCloseModal,
    TOGGLE_DISLIKE_PANEL: modalState.handleToggleDislikePanel,
    // ✅ ADD THE DYNAMIC PAGE NAVIGATION HANDLER
    GO_TO_PAGE: searchHandlers.handlePageChange,
  }), [
    appState.toggleViewMode,
    appState.toggleAutoTranslate,
    modalState.handleCloseModal,
    modalState.handleToggleDislikePanel,
    searchHandlers.handlePageChange,
  ]);
  
  // ✅ Pass the memoized handlers to the hook
  useShortcuts(shortcutHandlers);



  // Create panel instances
  const { panelContent, searchButton, chainSearchButton } = InputPanel({
    onSearch: searchHandlers.handleInitiateSearch,
    onSingleSearchResult: searchHandlers.handleSingleItemSearch,
    isAutoTranslateEnabled: appState.isAutoTranslateEnabled,
    isLoading: appState.isLoading,
    user: user,
  });

  const leftPanel = (
    <div ref={inputPanelRef} tabIndex={-1}>
      {panelContent}
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
        searchButton={searchButton}
        chainSearchButton={chainSearchButton}
        carouselOverlay={framesPanelInstance}
        broadcastMessages={broadcastState.broadcastMessages}
        isConnected={isConnected}
        activeUsers={broadcastState.activeUsers}
        onRemoveBroadcastMessage={eventHandlers.handleRemoveBroadcastMessage} // This is correct if eventHandlers is updated
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
    </>
  );
};

export default App;