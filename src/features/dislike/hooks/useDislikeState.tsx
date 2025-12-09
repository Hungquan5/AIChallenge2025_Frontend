// src/features/dislike/hooks/useDislikeState.ts
import { useState, useCallback } from 'react';
import type { ResultItem } from '../../results/types';
import { dislikeCluster, undislikeCluster } from '../dislikeApi';

interface UseDislikeStateReturn {
  // State
  dislikedItems: ResultItem[];
  
  // Setters
  setDislikedItems: React.Dispatch<React.SetStateAction<ResultItem[]>>;

  // Handlers
  handleDislike: (item: ResultItem, user: any, isDislikePanelOpen: boolean, setIsDislikePanelOpen: (open: boolean) => void) => Promise<void>;
  handleUndislike: (item: ResultItem, user: any) => Promise<void>;
  handleClearDislikes: (user: any) => Promise<void>;
}

export const useDislikeState = (): UseDislikeStateReturn => {
  const [dislikedItems, setDislikedItems] = useState<ResultItem[]>([]);

  const handleDislike = useCallback(async (
    item: ResultItem, 
    user: any, 
    isDislikePanelOpen: boolean, 
    setIsDislikePanelOpen: (open: boolean) => void
  ) => {
    if (!user) {
      console.warn('Cannot dislike: User is not logged in.');
      return;
    }

    // Prevent adding duplicates to the panel UI
    if (dislikedItems.some(d => d.id === item.id)) {
      console.log('Item is already in the dislike panel.');
      return;
    }

    try {
      const response = await dislikeCluster(item, user.username);
      console.log('Dislike successful:', response.message);
      
      // Add the item to local state for the panel
      setDislikedItems(prev => [item, ...prev]);

      // Open the panel automatically if it's closed
      if (!isDislikePanelOpen) {
        setIsDislikePanelOpen(true);
      }
    } catch (error) {
      console.error('Failed to dislike cluster:', error);
      alert(`Dislike failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [dislikedItems]);

  const handleUndislike = useCallback(async (itemToRemove: ResultItem, user: any) => {
    if (!user) return;
    
    try {
      await undislikeCluster(itemToRemove, user.username);
      setDislikedItems(prev => prev.filter(item => item.id !== itemToRemove.id));
    } catch (error) {
      console.error('Failed to un-dislike item:', error);
      alert(`Could not remove dislike: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const handleClearDislikes = useCallback(async (user: any) => {
    if (!user || dislikedItems.length === 0) return;
    
    try {
      // Call the API for all items in parallel
      await Promise.all(
        dislikedItems.map(item => undislikeCluster(item, user.username))
      );
      // Clear the state once all API calls succeed
      setDislikedItems([]);
    } catch (error) {
      console.error('Failed to clear all dislikes:', error);
      alert(`Could not clear dislikes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [dislikedItems]);

  return {
    // State
    dislikedItems,
    
    // Setters
    setDislikedItems,

    // Handlers
    handleDislike,
    handleUndislike,
    handleClearDislikes,
  };
};