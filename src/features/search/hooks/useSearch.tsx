// src/features/search/hooks/useSearch.ts

import { useCallback} from 'react';
import type { RefObject } from 'react';
import type { ApiQuery, SearchMode, ModelSelection } from '../types';
import type { ResultItem } from '../../results/types';
import { searchByText } from '../components/SearchRequest/searchApi';
import { performSimilaritySearch } from '../components/SimilaritySearch/SimilaritySearch';

const PAGE_SIZE = 100;

interface UseSearchProps {
  appState: any;
  user: any;
  resultsRef: RefObject<HTMLDivElement|null>;
}

interface UseSearchReturn {
  executeSearch: (queries: ApiQuery[], mode: SearchMode, page: number, modelSelection?: ModelSelection) => Promise<void>;
  handleInitiateSearch: (queries: ApiQuery[], mode: SearchMode, modelSelection?: ModelSelection) => void;
  handlePageChange: (newPage: number) => void;
  handleSingleItemSearch: (newResults: ResultItem[]) => void;
  handleSimilaritySearch: (imageSrc: string, cardId: string) => Promise<void>;
  handleSimilarityResults: (newResults: ResultItem[]) => void;
}

export const useSearch = ({ appState, user, resultsRef }: UseSearchProps): UseSearchReturn => {
  // Destructure the specific functions and values you need from appState
  const { 
    setIsLoading, 
    updateResultsWithGrouped, 
    setHasNextPage, 
    setCurrentPage, 
    setLastQueries, 
    setLastSearchMode, 
    setLastModelSelection,
    lastQueries,
    lastSearchMode,
    lastModelSelection,
    modelSelection
  } = appState;

  const executeSearch = useCallback(async (
    queries: ApiQuery[], 
    mode: SearchMode, 
    page: number, 
    currentModelSelection: ModelSelection = { use_clip: true, use_siglip2: true, use_beit3: true }
  ) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const newResults = await searchByText(queries, user?.username, mode, page, PAGE_SIZE, currentModelSelection);
      updateResultsWithGrouped(newResults);
      setHasNextPage(newResults.length === PAGE_SIZE);

      resultsRef.current?.scrollTo(0, 0);
    } catch (error) {
      console.error("Search failed:", error);
      alert(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setHasNextPage(false);
    } finally {
      setIsLoading(false);
    }
    // ✅ FIX: Use granular dependencies. These functions are stable from useAppState.
  }, [user, resultsRef, setIsLoading, updateResultsWithGrouped, setHasNextPage]);

  const handleInitiateSearch = useCallback((
    queries: ApiQuery[], 
    mode: SearchMode, 
    currentModelSelection: ModelSelection = { use_clip: true, use_siglip2: true, use_beit3: true }
  ) => {
    if (!user?.username) return;
    
    setCurrentPage(1);
    setLastQueries(queries);
    setLastSearchMode(mode);
    setLastModelSelection(currentModelSelection);
    executeSearch(queries, mode, 1, currentModelSelection);
    // ✅ FIX: Use granular dependencies
  }, [executeSearch, user, setCurrentPage, setLastQueries, setLastSearchMode, setLastModelSelection]);

  const handlePageChange = useCallback((newPage: number) => {
    if (lastQueries.length > 0) {
      setCurrentPage(newPage);
      const currentModelSelection = lastModelSelection || { use_clip: true, use_siglip2: true, use_beit3: true };
      executeSearch(lastQueries, lastSearchMode, newPage, currentModelSelection);
    }
    // ✅ FIX: Use granular dependencies
  }, [lastQueries, lastSearchMode, lastModelSelection, executeSearch, setCurrentPage]);

  const handleSingleItemSearch = useCallback((newResults: ResultItem[]) => {
    updateResultsWithGrouped(newResults);
    setHasNextPage(false);
    setCurrentPage(1);
    resultsRef.current?.scrollTo(0, 0);
    // ✅ FIX: Use granular dependencies
  }, [resultsRef, updateResultsWithGrouped, setHasNextPage, setCurrentPage]);


  const handleSimilaritySearch = useCallback(async (imageSrc: string, cardId: string) => {
    console.log(`Starting similarity search for card: ${cardId} with image: ${imageSrc}`);
    
    const currentModelSelection = modelSelection || { use_clip: true, use_siglip2: true, use_beit3: true };

    await performSimilaritySearch(
        imageSrc, 
        cardId, 
        (newResults: ResultItem[]) => {
            // Assuming handleSimilarityResults is stable or also fixed
            handleSimilarityResults(newResults);
        },
        undefined,
        (loading) => setIsLoading(loading),
        'normal',
        1,
        PAGE_SIZE,
        currentModelSelection
    );
    // ✅ FIX: Use granular dependencies
  }, [modelSelection, setIsLoading]);

  // handleSimilarityResults already had granular dependencies, which is good.
  const handleSimilarityResults = useCallback((newResults: ResultItem[]) => {
    updateResultsWithGrouped(newResults);
    resultsRef.current?.scrollTo(0, 0);
  }, [resultsRef, updateResultsWithGrouped]);

  return {
    executeSearch,
    handleInitiateSearch,
    handlePageChange,
    handleSingleItemSearch,
    handleSimilaritySearch,
    handleSimilarityResults,
  };
};