import type { ResultItem } from '../results/types'; // Make sure this import path is correct for your project structure

export interface User {
  username: string;
}

// This is the message format for broadcasting an image.
// The payload should contain the full data for the item.
export interface BroadcastImageMessage {
  type: 'broadcast_image';
  payload: ResultItem;
}

// This could be another type of message, for example, for status updates.
export interface StatusMessage {
  type: 'status';
  message: string;
  username?: string;
}

// WebSocketMessage is now a union of all possible message types.
// This allows for type-safe handling in your components.
export type WebSocketMessage = BroadcastImageMessage | StatusMessage;


// Your other API-related types can remain as they are.
export interface ApiError {
  detail: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface SessionResponse {
  session_data: {
    username: string;
  };
}

export interface UserStatusResponse {
  session_data: User;
}