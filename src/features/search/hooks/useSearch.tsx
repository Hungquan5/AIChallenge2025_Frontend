// src/features/search/hooks/useSearch.ts
import { useCallback} from 'react';
import type { RefObject } from 'react';
import type { ApiQuery, SearchMode } from '../types';
import type { ResultItem } from '../../results/types';
import { searchByText } from '../components/SearchRequest/searchApi';
import { performSimilaritySearch } from '../components/SimilaritySearch/SimilaritySearch';

const PAGE_SIZE = 100;

interface UseSearchProps {
  appState: any; // You can make this more specific with the actual type
  user: any;
  resultsRef: RefObject<HTMLDivElement>;
}

interface UseSearchReturn {
  executeSearch: (queries: ApiQuery[], mode: SearchMode, page: number) => Promise<void>;
  handleInitiateSearch: (queries: ApiQuery[], mode: SearchMode) => void;
  handlePageChange: (newPage: number) => void;
  handleSingleItemSearch: (newResults: ResultItem[]) => void;
  handleSimilaritySearch: (imageSrc: string, cardId: string) => Promise<void>;
  handleSimilarityResults: (newResults: ResultItem[]) => void;
}

export const useSearch = ({ appState, user, resultsRef }: UseSearchProps): UseSearchReturn => {
  const executeSearch = useCallback(async (queries: ApiQuery[], mode: SearchMode, page: number) => {
    if (!user) return;
    
    appState.setIsLoading(true);
    try {
      const newResults = await searchByText(queries, user?.username, mode, page, PAGE_SIZE);
      appState.updateResultsWithGrouped(newResults);
      appState.setHasNextPage(newResults.length === PAGE_SIZE);

      // Scroll to top of results view
      resultsRef.current?.scrollTo(0, 0);
    } catch (error) {
      console.error("Search failed:", error);
      alert(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      appState.setHasNextPage(false);
    } finally {
      appState.setIsLoading(false);
    }
  }, [user, appState, resultsRef]);

  const handleInitiateSearch = useCallback((queries: ApiQuery[], mode: SearchMode) => {
    if (!user?.username) return;
    
    appState.setCurrentPage(1);
    appState.setLastQueries(queries);
    appState.setLastSearchMode(mode);
    executeSearch(queries, mode, 1);
  }, [executeSearch, user, appState]);

  const handlePageChange = useCallback((newPage: number) => {
    if (appState.lastQueries.length > 0) {
      appState.setCurrentPage(newPage);
      executeSearch(appState.lastQueries, appState.lastSearchMode, newPage);
    }
  }, [appState.lastQueries, appState.lastSearchMode, executeSearch, appState]);

  const handleSingleItemSearch = useCallback((newResults: ResultItem[]) => {
    appState.updateResultsWithGrouped(newResults);
    appState.setHasNextPage(false);
    appState.setCurrentPage(1);
    resultsRef.current?.scrollTo(0, 0);
  }, [appState, resultsRef]);

  const handleSimilarityResults = useCallback((newResults: ResultItem[]) => {
    appState.updateResultsWithGrouped(newResults);
    resultsRef.current?.scrollTo(0, 0);
  }, [appState, resultsRef]);

  const handleSimilaritySearch = useCallback(async (imageSrc: string, cardId: string) => {
    console.log(`Starting similarity search for card: ${cardId} with image: ${imageSrc}`);
    
    await performSimilaritySearch(imageSrc, cardId, (newResults: ResultItem[]) => {
      handleSimilarityResults(newResults);
    });
  }, [handleSimilarityResults]);

  return {
    executeSearch,
    handleInitiateSearch,
    handlePageChange,
    handleSingleItemSearch,
    handleSimilaritySearch,
    handleSimilarityResults,
  };
};