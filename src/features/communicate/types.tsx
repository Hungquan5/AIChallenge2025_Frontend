import type { ResultItem } from '../results/types'; // Make sure this import path is correct for your project structure

export interface User {
  username: string;
}

// --- MESSAGE TYPE DEFINITIONS ---

// 1. This is the message format for broadcasting an image.
export interface BroadcastImageMessage {
  type: 'broadcast_image';
  payload: ResultItem;
}

// 2. This is a message type for general status updates.
export interface StatusMessage {
  type: 'status';
  message: string;
  username?: string;
}

// ✅ 3. ADD THE NEW DEFINITION FOR A SUBMISSION RESULT
// This defines the structure of the data sent when a submission is broadcasted.
export interface SubmissionResultPayload {
    submission: 'CORRECT' | 'WRONG' | 'INDETERMINATE' | 'DUPLICATE' | 'ERROR';
    description: string;
    username?: string; // The user who made the submission
}

export interface SubmissionResultMessage {
    type: 'submission_result';
    payload: SubmissionResultPayload;
}


// ✅ 4. UPDATE THE MAIN WEBSOCKET MESSAGE TYPE
// WebSocketMessage is now a union of ALL possible message types.
export type WebSocketMessage = 
  | BroadcastImageMessage 
  | StatusMessage 
  | SubmissionResultMessage; // Add the new message type here


// --- Your other API-related types can remain as they are. ---

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