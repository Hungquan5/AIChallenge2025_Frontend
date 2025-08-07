// types/websocket.ts
export interface User {
    username: string;
  }
  
  export interface WebSocketMessage {
    type: 'image' | 'status';
    username?: string;
    data?: string;
    message?: string;
  }

  // types/api.ts
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
      // ... any other user session data
    };
  }
  
  export interface UserStatusResponse {
    session_data: User;
  }
  


  // --- NEW ---
  // Specific type for our image broadcast message
  export interface BroadcastImageMessage {
    type: 'broadcast_image';
    payload: {
      id: string;
      thumbnail: string;
      title: string;
      submittedBy: string;
    };
  }