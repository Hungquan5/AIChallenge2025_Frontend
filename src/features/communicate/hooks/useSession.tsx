import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../components/Communicate/Api'; // Corrected path assumption
import type { User } from '../types';

interface UseSessionReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  createSession: (username: string) => Promise<boolean>;
  destroySession: () => Promise<boolean>; // No need to pass username, it's in state
}

export const useSession = (): UseSessionReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(async (username: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const response = await apiService.connectUser(username);

    if (response.error) {
      setError(response.error.detail);
      setIsLoading(false);
      return false;
    }

    // --- FIX: Set the user state upon successful connection ---
    const newUser = { username }; // Create a user object
    setUser(newUser);
    setIsLoading(false);
    return true;
  }, []);

  // destroySession can get the username from the state
  const destroySession = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);
    setError(null);

    const response = await apiService.disconnectUser(user.username);

    if (response.error) {
      setError(response.error.detail);
      // Still log the user out on the frontend even if backend fails
    }

    setUser(null);
    setIsLoading(false);
    return true;
  }, [user]);

  // Cleanup session on page unload
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // This is the most reliable way to handle session cleanup
      if (user?.username) {
        // --- FIX: Use a correct fetch call inside sendBeacon ---
        // sendBeacon requires a Blob, so we prepare it.
        // It automatically sends a POST request. Your backend must accept it.
        // For simplicity and reliability, it's better to make your /disconnect
        // endpoint accept POST with a body for this purpose.
        
        // As a more robust alternative to sendBeacon for DELETE:
        // You can use a synchronous fetch, but it's deprecated and may be blocked.
        // The best practice is to have a dedicated /logout endpoint that accepts POST.
        
        // For now, let's assume we call the DELETE API directly.
        // Note: This may not always complete before the page unloads.
        apiService.disconnectUser(user.username);
      }
    };

    // --- REMOVED: 'visibilitychange' is too aggressive for session cleanup ---
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user?.username]);

  return {
    user,
    isLoading,
    error,
    createSession,
    destroySession,
  };
};