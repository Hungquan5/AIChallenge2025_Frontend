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
  resultsRef: RefObject<HTMLDivElement>;
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
  const executeSearch = useCallback(async (
    queries: ApiQuery[], 
    mode: SearchMode, 
    page: number, 
    modelSelection: ModelSelection = { use_clip: true, use_siglip2: true, use_beit3: true }
  ) => {
    if (!user) return;
    
    appState.setIsLoading(true);
    try {
      const newResults = await searchByText(queries, user?.username, mode, page, PAGE_SIZE, modelSelection);
      appState.updateResultsWithGrouped(newResults);
      appState.setHasNextPage(newResults.length === PAGE_SIZE);

      resultsRef.current?.scrollTo(0, 0);
    } catch (error) {
      console.error("Search failed:", error);
      alert(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      appState.setHasNextPage(false);
    } finally {
      appState.setIsLoading(false);
    }
  }, [user, appState, resultsRef]);

  const handleInitiateSearch = useCallback((
    queries: ApiQuery[], 
    mode: SearchMode, 
    modelSelection: ModelSelection = { use_clip: true, use_siglip2: true, use_beit3: true }
  ) => {
    if (!user?.username) return;
    
    appState.setCurrentPage(1);
    appState.setLastQueries(queries);
    appState.setLastSearchMode(mode);
    appState.setLastModelSelection(modelSelection);
    executeSearch(queries, mode, 1, modelSelection);
  }, [executeSearch, user, appState]);

  const handlePageChange = useCallback((newPage: number) => {
    if (appState.lastQueries.length > 0) {
      appState.setCurrentPage(newPage);
      const modelSelection = appState.lastModelSelection || { use_clip: true, use_siglip2: true, use_beit3: true };
      executeSearch(appState.lastQueries, appState.lastSearchMode, newPage, modelSelection);
    }
  }, [appState.lastQueries, appState.lastSearchMode, appState.lastModelSelection, executeSearch, appState]);

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
    
    const modelSelection = appState.modelSelection || { use_clip: true, use_siglip2: true, use_beit3: true };

    await performSimilaritySearch(
        imageSrc, 
        cardId, 
        (newResults: ResultItem[]) => {
            handleSimilarityResults(newResults);
        },
        undefined, // onError
        (loading) => appState.setIsLoading(loading), // onLoading
        'normal', // searchMode
        1, // page
        PAGE_SIZE, // pageSize
        modelSelection
    );
  }, [handleSimilarityResults, appState]);

  return {
    executeSearch,
    handleInitiateSearch,
    handlePageChange,
    handleSingleItemSearch,
    handleSimilaritySearch,
    handleSimilarityResults,
  };
};