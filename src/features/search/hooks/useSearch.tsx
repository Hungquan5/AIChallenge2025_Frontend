// src/features/search/hooks/useSearch.ts (HIGHLY OPTIMIZED)

import { useState, useCallback, useRef } from "react";
import type { RefObject } from "react";
import type { ApiQuery, SearchMode, ModelSelection } from '../types';
import type { ResultItem } from '../../results/types';
import { searchByText, searchBySingleQuery } from '../components/SearchRequest/searchApi'; 
import { searchBySimilarImage } from '../components/SimilaritySearch/SimilaritySearch';

const PAGE_SIZE = 100;

interface UseSearchProps {
  appState: any;
  user: any;
  resultsRef: RefObject<HTMLDivElement | null>;
  // ✅ NEW: Pass the object filter fetch function
  fetchObjectMetadata?: (results: ResultItem[]) => Promise<void>;
}

type LastSearch = {
  type: 'single' | 'multi' | 'similarity';
  context: ApiQuery | ApiQuery[] | { imageSrc: string }; 
  mode: SearchMode;
  modelSelection: ModelSelection;
};

export const useSearch = ({ appState, user, resultsRef, fetchObjectMetadata }: UseSearchProps) => {
  const {
    setIsLoading,
    setNewResults,
    setHasNextPage,
    setCurrentPage,
    modelSelection,
  } = appState;

  const [lastSearch, setLastSearch] = useState<LastSearch | null>(null);
  
  const searchAbortControllerRef = useRef<AbortController | null>(null);
const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // ✅ NEW: Track if object metadata is being fetched
  const isObjectMetadataFetchingRef = useRef(false);

  // ✅ OPTIMIZATION: Batch result updates and trigger metadata fetch
  const updateResultsAndMetadata = useCallback((results: ResultItem[]) => {
    // 1. Update results IMMEDIATELY - this is the urgent update
    setNewResults(results);
    
    // 2. Trigger metadata fetch in the background (non-blocking)
    if (fetchObjectMetadata && results.length > 0 && !isObjectMetadataFetchingRef.current) {
      isObjectMetadataFetchingRef.current = true;
      
      // Use a small delay to ensure UI updates first
      requestIdleCallback(() => {
        fetchObjectMetadata(results).finally(() => {
          isObjectMetadataFetchingRef.current = false;
        });
      }, { timeout: 100 });
    }
    
    // 3. Smooth scroll (non-blocking)
    requestAnimationFrame(() => {
      resultsRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    });
  }, [setNewResults, fetchObjectMetadata, resultsRef]);

  const handleInitiateSearch = useCallback((queries: ApiQuery[], mode: SearchMode) => {
    if (!user) return;
    
    // Cancel pending operations
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }
    
    setIsLoading(true);
    setCurrentPage(1);
    const currentModelSelection = modelSelection;
    setLastSearch({ type: 'multi', context: queries, mode, modelSelection: currentModelSelection });

    searchAbortControllerRef.current = new AbortController();

    searchByText(queries, user.username, mode, 1, PAGE_SIZE, currentModelSelection)
      .then(results => {
        // ✅ OPTIMIZED: Use the batched update function
        updateResultsAndMetadata(results);
        setHasNextPage(results.length === PAGE_SIZE);
      })
      .catch(error => {
        if (error.name === 'AbortError') {
          console.log('Search cancelled');
          return;
        }
        console.error('Multi-query search failed:', error);
        alert(`Search failed: ${error.message}`);
        setHasNextPage(false);
      })
      .finally(() => {
        setIsLoading(false);
        searchAbortControllerRef.current = null;
      });
  }, [user, setIsLoading, setCurrentPage, updateResultsAndMetadata, setHasNextPage, modelSelection]);

  const handleSingleItemSearch = useCallback((results: ResultItem[], query: ApiQuery) => {
    setCurrentPage(1);
    const currentModelSelection = modelSelection;
    setLastSearch({ type: 'single', context: query, mode: 'normal', modelSelection: currentModelSelection });
    
    // ✅ OPTIMIZED: Use the batched update function
    updateResultsAndMetadata(results);
    setHasNextPage(results.length === PAGE_SIZE);
  }, [setCurrentPage, updateResultsAndMetadata, setHasNextPage, modelSelection]);

  const handleSimilaritySearch = useCallback(async (imageSrc: string) => {
    if (!user) return;
    
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }
    
    setIsLoading(true);
    setCurrentPage(1);

    const currentModelSelection = modelSelection;
    setLastSearch({ type: 'similarity', context: { imageSrc }, mode: 'normal', modelSelection: currentModelSelection });

    searchAbortControllerRef.current = new AbortController();

    try {
      const results = await searchBySimilarImage(imageSrc, 'normal', 1, PAGE_SIZE, currentModelSelection);
      
      // ✅ OPTIMIZED: Use the batched update function
      updateResultsAndMetadata(results);
      setHasNextPage(results.length === PAGE_SIZE);
    } catch (error) {

      console.error('Similarity search failed:', error);
      alert(`Similarity search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setHasNextPage(false);
    } finally {
      setIsLoading(false);
      searchAbortControllerRef.current = null;
    }
  }, [user, modelSelection, setIsLoading, setCurrentPage, updateResultsAndMetadata, setHasNextPage]);

  const handlePageChange = useCallback(async (newPage: number) => {
    if (!user || !lastSearch) return;

    if (searchAbortControllerRef.current) {
      return; // Already loading
    }

    setIsLoading(true);
    setCurrentPage(newPage);
    
    searchAbortControllerRef.current = new AbortController();
    
    try {
      let newResults: ResultItem[] = [];
      
      switch (lastSearch.type) {
        case 'single':
          newResults = await searchBySingleQuery(
            lastSearch.context as ApiQuery, user.username, newPage, PAGE_SIZE, lastSearch.modelSelection
          );
          break;
        case 'multi':
          newResults = await searchByText(
            lastSearch.context as ApiQuery[], user.username, lastSearch.mode, newPage, PAGE_SIZE, lastSearch.modelSelection
          );
          break;
        case 'similarity':
          const { imageSrc } = lastSearch.context as { imageSrc: string };
          newResults = await searchBySimilarImage(
            imageSrc,
            lastSearch.mode,
            newPage,
            PAGE_SIZE,
            lastSearch.modelSelection
          );
          break;
      }

      // ✅ OPTIMIZED: Use the batched update function
      updateResultsAndMetadata(newResults);
      setHasNextPage(newResults.length === PAGE_SIZE);

    } catch (error) {
      console.error(`Failed to fetch page ${newPage}:`, error);
      alert(`Failed to get the next page: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setHasNextPage(false);
    } finally {
      setIsLoading(false);
      searchAbortControllerRef.current = null;
    }
  }, [user, lastSearch, setIsLoading, setCurrentPage, updateResultsAndMetadata, setHasNextPage]);

  return {
    handleInitiateSearch,
    handlePageChange,
    handleSingleItemSearch,
    handleSimilaritySearch,
  };
};

// ✅ Polyfill for requestIdleCallback (for browsers that don't support it)
const requestIdleCallback = window.requestIdleCallback || ((cb: Function, ) => {
  const start = Date.now();
  return setTimeout(() => {
    cb({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
    });
  }, 1);
});