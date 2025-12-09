// src/features/communicate/hooks/useSession.ts

import { useState, useCallback, useEffect } from 'react';
import { apiService } from '../components/Communicate/Api';
// ✅ BEST PRACTICE: Define a simple, clear User type for the session state.
// This assumes your types.ts file will export this.
import type { User } from '../types';

interface UseSessionReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  createSession: (username: string) => Promise<boolean>;
  destroySession: () => Promise<boolean>;
}

export const useSession = (): UseSessionReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(async (username: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const response = await apiService.connectUser(username);

    if (response.error || !response.data) {
      setError(response.error?.detail || 'Failed to create session.');
      setIsLoading(false);
      return false;
    }
    
    // --- ✅ FIX: Set the user state upon successful connection ---
    // We create the user object using the provided username and any data
    // returned from the API, like a session or user ID.
    setUser({
      username: username,
      // You can add other properties from response.data if needed
      // For example: id: response.data.user_id
    });

    setIsLoading(false);
    return true;
  }, []); // The dependency array is empty, which is correct here.

  const destroySession = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);
    setError(null);

    const response = await apiService.disconnectUser(user.username);

    if (response.error) {
      setError(response.error.detail);
      // Still log the user out on the frontend even if the backend call fails.
    }

    // This correctly removes the user from the state.
    setUser(null);
    setIsLoading(false);
    return true;
  }, [user]); // This depends on the `user` state object.

  // The cleanup effect for page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // This is a "best-effort" attempt to sign out the user.
      // It's not guaranteed to complete, especially with async operations.
      if (user?.username) {
        // navigator.sendBeacon is the most reliable way for this,
        // but it requires your backend to accept a POST request.
        // For now, the direct API call is a reasonable approach.
        apiService.disconnectUser(user.username);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]); // Rerun this effect if the user logs in or out.

  return {
    user,
    isLoading,
    error,
    createSession,
    destroySession,
  };
};