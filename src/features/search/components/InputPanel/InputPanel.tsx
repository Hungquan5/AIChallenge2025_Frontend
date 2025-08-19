import React, { useState, useEffect, useRef } from 'react';
import QueryList from './QueryList';
import { searchButtonClass,containerClass } from './styles';
import type { ResultItem, Query,SearchMode,ApiQuery } from '../../types';
import { useShortcuts } from '../../../../utils/shortcuts';
import { fileToBase64 } from '../../../../utils/fileConverter';
// ✅ This is where the fix is.
interface InputPanelProps {
  onSearch: (queries: ApiQuery[], mode: SearchMode) => void;
  isAutoTranslateEnabled: boolean;
  isLoading: boolean; // This prop is passed from the parent (App.tsx)
  
  // ✅ ADD THIS LINE: Declare that this component expects this prop.
  onSingleSearchResult: (results: ResultItem[]) => void;
}

import { Search, Zap, Loader2 } from 'lucide-react'; 
import { translateText } from '../SearchRequest/searchApi';
const InputPanel = ({ 
  onSearch, 
  isAutoTranslateEnabled, 
  isLoading, 
  onSingleSearchResult 
}: InputPanelProps) => {// ✅ 2. DESTRUCTURE THE PROP
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

    // 1. Translation logic (NOW FIXED)
    const translationPromises = queries.map(async (q) => {
      // ✅ FIX: Only translate on search IF auto-translate is enabled.
      if (isAutoTranslateEnabled && q.lang === 'ori' && q.origin && !q.text && !q.imageFile) {
          try {
            const translated = await translateText(q.origin.trim());
            // Update the query with the translation for this search
            return { ...q, text: translated, lang: 'eng' as const };
          } catch (error) {
            console.error(`Translation failed:`, error);
            // If translation fails, search with the original text
            return q;
          }
      }
      // If auto-translate is off, or the query doesn't need translation, return it as is.
      return q;
  });
  const translatedQueries = await Promise.all(translationPromises);
  
  // This is an important step: update the UI to show the text that was just translated and used for the search.
  setQueries(translatedQueries);

    // 2. Prepare API queries (remains the same)
    const apiQueriesPromises = translatedQueries.map(async (q): Promise<ApiQuery> => {
        // ... (no changes in this block)
        const baseApiQuery: Omit<ApiQuery, 'text' | 'image'> = {
            asr: q.asr.trim(), ocr: q.ocr.trim(), origin: q.origin.trim(),
            obj: q.obj, lang: q.lang,
          };
          if (q.imageFile) {
            const image = await fileToBase64(q.imageFile);
            return { ...baseApiQuery, text: '', image };
          } else {
            return { ...baseApiQuery, text: q.text.trim(), image: "" };
          }
    });
    const apiQueries = await Promise.all(apiQueriesPromises);

    // 3. Validation (remains the same)
    const isSearchable = apiQueries.some(q => 
        q.text || q.asr || q.ocr || q.obj.length > 0 || q.origin || q.image
    );
    if (!isSearchable) {
      alert('Please enter a query or specify other search criteria.');
      setLoading(false);
      return;
    }
    
    // 4. ⛔️ REMOVED API CALL BLOCK
    // Instead of calling the API here, we pass the data to the parent component.
    // The parent will handle the API call, error handling, and state updates.
    onSearch(apiQueries, searchMode);

    // We can set loading to false here, or let the parent control it via a prop.
    // For simplicity, we'll let the parent handle the global loading state.
    // The loading state here is now just for the query preparation phase.
    setLoading(false);
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
  // if (queries.length < 2) {
  //   // Don't do anything if there's only one query
  //   return; 
  // }

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
  TRIGGER_CHAIN_SEARCH: async () => {

    await handleSearch('chain');
  },
  TRIGGER_SEARCH: async () => {

    await handleSearch('normal');
  },
  ADD_QUERY: addNewQuery,
  REMOVE_QUERY: removeLastQuery,
  CLEAR_SEARCH: clearAllQueries,
  FOCUS_SEARCH: focusFirstTextarea,
});
// ...
  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if (e.key === 'Enter') {
  //       e.preventDefault();
  //       searchButtonRef.current?.focus();
  //       if (debounceTimeoutRef.current !== null) {
  //         clearTimeout(debounceTimeoutRef.current);
  //       }
  //       debounceTimeoutRef.current = window.setTimeout(() => {
  //         setTimeout(() => {
  //           searchButtonRef.current?.click();
  //         }, 0);
  //       }, 400);
  //     }
  //   };

  //   window.addEventListener('keydown', handleKeyDown);
  //   return () => {
  //     window.removeEventListener('keydown', handleKeyDown);
  //     if (debounceTimeoutRef.current !== null) {
  //       clearTimeout(debounceTimeoutRef.current);
  //     }
  //   };
  // }, []);

  // ✅ 2. Update the SearchButton component to include icons
  const SearchButton = () => (
    <button
      ref={searchButtonRef}
      onClick={() => handleSearch('normal')}
      className={`${searchButtonClass} w-full `}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" />
        </>
      ) : (
        <>
          <Search className="" />
        </>
      )}
    </button>
  );
  const ChainSearchButton = () => (
    <button
      ref={chainSearchButtonRef}
      onClick={() => handleSearch('chain')}
      className={`${searchButtonClass} w-full`}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="hanimate-spin" />
        </>
      ) : (
        <>
          <Zap className="" />
        </>
      )}
    </button>
  );



  return {
    panelContent: (
      <div className={containerClass} ref={containerRef}>
        <QueryList 
          queries={queries} 
          onQueriesChange={setQueries}
          // Now that InputPanel accepts this prop, it can correctly pass it down to QueryList.
          onSingleSearchResult={onSingleSearchResult} 
          isAutoTranslateEnabled={isAutoTranslateEnabled}
        />
      </div>
    ),
    searchButton: <SearchButton />,
    chainSearchButton: <ChainSearchButton />
  };
};

export default InputPanel;