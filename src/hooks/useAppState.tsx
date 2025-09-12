// src/hooks/useAppState.ts
import { useState, useCallback } from 'react';
import type { ResultItem, GroupedResult, ViewMode } from '../features/results/types';
import type { ApiQuery, SearchMode } from '../features/search/types';
import { mockResults, mockGroupedResults } from '../utils/mockData';
import type { ModelSelection } from '../features/search/types';
interface UseAppStateReturn {
  // State
  results: ResultItem[];
  groupedResults: GroupedResult[];
  viewMode: ViewMode;
  currentPage: number;
  hasNextPage: boolean;
  isLoading: boolean;
  lastQueries: ApiQuery[];
  lastSearchMode: SearchMode;
  isAutoTranslateEnabled: boolean;
  currentVideoTitle: string;
  // ✅ ADD: Model selection state
  lastModelSelection: ModelSelection;
  modelSelection: ModelSelection;

  // Setters
  setResults: React.Dispatch<React.SetStateAction<ResultItem[]>>;
  setGroupedResults: React.Dispatch<React.SetStateAction<GroupedResult[]>>;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setHasNextPage: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setLastQueries: React.Dispatch<React.SetStateAction<ApiQuery[]>>;
  setLastSearchMode: React.Dispatch<React.SetStateAction<SearchMode>>;
  setIsAutoTranslateEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentVideoTitle: React.Dispatch<React.SetStateAction<string>>;
  // ✅ ADD: Model selection setters
  setLastModelSelection: React.Dispatch<React.SetStateAction<ModelSelection>>;
  setModelSelection: React.Dispatch<React.SetStateAction<ModelSelection>>;

  // Helper methods
  toggleViewMode: () => void;
  toggleAutoTranslate: () => void;
  updateResultsWithGrouped: (newResults: ResultItem[]) => void;
}

export const useAppState = (): UseAppStateReturn => {
  // Search Results & View State
  const [results, setResults] = useState<ResultItem[]>(mockResults);
  const [groupedResults, setGroupedResults] = useState<GroupedResult[]>(mockGroupedResults);
  const [viewMode, setViewMode] = useState<ViewMode>('sortByConfidence');
  // Update src/hooks/useAppState.ts (add these to your existing hook)
// In your useAppState hook, add:
const [lastModelSelection, setLastModelSelection] = useState<ModelSelection>({
  use_clip: true,
  use_siglip2: true, 
  use_beit3: true
});

const [modelSelection, setModelSelection] = useState<ModelSelection>({
  use_clip: true,
  use_siglip2: true,
  use_beit3: true,
});
  // Pagination & Search Context State
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [lastQueries, setLastQueries] = useState<ApiQuery[]>([]);
  const [lastSearchMode, setLastSearchMode] = useState<SearchMode>('normal');
  
  // UI State
  const [isAutoTranslateEnabled, setIsAutoTranslateEnabled] = useState(true);
  const [currentVideoTitle, setCurrentVideoTitle] = useState('');

  // Helper methods
  const toggleViewMode = useCallback(() => {
    setViewMode(prev => prev === 'sortByConfidence' ? 'groupByVideo' : 'sortByConfidence');
  }, []);

  const toggleAutoTranslate = useCallback(() => {
    setIsAutoTranslateEnabled(prev => !prev);
  }, []);

  const updateResultsWithGrouped = useCallback((newResults: ResultItem[]) => {
    setResults(newResults);
    
    // Group results
    const grouped = newResults.reduce((acc, item) => {
      const group = acc.find(g => g.videoId === item.videoId);
      if (group) {
        group.items.push(item);
      } else {
        acc.push({ 
          videoId: item.videoId, 
          videoTitle: item.title, 
          items: [item] 
        });
      }
      return acc;
    }, [] as GroupedResult[]);
    
    setGroupedResults(grouped);
  }, []);

  return {
    // State
    results,
    groupedResults,
    viewMode,
    currentPage,
    hasNextPage,
    isLoading,
    lastQueries,
    lastSearchMode,
    isAutoTranslateEnabled,
    currentVideoTitle,
lastModelSelection,
setLastModelSelection,
modelSelection,
setModelSelection,

    // Setters
    setResults,
    setGroupedResults,
    setViewMode,
    setCurrentPage,
    setHasNextPage,
    setIsLoading,
    setLastQueries,
    setLastSearchMode,
    setIsAutoTranslateEnabled,
    setCurrentVideoTitle,

    // Helper methods
    toggleViewMode,
    toggleAutoTranslate,
    updateResultsWithGrouped,
  };
};