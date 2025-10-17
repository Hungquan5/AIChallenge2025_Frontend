// src/hooks/useEventHandlers.ts
import { useCallback,useRef } from 'react';
import type { ResultItem } from '../features/results/types';
import { convertAgentOutputToResults } from '../utils/AgentUtils';
import type { AgentToolOutput } from '../utils/AgentUtils';
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
  dislikeState,
  keyframeLoader,
  searchHandlers,
  user,
  sendMessage,
}: UseEventHandlersProps): UseEventHandlersReturn => {
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleMasterResultClick = useCallback((item: ResultItem) => {
    // 1. Capture the title of the video that was clicked
    appState.setCurrentVideoTitle(item.title);
    // 2. Trigger the keyframe loader to fetch all frames for that video
    keyframeLoader.handleResultClick(item);
  }, [appState, keyframeLoader]);

  const handleResultRightClick = useCallback((item: ResultItem, event: React.MouseEvent) => {
    // If the Ctrl key is pressed, ignore this (dislike action already processed)
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      return;
    }

    // Standard right-click behavior
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

    // Prepare the payload with sender info
    const payloadWithSenderInfo = {
      ...itemToBroadcast,
      submittedBy: user.username,
    };

    // Construct the message
    const message = {
      type: 'broadcast_image',
      payload: payloadWithSenderInfo,
    };

    // Send the message over WebSocket
    sendMessage(JSON.stringify(message));

    // Update local state optimistically
    broadcastState.handleAddBroadcastMessage(message.payload);
  }, [user?.username, sendMessage, broadcastState]);

  const handleRemoveBroadcastMessage = useCallback((messageId: string, index: number) => {
    broadcastState.handleRemoveBroadcastMessage(messageId, index);

    // Optionally, send removal notification to other users
    const message = {
      type: 'remove_broadcast',
      messageId,
      username: user?.username,
      timestamp: Date.now()
    };

    sendMessage(JSON.stringify(message));
  }, [user?.username, sendMessage, broadcastState]);

  const handleBroadcastFeedRightClick = useCallback((item: ResultItem, event: React.MouseEvent) => {
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
      // Track mode export logic
      const groupedByVideo = broadcastState.broadcastMessages.reduce((acc: any, msg: ResultItem) => {
        const key = msg.videoId || 'unknown';
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(msg);
        return acc;
      }, {});

      fileContent = Object.entries(groupedByVideo)
        .map(([videoId, items]: [string, any]) => {
          const sortedFrameIds = items
            .map((item: ResultItem) => item.timestamp)
            .sort((a: string, b: string) => (a ?? '').localeCompare(b ?? ''));

          return [videoId, ...sortedFrameIds].join(',');
        })
        .join('\n');
    } else {
      // Original export logic
      fileContent = broadcastState.broadcastMessages
        .map((msg: ResultItem) => {
          const videoId = msg.videoId || '';
          const frameId = msg.timestamp || '';
          const question = broadcastState.vqaQuestions[msg.id];

          if (question && question.trim()) {
            const escapedQuestion = question.replace(/"/g, '""');
            return `${videoId},${frameId},"${escapedQuestion}"`;
          } else {
            return `${videoId},${frameId}`;
          }
        })
        .join('\n');
    }

    // Download logic
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

  // Show loading state
  appState.setIsLoading(true);

  try {
    // Convert tool outputs to ResultItem format using the utility function
    const newResults = convertAgentOutputToResults(toolOutputs);
    
    if (newResults.length === 0) {
      console.warn('No results found in agent tool outputs');
      appState.setIsLoading(false);
      return;
    }
    // console.log('Agent tool outputs converted to results:', newResults);
    // Update app state with new results
    appState.updateResultsWithGrouped(newResults);
    appState.setCurrentPage(1);
    appState.setHasNextPage(false);
    
    // Store the last search context
    appState.setLastSearchMode('normal');
    appState.setLastQueries([{ type: 'text', value: 'agent_search' }]);
    
    // Scroll to results panel
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);

  } catch (error) {
    console.error('Error processing agent tool outputs:', error);
  } finally {
    appState.setIsLoading(false);
  }
}, [appState]);
  return {
    handleMasterResultClick,
    handleResultRightClick,
    handleFrameClickInPanel,
    handleFrameRightClickInPanel,
    handleItemBroadcast,
    handleRemoveBroadcastMessage,
    handleBroadcastFeedRightClick,
    handleExportBroadcast,
    handleAgentToolOutputs
  };
};