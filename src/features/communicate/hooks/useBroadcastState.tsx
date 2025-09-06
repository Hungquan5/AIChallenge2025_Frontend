// src/features/communicate/hooks/useBroadcastState.ts
import { useState, useCallback, useMemo } from 'react';
import type { ResultItem } from '../../results/types';

interface UseBroadcastStateReturn {
  // State
  broadcastMessages: ResultItem[];
  activeUsers: number;
  vqaQuestions: { [key: string]: string };
  isTrackModeActive: boolean;

  // Setters
  setBroadcastMessages: React.Dispatch<React.SetStateAction<ResultItem[]>>;
  setActiveUsers: React.Dispatch<React.SetStateAction<number>>;
  setVqaQuestions: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  setIsTrackModeActive: React.Dispatch<React.SetStateAction<boolean>>;

  // Handlers
  handleVqaQuestionChange: (itemId: string, question: string) => void;
  handleVqaSubmit: (item: ResultItem, question: string) => void;
  handleToggleTrackMode: () => void;
  handleRemoveBroadcastMessage: (messageId: string, index: number) => void;
  handleClearBroadcastFeed: () => void;
  handleAddBroadcastMessage: (message: ResultItem) => void;
}

export const useBroadcastState = (): UseBroadcastStateReturn => {
  const [broadcastMessages, setBroadcastMessages] = useState<ResultItem[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [vqaQuestions, setVqaQuestions] = useState<{ [key: string]: string }>({});
  const [isTrackModeActive, setIsTrackModeActive] = useState(false);

  // VQA Handlers - Made more stable with better dependencies
  const handleVqaQuestionChange = useCallback((itemId: string, question: string) => {
    setVqaQuestions(prev => ({
      ...prev,
      [itemId]: question,
    }));
  }, []); // No dependencies needed as it only uses the setter

  const handleVqaSubmit = useCallback((item: ResultItem, question: string) => {
    if (!question.trim()) {
      console.warn('VQA question is empty.');
      return;
    }
    
    console.log('Submitting VQA:', {
      videoId: item.videoId,
      frameId: item.timestamp,
      question: question.trim(),
    });
    
    // Clear the input field after submission
    setVqaQuestions(prev => ({
      ...prev,
      [item.id]: '',
    }));
  }, []); // No dependencies needed

  // Track Mode Handler
  const handleToggleTrackMode = useCallback(() => {
    setIsTrackModeActive(prev => !prev);
  }, []);

  // Broadcast Message Handlers
  const handleRemoveBroadcastMessage = useCallback((messageId: string, index: number) => {
    setBroadcastMessages(prevMessages =>
      prevMessages.filter((_, i) => i !== index)
    );
  }, []);

  const handleClearBroadcastFeed = useCallback(() => {
    setBroadcastMessages([]);
    setVqaQuestions({}); // Also clear VQA questions when clearing feed
  }, []);

  const handleAddBroadcastMessage = useCallback((newMessage: ResultItem) => {
    setBroadcastMessages(prevMessages => {
      // Prevent adding duplicate messages based on a more robust check
      const isDuplicate = prevMessages.some(msg => 
        msg.id === newMessage.id || 
        (msg.videoId === newMessage.videoId && 
         msg.timestamp === newMessage.timestamp &&
         msg.submittedBy === newMessage.submittedBy)
      );
      
      if (isDuplicate) {
        console.log('Duplicate message detected, skipping:', newMessage.id);
        return prevMessages;
      }
      
      // Keep only the latest 20 messages for performance
      return [newMessage, ...prevMessages.slice(0,)];
    });
  }, []);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    // State
    broadcastMessages,
    activeUsers,
    vqaQuestions,
    isTrackModeActive,

    // Setters (these are always stable)
    setBroadcastMessages,
    setActiveUsers,
    setVqaQuestions,
    setIsTrackModeActive,

    // Handlers (these are memoized with useCallback)
    handleVqaQuestionChange,
    handleVqaSubmit,
    handleToggleTrackMode,
    handleRemoveBroadcastMessage,
    handleClearBroadcastFeed,
    handleAddBroadcastMessage,
  }), [
    // Dependencies - only include values that actually change the behavior
    broadcastMessages,
    activeUsers,
    vqaQuestions,
    isTrackModeActive,
    // Note: Handlers are stable due to useCallback, so they don't need to be dependencies
    handleVqaQuestionChange,
    handleVqaSubmit,
    handleToggleTrackMode,
    handleRemoveBroadcastMessage,
    handleClearBroadcastFeed,
    handleAddBroadcastMessage,
  ]);
};