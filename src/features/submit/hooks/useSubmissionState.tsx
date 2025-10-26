// src/features/submit/hooks/useSubmissionState.ts
import { useState, useCallback } from 'react';
import type { ResultItem } from '../../results/types';
import type { SubmissionStatusUpdateMessage, SubmissionResultMessage } from '../../communicate/types';
import { fullSubmissionFlow } from '../components/SubmitAPI';

interface SubmissionResult {
  itemId: string;
  submission: 'CORRECT' | 'WRONG' | 'INDETERMINATE' | 'DUPLICATE' | 'ERROR';
  description: string;
  username?: string;
}

interface UseSubmissionStateReturn {
  // State
  optimisticSubmissions: Set<string>;
  submissionStatuses: { [key: string]: string };
  submissionResult: SubmissionResult | null;

  // Setters
  setOptimisticSubmissions: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSubmissionStatuses: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  setSubmissionResult: React.Dispatch<React.SetStateAction<SubmissionResult | null>>;

  // Handlers
  handleSubmission: (item: ResultItem, user: any, sendMessage: (message: string) => void) => Promise<void>;
}

export const useSubmissionState = (): UseSubmissionStateReturn => {
  const [optimisticSubmissions, setOptimisticSubmissions] = useState<Set<string>>(new Set());
  const [submissionStatuses, setSubmissionStatuses] = useState<{ [key: string]: string }>({});
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  const handleSubmission = useCallback(async (
    item: ResultItem, 
    user: any, 
    sendMessage: (message: string) => void
  ) => {
    // 1. Optimistic Update: Immediately disable the card
    setOptimisticSubmissions(prev => new Set(prev).add(item.thumbnail));

    try {
      const result = await fullSubmissionFlow(item);

      const submissionPayload: SubmissionResult = {
        itemId: item.thumbnail,
        submission: result.submission,
        description: result.description,
        username: user?.username,
      };

      // 2. Broadcast the result to all users
      const message: SubmissionResultMessage = {
        type: 'submission_result',
        payload: submissionPayload,
      };
      sendMessage(JSON.stringify(message));

    } catch (error) {
      // Handle API errors
      const description = error instanceof Error ? error.message : 'An unknown error occurred.';
      setSubmissionResult({
        itemId: item.id,
        submission: 'ERROR',
        description: description,
        username: user?.username,
      });
    } finally {
      // 3. Cleanup: Remove from optimistic set
      setOptimisticSubmissions(prev => {
        const next = new Set(prev);
        next.delete(item.thumbnail);
        return next;
      });
    }
  }, []);

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
  };
};