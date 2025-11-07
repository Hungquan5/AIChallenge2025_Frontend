// src/hooks/useEventHandlers.ts
import { useCallback,useMemo } from 'react'; // ❌ REMOVED useRef as it's no longer needed here
import { convertAgentOutputToResults } from '../utils/AgentUtils';
import type { AgentToolOutput } from '../utils/AgentUtils';
import { useState } from 'react';
import type { ResultItem } from '../features/results/types';
import { fullSubmissionFlow } from '../features/submit/components/SubmitAPI';
interface UseEventHandlersProps {
  appState: any;
  modalState: any;
  broadcastState: any;
  submissionState: any;
  dislikeState: any;
  keyframeLoader: any;
  searchHandlers: any;
  user: any;
  sendMessage: (message: string) => void;
  // ✅ FIX: Add the resultsRef property to the interface definition
  resultsRef: React.RefObject<HTMLDivElement|null>;
}

interface UseEventHandlersReturn {
  handleMasterResultClick: (item: ResultItem) => void;
  handleResultRightClick: (item: ResultItem, event: React.MouseEvent) => void;
  handleFrameClickInPanel: (frame: ResultItem) => void;
  handleFrameRightClickInPanel: (frame: ResultItem, event: React.MouseEvent) => void;
  handleItemBroadcast: (itemToBroadcast: ResultItem) => void;
  handleRemoveBroadcastMessage: (messageId: string, index: number) => void;
  handleBroadcastFeedRightClick: (item: ResultItem, event: React.MouseEvent) => void;
  handleExportBroadcast: () => void;
  handleAgentToolOutputs: (toolOutputs: AgentToolOutput[]) => void;
}

export const useEventHandlers = ({
  appState,
  modalState,
  broadcastState,
  submissionState,
  keyframeLoader,
  user,
  sendMessage,
  resultsRef, // ✅ FIX: Destructure the prop
}: UseEventHandlersProps): UseEventHandlersReturn => {
  // ❌ FIX: The local ref is removed, as we now receive it from props.

  const handleMasterResultClick = useCallback((item: ResultItem) => {
    appState.setCurrentVideoTitle(item.title);
    keyframeLoader.handleResultClick(item);
  }, [appState, keyframeLoader]);

  const handleResultRightClick = useCallback((item: ResultItem, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    if (item.videoId && item.timestamp) {
      modalState.handleOpenVideoPanel(item.videoId, item.timestamp);
    }
  }, [modalState]);

  const handleFrameClickInPanel = useCallback((frame: ResultItem) => {
    modalState.handleOpenVideoPanel(frame.videoId, frame.timestamp);
  }, [modalState]);

  const handleFrameRightClickInPanel = useCallback((frame: ResultItem, event: React.MouseEvent) => {
    event.preventDefault();
    modalState.handleOpenVideoPanel(frame.videoId, frame.timestamp);
  }, [modalState]);

  const handleItemBroadcast = useCallback((itemToBroadcast: ResultItem) => {
    if (!user?.username) {
      console.warn('Cannot broadcast: No username is set.');
      return;
    }
    const payloadWithSenderInfo = { ...itemToBroadcast, submittedBy: user.username };
    const message = { type: 'broadcast_image', payload: payloadWithSenderInfo };
    sendMessage(JSON.stringify(message));
    broadcastState.handleAddBroadcastMessage(message.payload);
  }, [user, sendMessage, broadcastState, submissionState]); // ✅ Add user and submissionState to dependencies

  const handleRemoveBroadcastMessage = useCallback((messageId: string, index: number) => {
    broadcastState.handleRemoveBroadcastMessage(messageId, index);
    const message = { type: 'remove_broadcast', messageId, username: user?.username, timestamp: Date.now() };
    sendMessage(JSON.stringify(message));
  }, [user?.username, sendMessage, broadcastState]);

  const handleBroadcastFeedRightClick = useCallback((item: ResultItem, ) => {
    if (item.videoId && item.timestamp) {
      modalState.handleOpenVideoPanel(item.videoId, item.timestamp);
    }
  }, [modalState]);

  const handleExportBroadcast = useCallback(() => {
    if (broadcastState.broadcastMessages.length === 0) {
      alert("There's nothing in the live feed to export.");
      return;
    }
    let fileContent = '';
    if (broadcastState.isTrackModeActive) {
      const groupedByVideo = broadcastState.broadcastMessages.reduce((acc: any, msg: ResultItem) => {
        const key = msg.videoId || 'unknown';
        if (!acc[key]) acc[key] = [];
        acc[key].push(msg);
        return acc;
      }, {});
      fileContent = Object.entries(groupedByVideo)
        .map(([videoId, items]: [string, any]) => {
          const sortedFrameIds = items.map((item: ResultItem) => item.timestamp).sort((a: string, b: string) => (a ?? '').localeCompare(b ?? ''));
          return [videoId, ...sortedFrameIds].join(',');
        })
        .join('\n');
    } else {
      fileContent = broadcastState.broadcastMessages
        .map((msg: ResultItem) => {
          const videoId = msg.videoId || '';
          const frameId = msg.timestamp || '';
          const question = broadcastState.vqaQuestions[msg.id];
          if (question && question.trim()) {
            const escapedQuestion = question.replace(/"/g, '""');
            return `${videoId},${frameId},"${escapedQuestion}"`;
          }
          return `${videoId},${frameId}`;
        })
        .join('\n');
    }
    const blob = new Blob([fileContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `live_feed_export_${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }, [broadcastState]);

  const handleAgentToolOutputs = useCallback((toolOutputs: AgentToolOutput[]) => {
    if (!toolOutputs || toolOutputs.length === 0) return;
    appState.setIsLoading(true);
    try {
      const newResults = convertAgentOutputToResults(toolOutputs);
      if (newResults.length === 0) {
        console.warn('No results found in agent tool outputs');
        appState.setIsLoading(false);
        return;
      }
      appState.updateResultsWithGrouped(newResults);
      appState.setCurrentPage(1);
      appState.setHasNextPage(false);
      appState.setLastSearchMode('normal');
      appState.setLastQueries([{ type: 'text', value: 'agent_search' }]);
      setTimeout(() => {
        // Now using the ref passed from App.tsx
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error) {
      console.error('Error processing agent tool outputs:', error);
    } finally {
      appState.setIsLoading(false);
    }
  }, [appState, resultsRef]); // ✅ Add resultsRef to dependency array

  return useMemo(() => ({
    handleMasterResultClick,
    handleResultRightClick,
    handleFrameClickInPanel,
    handleFrameRightClickInPanel,
    handleItemBroadcast,
    handleRemoveBroadcastMessage,
    handleBroadcastFeedRightClick,
    handleExportBroadcast,
    handleAgentToolOutputs,
  }),[
    handleMasterResultClick,
    handleResultRightClick,
    handleFrameClickInPanel,
    handleFrameRightClickInPanel,
    handleItemBroadcast,
    handleRemoveBroadcastMessage,
    handleBroadcastFeedRightClick,
    handleExportBroadcast,
    handleAgentToolOutputs,
  ]);
};