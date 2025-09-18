// src/features/communicate/hooks/useWebSocketHandlers.ts - Updated
import { useCallback } from 'react';
import type { WebSocketMessage, AllWebSocketMessages } from '../types';
import type { ResultItem } from '../../results/types';

interface UseWebSocketHandlersProps {
  broadcastState: any;
  submissionState: any;
  modalState: any; // Added for video sharing
  onShowVideoNotification?: (notification: any) => void;
  onEventFrameAdded?: (eventId: string, frame: ResultItem, submittedBy: string) => void;
  onDresSubmission?: (submission: any) => void;
}

interface UseWebSocketHandlersReturn {
  handleWebSocketMessage: (message: WebSocketMessage) => void;
}

export const useWebSocketHandlers = ({
  broadcastState,
  submissionState,
  modalState,
  onShowVideoNotification,
  onEventFrameAdded,
  onDresSubmission,
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

      case 'event_frame_added':
        if (message.payload && onEventFrameAdded) {
          // Notify other users that a frame was added to an event
          onEventFrameAdded(
            message.payload.eventId,
            message.payload.frame,
            message.payload.submittedBy
          );
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
    onEventFrameAdded,
    onDresSubmission,
  ]);

  return {
    handleWebSocketMessage,
  };
};