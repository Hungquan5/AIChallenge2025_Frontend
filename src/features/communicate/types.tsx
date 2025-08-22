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
  itemId: string; // ✅ ADD THIS LINE: The unique ID of the submitted item
  submission: 'CORRECT' | 'WRONG' | 'INDETERMINATE' | 'DUPLICATE' | 'ERROR';
  description: string;
  username?: string;
}

export interface SubmissionResultMessage {
    type: 'submission_result';
    payload: SubmissionResultPayload;
}

// 1. Define the payload for the new message
export interface SubmissionStatusUpdatePayload {
  [key: string]: 'PENDING' | 'WRONG'; // A dictionary where key is the image thumbnail URL
}

// 2. Define the full message structure
export interface SubmissionStatusUpdateMessage {
  type: 'submission_status_update';
  payload: SubmissionStatusUpdatePayload;
}

// 3. Add the new type to your main WebSocketMessage union type
export type WebSocketMessage = 
  | BroadcastImageMessage 
  | StatusMessage 
  | SubmissionResultMessage
  | SubmissionStatusUpdateMessage; // Add this new type


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