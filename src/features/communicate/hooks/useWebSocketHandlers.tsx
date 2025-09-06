// src/features/communicate/hooks/useWebSocketHandlers.ts
import { useCallback } from 'react';
import type { WebSocketMessage } from '../types';
import type { ResultItem } from '../../results/types';

interface UseWebSocketHandlersProps {
  broadcastState: any;
  submissionState: any;
}

interface UseWebSocketHandlersReturn {
  handleWebSocketMessage: (message: WebSocketMessage) => void;
}

export const useWebSocketHandlers = ({
  broadcastState,
  submissionState,
}: UseWebSocketHandlersProps): UseWebSocketHandlersReturn => {

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (!message) return;

    switch (message.type) {
      case 'broadcast_image':
        if (message.payload) {
          const newMessage: ResultItem = {
            ...(message.payload as ResultItem),
          };
          broadcastState.handleAddBroadcastMessage(newMessage);
        }
        break;

      case 'submission_result':
        if (message.payload) {
          // Show the pop-up notification for everyone
          submissionState.setSubmissionResult({ ...message.payload });
        }
        break;

      case 'submission_status_update':
        if (message.payload) {
          submissionState.setSubmissionStatuses(message.payload);
        }
        break;  

      default:
        console.log('Unknown message type:', message.type);
    }
  }, [broadcastState, submissionState]);

  return {
    handleWebSocketMessage,
  };
};