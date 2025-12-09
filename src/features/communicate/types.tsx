// src/features/communicate/types.ts - Updated with new message types
import type { ResultItem } from '../results/types';

export interface WebSocketMessage {
  type: string;
  payload?: any;
  [key: string]: any;
}

export interface BroadcastImageMessage extends WebSocketMessage {
  type: 'broadcast_image';
  payload: ResultItem;
}

export interface BroadcastVideoMessage extends WebSocketMessage {
  type: 'broadcast_video';
  payload: {
    videoId: string;
    timestamp: number;
    submittedBy: string;
    message: string;
  };
}

export interface EventFrameAddedMessage extends WebSocketMessage {
  type: 'event_frame_added';
  payload: {
    eventId: string;
    frame: ResultItem;
    submittedBy: string;
  };
}

export interface DresSubmissionMessage extends WebSocketMessage {
  type: 'dres_submission';
  payload: {
    eventId: string;
    frames: ResultItem[];
    submittedBy: string;
    timestamp: number;
  };
}

export interface SubmissionResultMessage extends WebSocketMessage {
  type: 'submission_result';
  payload: {
    itemId: string;
  submission: 'CORRECT' | 'WRONG' | 'INDETERMINATE' | 'DUPLICATE' | 'ERROR';
    message?: string;
  };
}


// ✅ 1. DEFINE the new, richer status object
export interface SubmissionStatus {
  status: 'PENDING' | 'WRONG';
  submittedBy: string;
}

// ✅ 2. UPDATE the message payload to use the new type
export interface SubmissionStatusUpdateMessage extends WebSocketMessage {
  type: 'submission_status_update';
  payload: {
    // The value for each imageKey is now an object of type SubmissionStatus
    [imageKey: string]: SubmissionStatus;
  };
}
export interface UserStatusMessage extends WebSocketMessage {
  type: 'user_status';
  payload: {
    message: string;
  };
}

export interface RemoveBroadcastMessage extends WebSocketMessage {
  type: 'remove_broadcast';
  messageId: string;
  username: string;
  timestamp: number;
}
// --- NEW: API Response Types ---
// A generic wrapper for all API responses
export interface ApiResponse<T> {
  data?: T;
  error?: {
    detail: string; // Assuming the error object always has a 'detail' string
    [key: string]: any;
  };
}

// Specific response for a session creation/deletion
export interface SessionResponse {
  message: string;
  user_id: string; // Or username, depending on your backend
}

// Specific response for a user status check
export interface UserStatusResponse {
  user: string;
  status: 'online' | 'offline';
}
// --- END: NEW API Response Types ---
export interface User{
  username:string
}
// Union type for all message types
export type AllWebSocketMessages = 
  | BroadcastImageMessage
  | BroadcastVideoMessage
  | EventFrameAddedMessage
  | DresSubmissionMessage
  | SubmissionResultMessage
  | SubmissionStatusUpdateMessage
  | UserStatusMessage
  | RemoveBroadcastMessage;