import type { ApiResponse, SessionResponse,UserStatusResponse } from "../../types";

// services/api.ts
const API_BASE_URL =  'http://localhost:9991';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: {
          detail: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }


  async connectUser(username: string): Promise<ApiResponse<SessionResponse>> {
    // FIX: Point to the new HTTP endpoint for creating a session
    return this.makeRequest<SessionResponse>(`/user/connect/${username}`, {
      method: 'POST',
    });
  }

  async disconnectUser(username: string): Promise<ApiResponse<SessionResponse>> {
    // FIX: Point to the new HTTP endpoint for deleting a session
    return this.makeRequest<SessionResponse>(`/user/disconnect/${username}`, {
      method: 'DELETE',
    });
  }

  // Note: A GET /user/status/{username} endpoint would also be needed if you keep this function
  async getUserStatus(username: string): Promise<ApiResponse<UserStatusResponse>> {
    // This would require a corresponding GET endpoint on the backend as well
    return this.makeRequest<UserStatusResponse>(`/user/status/${username}`);
  }
}
export const apiService = new ApiService();