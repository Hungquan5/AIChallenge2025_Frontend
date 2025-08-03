import React, { useState, useEffect, useRef } from 'react';
import QueryList from './QueryList';
import { searchButtonClass,containerClass } from './styles';
import type { ResultItem, Query,SearchMode,ApiQuery } from '../../types';
import { searchByText } from '../SearchRequest/searchApi';
import { useShortcuts } from '../../../../utils/shortcuts';
import { fileToBase64 } from '../../../../utils/fileConverter';
interface InputPanelProps {
  onSearch: (results: ResultItem[]) => void;
}
import { translateText } from '../SearchRequest/searchApi';

const InputPanel = ({ onSearch }: InputPanelProps) => {
  const [queries, setQueries] = useState<Query[]>([
    // The initial query no longer has a 'mode' field
    { text: '', asr: '', ocr: '', origin: '', obj: [], lang: 'ori', imageFile: null },
  ]);
  const [loading, setLoading] = useState(false);
  const debounceTimeoutRef = useRef<number | null>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const chainSearchButtonRef = useRef<HTMLButtonElement>(null);
  const queriesRef = useRef<Query[]>(queries);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    queriesRef.current = queries;
  }, [queries]);

  useEffect(() => {
    setTimeout(focusFirstTextarea, 0);
  }, []);

const handleSearch = async (searchMode: SearchMode = 'normal') => {

    setLoading(true);  
    
  // 2. Prepare the payload for the API by inferring query type
  const apiQueriesPromises = queries.map(async (q): Promise<ApiQuery> => {
    
      // Base query with shared fields
      const baseApiQuery: Omit<ApiQuery, 'text' | 'image'> = {
        asr: q.asr.trim(),
        ocr: q.ocr.trim(),
        origin: q.origin.trim(),
        obj: q.obj,
        lang: q.lang,
      };

      // INFERENCE LOGIC: If an imageFile exists, it's an image query.
      // Otherwise, it's a text query.
      if (q.imageFile) {
        let image: string | undefined = "";
        try {
          image = await fileToBase64(q.imageFile);
        } catch (error) {
          console.error(`Failed to convert imageFile to base64:`, error);
          // Handle error appropriately, maybe skip this query or show a message
        }
        return {
          ...baseApiQuery,
          text: '', // Ensure text is empty for image queries
          image: image,
        };
      } else {
        // This is a text-based query
        return {
          ...baseApiQuery,
          text: q.text.trim(),
          image: "", // Ensure image is undefined
        };
      }
    });


  const apiQueries = await Promise.all(apiQueriesPromises);
  console.log('All API queries:', apiQueries);

  // 3. Validate content
  const isSearchable = apiQueries.some(q => 
      q.text || q.asr || q.ocr || q.obj.length > 0 || q.origin || q.image
  );

  if (!isSearchable) {
    alert('Please enter a query, upload an image, or specify other search criteria.');
    setLoading(false);
    return;
  }
  
  console.log('Final payload being sent:', apiQueries);
  
  try {
    const results = await searchByText(apiQueries, searchMode);
    onSearch(results);
  } catch (error) {
    const action = searchMode === 'chain' ? 'Chain search' : 'Search';
    console.error(`${action} error:`, error);
    alert(`${action} failed: ` + (error instanceof Error ? error.message : 'Unknown error'));
  } finally {
    setLoading(false);
  }
};
  const addNewQuery = () => {
    // Add new query without 'mode'
    setQueries(prev => [...prev, { text: '', asr: '', ocr: '', origin: '', obj: [], lang: 'ori', imageFile: null }]);
  };
  const removeLastQuery = () => {
    if (queries.length > 1) {
      setQueries(prev => prev.slice(0, -1));
    }
  };
 const clearAllQueries = () => {
    // Clear queries without 'mode'
    setQueries([{ text: '', asr: '', ocr: '', origin: '', obj: [], lang: 'ori', imageFile: null }]);
    setTimeout(focusFirstTextarea, 0);
  };
  
  const focusFirstTextarea = () => {
    const textarea = containerRef.current?.querySelector('textarea');
    if (textarea) {
      textarea.focus();
      const length = textarea.value.length;
      textarea.setSelectionRange(length, length);
    }
  };
  // ✅ ADD THIS ENTIRE HANDLER FUNCTION
const handleTranslateAll = async () => {
  if (queries.length < 2) {
    // Don't do anything if there's only one query
    return; 
  }

  setLoading(true);

  try {
    const translationPromises = queries.map(q => {
      // Only translate original-language queries that have text content
      if (q.lang === 'ori' && q.origin && !q.imageFile) {
        return translateText(q.origin.trim()).then(translated => ({
          ...q,
          text: translated,
          lang: 'eng' as const, // Ensure the type is 'eng'
        }));
      }
      // For all other cases, return the query unmodified
      return Promise.resolve(q);
    });

    const translatedQueries = await Promise.all(translationPromises);
    setQueries(translatedQueries);

  } catch (error) {
    console.error('Failed to translate all queries:', error);
    alert('An error occurred during the bulk translation.');
  } finally {
    setLoading(false);
  }
};

  // Register shortcuts
 // Register shortcuts
 useShortcuts({
  TRANSLATE_ALL_QUERIES: handleTranslateAll, // ✅ ADD THIS LINE
  TRIGGER_CHAIN_SEARCH: () => {
    if (chainSearchButtonRef.current) {
      chainSearchButtonRef.current.click();
    } 
  },
  ADD_QUERY: addNewQuery,
  REMOVE_QUERY: removeLastQuery,
  CLEAR_SEARCH: clearAllQueries,
  FOCUS_SEARCH: focusFirstTextarea,
});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        searchButtonRef.current?.focus();
        if (debounceTimeoutRef.current !== null) {
          clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = window.setTimeout(() => {
          setTimeout(() => {
            searchButtonRef.current?.click();
          }, 0);
        }, 400);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (debounceTimeoutRef.current !== null) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Create search button component
  const SearchButton = () => (
    <button
      ref={searchButtonRef}
      onClick={() => handleSearch('normal')}
      className={searchButtonClass + ' w-full'}
      disabled={loading}
    >
      {loading ? 'Searching...' : 'Search'}
    </button>
  );
    const ChainSearchButton = () => (
    <button
      ref={chainSearchButtonRef}
      onClick={() => handleSearch('chain')}
      className={searchButtonClass + ' w-full'}
      disabled={loading}
    >
      {loading ? 'Chaining...' : 'Chain Search'}
    </button>
  );

    return {
    panelContent: (
      <div className={containerClass} ref={containerRef}>
        <QueryList 
          queries={queries} 
          onQueriesChange={setQueries}
        />
      </div>
    ),
    searchButton: <SearchButton />,
    chainSearchButton: <ChainSearchButton /> // ✅ CORRECT KEY
  };

};

export default InputPanel;