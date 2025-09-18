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
    submission: 'CORRECT' | 'WRONG' | 'DUPLICATE' | 'ERROR';
    message?: string;
  };
}

export interface SubmissionStatusUpdateMessage extends WebSocketMessage {
  type: 'submission_status_update';
  payload: {
    [imageKey: string]: 'PENDING' | 'WRONG';
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