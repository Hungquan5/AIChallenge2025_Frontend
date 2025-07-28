// InputPanel.tsx
import React, { useState, useEffect, useRef } from 'react';
import QueryList from './QueryList';
import { containerClass, searchButtonClass } from './styles';
import type { ResultItem, Query, SearchMode } from '../../types';
import { searchByText } from '../SearchRequest/searchApi';
import { useShortcuts } from '../../../../utils/shortcuts';

interface InputPanelProps {
  onSearch: (results: ResultItem[]) => void;
  searchMode: SearchMode;
  onSearchModeChange?: (mode: SearchMode) => void;
}

const InputPanel: React.FC<InputPanelProps> = ({ onSearch, searchMode, onSearchModeChange }) => {
  const [queries, setQueries] = useState<Query[]>([
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
    setTimeout(focusFirstTextarea, 0); // focus on first render
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
    // Tìm textarea đầu tiên trong container
    const textarea = containerRef.current?.querySelector('textarea');
    if (textarea) {
      textarea.focus();
      // Đặt con trỏ vào cuối text
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

  return (
    <div className="flex flex-col h-full" ref={containerRef}>
      <div
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
        style={{ scrollbarGutter: 'stable' }}
      >
        <QueryList 
          queries={queries} 
          onQueriesChange={setQueries}
        />
      </div>

      <div className="px-1 py-1">
        <button
          ref={searchButtonRef}
          onClick={triggerSearch}
          className={searchButtonClass + ' w-full'}
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </div>
  );
};

export default InputPanel;