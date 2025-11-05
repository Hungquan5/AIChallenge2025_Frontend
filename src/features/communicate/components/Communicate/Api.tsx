// services/api.ts - Corrected import path

// ✅ FIX: Import the types from their actual location.
// The path may need slight adjustment based on your folder structure.
import type { ApiResponse, SessionResponse,UserStatusResponse } from "../../types"

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
        // The error object might not have 'detail', so we check for it.
        const detail = errorData.detail || 'An error occurred';
        return { error: { detail } };
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
    return this.makeRequest<SessionResponse>(`/user/connect/${username}`, {
      method: 'POST',
    });
  }

  async disconnectUser(username: string): Promise<ApiResponse<SessionResponse>> {
    return this.makeRequest<SessionResponse>(`/user/disconnect/${username}`, {
      method: 'DELETE',
    });
  }

  async getUserStatus(username: string): Promise<ApiResponse<UserStatusResponse>> {
    return this.makeRequest<UserStatusResponse>(`/user/status/${username}`);
  }
}
export const apiService = new ApiService();