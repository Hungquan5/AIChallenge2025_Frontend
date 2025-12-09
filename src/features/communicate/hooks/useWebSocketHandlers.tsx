// src/features/communicate/hooks/useWebSocketHandlers.ts - Updated
import { useCallback } from 'react';
import type { WebSocketMessage,  } from '../types';
import type { ResultItem } from '../../results/types';
interface UseWebSocketHandlersProps {
  broadcastState: any;
  submissionState: any;
  modalState: any;
  onShowVideoNotification?: (notification: any) => void;
  onDresSubmission?: (submission: any) => void;
  // ✅ ADD: Define the new callback prop for the central handler.
  onEventListUpdated?: (videoId: string, eventFrames: { [key: string]: ResultItem[] }) => void;
}

interface UseWebSocketHandlersReturn {
  handleWebSocketMessage: (message: WebSocketMessage) => void;
}

export const useWebSocketHandlers = ({
  broadcastState,
  submissionState,
  modalState,
  onShowVideoNotification,
  // onEventFrameAdded, // REMOVED
  onDresSubmission,
  onEventListUpdated, // ADDED
}: UseWebSocketHandlersProps): UseWebSocketHandlersReturn => {

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (!message) return;

    console.log('Received WebSocket message:', message.type, message.payload);

    switch (message.type) {
      case 'broadcast_image':
        if (message.payload) {
          const newMessage: ResultItem = {
            ...(message.payload as ResultItem),
          };
          broadcastState.handleAddBroadcastMessage(newMessage);
        }
        break;

      case 'broadcast_video':
        if (message.payload && onShowVideoNotification) {
          // Show video sharing notification to all users
          const notification = {
            id: `video-${Date.now()}`,
            type: 'video_share',
            videoId: message.payload.videoId,
            timestamp: message.payload.timestamp,
            submittedBy: message.payload.submittedBy,
            message: message.payload.message,
            createdAt: Date.now(),
          };
          onShowVideoNotification(notification);
        }
        break;


      case 'event_list_updated':
        if (message.payload && onEventListUpdated) {
          // This allows parent components to react if needed
          onEventListUpdated(message.payload.videoId, message.payload.eventFrames);
        }
        break;
      case 'dres_submission':
        if (message.payload && onDresSubmission) {
          // Handle DRES submission notification
          onDresSubmission({
            eventId: message.payload.eventId,
            frameCount: message.payload.frames.length,
            submittedBy: message.payload.submittedBy,
            timestamp: message.payload.timestamp,
          });
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

      case 'user_status':
        // Handle user connect/disconnect messages
        console.log('User status:', message.payload?.message);
        break;

      case 'remove_broadcast':
        // Handle broadcast message removal
        if (message.messageId) {
          broadcastState.handleRemoveBroadcastMessage(message.messageId);
        }
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }, [
    broadcastState,
    submissionState,
    modalState,
    onShowVideoNotification,
    onDresSubmission,
    onEventListUpdated
  ]);

  return {
    handleWebSocketMessage,
  };
};