import React, { useState, useEffect, useRef } from 'react';
import QueryList from './QueryList';
import { searchButtonClass,containerClass } from './styles';
import type { ResultItem, Query, SearchMode } from '../../types';
import { searchByText } from '../SearchRequest/searchApi';
import { useShortcuts } from '../../../../utils/shortcuts';

interface InputPanelProps {
  onSearch: (results: ResultItem[]) => void;
  searchMode: SearchMode;
  onSearchModeChange?: (mode: SearchMode) => void;
}

const InputPanel = ({ onSearch, searchMode, onSearchModeChange }: InputPanelProps) => {  const [queries, setQueries] = useState<Query[]>([
    { text: '', asr: '', ocr: '', origin: '', obj: [], lang: 'ori'},
  ]);
  const [loading, setLoading] = useState(false);
  const debounceTimeoutRef = useRef<number | null>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const queriesRef = useRef<Query[]>(queries);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    queriesRef.current = queries;
  }, [queries]);

  useEffect(() => {
    setTimeout(focusFirstTextarea, 0);
  }, []);

  const triggerSearch = async () => {
    const trimmedQueries = queries.map((q) => ({
      ...q,
      text: q.text.trim(),
      asr: q.asr.trim(),
      ocr: q.ocr.trim(),
    }));

    if (trimmedQueries.every((q) => !q.text && !q.asr && !q.ocr && !q.obj && !q.origin)) {
      alert('Please enter at least one search field');
      return;
    }

    setLoading(true);
    try {
      const results = await searchByText(trimmedQueries, searchMode);
      onSearch(results);
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const addNewQuery = () => {
    setQueries(prev => [...prev, { text: '', asr: '', ocr: '', origin: '', obj: [], lang: 'ori'}]);
  };

  const removeLastQuery = () => {
    if (queries.length > 1) {
      setQueries(prev => prev.slice(0, -1));
    }
  };

  const clearAllQueries = () => {
    setQueries([{ text: '', asr: '', ocr: '', origin: '', obj: [], lang: 'ori'}]);
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

  // Register shortcuts
  useShortcuts({
    ADD_QUERY: addNewQuery,
    REMOVE_QUERY: removeLastQuery,
    CLEAR_SEARCH: clearAllQueries,
    SWITCH_TO_NORMAL: () => onSearchModeChange?.('normal'),
    SWITCH_TO_CHAIN: () => onSearchModeChange?.('chain'),
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
      onClick={triggerSearch}
      className={searchButtonClass + ' w-full'}
      disabled={loading}
    >
      {loading ? 'Searching...' : 'Search'}
    </button>
  );

  return {
    // Return both the panel content and search button separately
    panelContent: (
      <div className={containerClass} ref={containerRef}>
        <QueryList 
          queries={queries} 
          onQueriesChange={setQueries}
        />
      </div>
    ),
    searchButton: <SearchButton />
  };
};

export default InputPanel;