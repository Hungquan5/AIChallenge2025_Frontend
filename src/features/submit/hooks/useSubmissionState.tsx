import { useState, useCallback } from 'react';
import type { ResultItem } from '../../results/types';
// ✅ FIX 1/5: Import the new SubmissionStatus type
import type { SubmissionResultMessage, SubmissionStatus } from '../../communicate/types';
import { fullSubmissionFlow } from '../components/SubmitAPI';

interface SubmissionResult {
  itemId: string;
  submission: 'CORRECT' | 'WRONG' | 'INDETERMINATE' | 'DUPLICATE' | 'ERROR';
  description: string;
  username?: string;
}

interface UseSubmissionStateReturn {
  // State
  optimisticSubmissions: Map<string, string>;
  // ✅ FIX 2/5: Update the type for the submissionStatuses state to use the new object
  submissionStatuses: { [key: string]: SubmissionStatus };
  submissionResult: SubmissionResult | null;

  // Setters
  setOptimisticSubmissions: React.Dispatch<React.SetStateAction<Map<string, string>>>;
  // ✅ FIX 3/5: Update the setter's type signature accordingly
  setSubmissionStatuses: React.Dispatch<React.SetStateAction<{ [key: string]: SubmissionStatus }>>;
  setSubmissionResult: React.Dispatch<React.SetStateAction<SubmissionResult | null>>;

  // Handlers
  handleSubmission: (item: ResultItem, user: any, sendMessage: (message: string) => void) => Promise<void>;
  // ✅ ADDED: A handler for optimistic pending state, used by both submission and broadcast
  handleOptimisticPending: (item: ResultItem, user: any) => void;
}

export const useSubmissionState = (): UseSubmissionStateReturn => {
  const [optimisticSubmissions, setOptimisticSubmissions] = useState<Map<string, string>>(new Map());
  // ✅ FIX 4/5: Update the state's type definition here to store the richer object
  const [submissionStatuses, setSubmissionStatuses] = useState<{ [key: string]: SubmissionStatus }>({});
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  
  // ✅ ADDED: New callback to just set the pending state locally and instantly.
  const handleOptimisticPending = useCallback((item: ResultItem, user: any) => {
    // This provides immediate UI feedback for any action that results in a pending submission.
    setOptimisticSubmissions(prev => new Map(prev).set(item.thumbnail, user?.username || ''));
  }, []);

  const handleSubmission = useCallback(async (
    item: ResultItem,
    user: any,
    sendMessage: (message: string) => void
  ) => {
    // 1. Optimistic Update: Use the shared helper for an instant UI change.
    handleOptimisticPending(item, user);

    try {
      const result = await fullSubmissionFlow(item);

      const submissionPayload: SubmissionResult = {
        itemId: item.thumbnail,
        submission: result.submission,
        description: result.description,
        username: user?.username,
      };

      const message: SubmissionResultMessage = {
        type: 'submission_result',
        payload: submissionPayload,
      };
      sendMessage(JSON.stringify(message));

    } catch (error) {
      const description = error instanceof Error ? error.message : 'An unknown error occurred.';
      setSubmissionResult({
        itemId: item.id,
        submission: 'ERROR',
        description: description,
        username: user?.username,
      });
    } finally {
      // 3. Cleanup: Remove from the optimistic set. The final state will be
      // set by the 'submission_status_update' message from the WebSocket.
      setOptimisticSubmissions(prev => {
        const next = new Map(prev);
        next.delete(item.thumbnail);
        return next;
      });
    }
  }, [handleOptimisticPending]); // Add dependency

  return {
    // State
    optimisticSubmissions,
    submissionStatuses,
    submissionResult,

    // Setters
    setOptimisticSubmissions,
    setSubmissionStatuses,
    setSubmissionResult,

    // Handlers
    handleSubmission,
    // ✅ FIX 5/5: Export the new handler so other parts of the app can use it
    handleOptimisticPending,
  };
};