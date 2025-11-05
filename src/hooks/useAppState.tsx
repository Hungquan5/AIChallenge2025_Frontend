// src/hooks/useAppState.ts
import { useState, useCallback, useTransition } from 'react';
import type { ResultItem, ViewMode } from '../features/results/types';
import type {  ModelSelection } from '../features/search/types';
import { mockResults } from '../utils/mockData';
import { mockGroupedResults } from '../utils/mockData';
// ✅ DEFINE: This is the efficient object structure for grouped results.
// It's much faster to create and look up than an array of groups.
export type GroupedResultsObject = { [videoId: string]: ResultItem[] };

interface UseAppStateReturn {
  // --- State ---
  results: ResultItem[];
  groupedResults: GroupedResultsObject; // It now returns the object structure
  viewMode: ViewMode;
  currentPage: number;
  hasNextPage: boolean;
  isLoading: boolean;
  isAutoTranslateEnabled: boolean;
  currentVideoTitle: string;
  modelSelection: ModelSelection;

  // --- Setters (Limited for safety) ---
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setHasNextPage: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAutoTranslateEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentVideoTitle: React.Dispatch<React.SetStateAction<string>>;
  setModelSelection: React.Dispatch<React.SetStateAction<ModelSelection>>;

  // --- Helper Methods ---
  toggleViewMode: () => void;
  toggleAutoTranslate: () => void;
  // ✅ THE ONLY WAY to update results now. This is the core of the fix.
  setNewResults: (newResults: ResultItem[]) => void;
}

export const useAppState = (): UseAppStateReturn => {
  // --- State Definitions ---
  
  // Search Results & View State
  // ✅ Your initial state will now match the mock data structure perfectly.
  const [results, setResults] = useState<ResultItem[]>(mockResults);
  const [groupedResults, setGroupedResults] = useState<GroupedResultsObject>(mockGroupedResults);
  
  const [viewMode, setViewMode] = useState<ViewMode>('sortByConfidence');
  
  // Model Selection State
  const [modelSelection, setModelSelection] = useState<ModelSelection>({
    use_clip: true,
    use_siglip2: true,
    use_beit3: true,
  });
    // ✅ NEW: Introduce a transition for non-urgent updates.
  // isPending will be true while the background calculation is running.
  const [isProcessing, startTransition] = useTransition();
  // Pagination & Loading State
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  // UI State
  const [isAutoTranslateEnabled, setIsAutoTranslateEnabled] = useState(true);
  const [currentVideoTitle, setCurrentVideoTitle] = useState('');

  // --- Helper Methods ---

  const toggleViewMode = useCallback(() => {
    setViewMode(prev => prev === 'sortByConfidence' ? 'groupByVideo' : 'sortByConfidence');
  }, []);

  const toggleAutoTranslate = useCallback(() => {
    setIsAutoTranslateEnabled(prev => !prev);
  }, []);

  // ✅ THE FIX: This is now the single, reliable function for updating results.
  // It guarantees that the grouped data is always in sync with the flat list.
  // ✅ THE FIX: This function now splits its work into urgent and non-urgent parts.
  const setNewResults = useCallback((newResults: ResultItem[]) => {
    // 1. URGENT: Update the primary flat list immediately.
    // This will cause the component to re-render instantly with the new results.
    setResults(newResults);
    
    // 2. NON-URGENT (Transition): Defer the expensive grouping calculation.
    startTransition(() => {
      // This code will run without blocking the UI.
      // The UI will remain responsive while this is calculated.
      const grouped = newResults.reduce((acc, item) => {
        const { videoId } = item;
        if (!acc[videoId]) {
          acc[videoId] = [];
        }
        acc[videoId].push(item);
        return acc;
      }, {} as GroupedResultsObject);
      
      // Update the grouped results state once the calculation is done.
      setGroupedResults(grouped);
    });
  }, []); // The function itself is stable.
  return {
    // --- State ---
    results,
    groupedResults,
    viewMode,
    currentPage,
    hasNextPage,
    isLoading: isLoading || isProcessing, 
    isAutoTranslateEnabled,
    currentVideoTitle,
    modelSelection,

    // --- Safe Setters ---
    setViewMode,
    setCurrentPage,
    setHasNextPage,
    setIsLoading,
    setIsAutoTranslateEnabled,
    setCurrentVideoTitle,
    setModelSelection,

    // --- Helper Methods ---
    toggleViewMode,
    toggleAutoTranslate,
    setNewResults, // ✅ We export our new, safe function.
    
    // ❌ We no longer export the raw `setResults` or `setGroupedResults`.
    // This prevents other parts of the app from calling them and causing a de-sync.
  };
};