import React, { useState, useEffect, useRef } from 'react';
import QueryList from './QueryList';
import { searchButtonClass, containerClass } from './styles';
import type { ResultItem, Query, SearchMode, ApiQuery, HistoryItem} from '../../types';
import type { User } from '../../../communicate/types';
import { useShortcuts } from '../../../../utils/shortcuts';
import { fileToBase64 } from '../../../../utils/fileConverter';
import { translateText, getHistory } from '../SearchRequest/searchApi';
import HistoryPanel from '../../../history/components/HistoryPanel';
import { Search, Zap, Loader2 } from 'lucide-react';
import type { ModelSelection } from '../../types';
import ModelSelectionPanel from '../ModelSelection/ModelSelection';
// ============================================================================
// === 1. PROPS INTERFACE (No changes needed) =================================
// ============================================================================

// Add to InputPanelProps interface:
interface InputPanelProps {
  onSearch: (queries: ApiQuery[], mode: SearchMode, modelSelection: ModelSelection) => void;
  isAutoTranslateEnabled: boolean;
  isLoading: boolean;
  onSingleSearchResult: (results: ResultItem[]) => void;
  user: User | null;
  modelSelection: ModelSelection; // Add this
}

// ============================================================================
// === 2. NEW CUSTOM HOOK `useInputPanel` (No changes needed) =================
// ============================================================================

const useInputPanel = ({ onSearch, isAutoTranslateEnabled, user, modelSelection}: InputPanelProps) => {
  const [queries, setQueries] = useState<Query[]>([
    { text: '', asr: '', ocr: '', origin: '', obj: [], lang: 'ori', imageFile: null },
  ]);
  const [loading, setLoading] = useState(false); // Internal loading for preparation tasks
  const [historyItems, setHistoryItems] = useState<HistoryItem[] | null>(null);
  const [isHistoryPanelVisible, setIsHistoryPanelVisible] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // --- Core Action Handlers ---

  // src/features/search/components/InputPanel/InputPanel.tsx

// Inside the useInputPanel custom hook...
const handleSearch = async (searchMode: SearchMode = 'normal') => {
  setLoading(true);
  try {
    // 1. Translate queries as before
    const translatePromises = queries.map(async (q) => {
      if (isAutoTranslateEnabled && q.lang === 'ori' && q.origin && !q.text && !q.imageFile) {
        try {
          const translated = await translateText(q.origin.trim());
          return { ...q, text: translated, lang: 'eng' as const };
        } catch (error) {
          console.error(`Translation failed for "${q.origin}", searching with original text.`, error);
          return q; // Fallback to original on error
        }
      }
      return q;
    });
    const translatedQueries = await Promise.all(translatePromises);

    // 2. Prepare queries for the API immediately
    const apiQueryPromises = translatedQueries.map(async (q): Promise<ApiQuery> => {
      const base: Omit<ApiQuery, 'text' | 'image'> = {
        asr: q.asr.trim(), ocr: q.ocr.trim(), origin: q.origin.trim(), obj: q.obj, lang: q.lang,
      };
      if (q.imageFile) {
        const image = await fileToBase64(q.imageFile);
        return { ...base, text: '', image };
      }
      return { ...base, text: q.text.trim(), image: "" };
    });
    const apiQueries = await Promise.all(apiQueryPromises);

    // 3. Validate that there's something to search for
    const isSearchable = apiQueries.some(q => q.text || q.asr || q.ocr || q.obj.length > 0 || q.origin || q.image);
    if (!isSearchable) {
      alert('Please enter a query or specify other search criteria.');
      setLoading(false); // Make sure to stop loading
      return;
    }

    // ✅ SOLUTION: Dispatch the search FIRST
    onSearch(apiQueries, searchMode,modelSelection);

    // ✅ THEN, update the UI state. This will happen in the background
    // without delaying the critical network request.
    setQueries(translatedQueries);

  } catch (error) {
    console.error("Error preparing search:", error);
    alert("An error occurred while preparing your search.");
  } finally {
    // The parent component's isLoading state will take over from here,
    // so we can set the internal loading to false.
    setLoading(false);
  }
};

  const handleTranslateAll = async () => {
    setLoading(true);
    try {
      const translationPromises = queries.map(q => {
        if (q.lang === 'ori' && q.origin && !q.imageFile) {
          return translateText(q.origin.trim()).then(translated => ({
            ...q, text: translated, lang: 'eng' as const,
          }));
        }
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
  
  // --- Query List Management ---

  const addNewQuery = () => setQueries(prev => [...prev, { text: '', asr: '', ocr: '', origin: '', obj: [], lang: 'ori', imageFile: null }]);
  const removeLastQuery = () => queries.length > 1 && setQueries(prev => prev.slice(0, -1));
  const clearAllQueries = () => setQueries([{ text: '', asr: '', ocr: '', origin: '', obj: [], lang: 'ori', imageFile: null }]);

  // --- History Panel Logic ---

  const fetchAndShowHistory = async () => {
    if (!user || isHistoryLoading) return;
    setIsHistoryLoading(true);
    try {
      const histories = await getHistory(user.username);
      if (histories.length > 0) {
        setHistoryItems(histories);
        setIsHistoryPanelVisible(true);
      } else {
        alert("No search history found.");
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
      alert("Could not load search history.");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleHistorySelection = (item: HistoryItem) => {
    const queriesFromHistory = item.queries.map(q => ({ ...q, imageFile: null }));
    setQueries(queriesFromHistory);
    setIsHistoryPanelVisible(false);
    setHistoryItems(null);
  };

  const handleCloseHistoryPanel = () => {
    setIsHistoryPanelVisible(false);
    setHistoryItems(null);
  };

  // --- Shortcut Registration ---
  const registerShortcuts = (focusFirstTextarea: () => void) => {
    useShortcuts({
      TRIGGER_CHAIN_SEARCH: () => { handleSearch('chain'); },
      TRIGGER_SEARCH: () => { handleSearch('normal'); },
      ADD_QUERY: addNewQuery,
      REMOVE_QUERY: removeLastQuery,
      CLEAR_SEARCH: () => {
        clearAllQueries();
        setTimeout(focusFirstTextarea, 0);
      },
      FOCUS_SEARCH: focusFirstTextarea,
      SHOW_HISTORY: fetchAndShowHistory,
    });
  };

  return {
    queries, setQueries, loading,
    historyItems, isHistoryPanelVisible,
    handleSearch, handleTranslateAll,
    handleHistorySelection, handleCloseHistoryPanel,
    registerShortcuts, addNewQuery
  };
};

// ============================================================================
// === 3. REFACTORED `InputPanel` COMPONENT ===================================
// ============================================================================

const InputPanel = (props: InputPanelProps) => {
  const { isAutoTranslateEnabled, isLoading, onSingleSearchResult, user } = props;

  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const chainSearchButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    queries, setQueries, loading,
    historyItems, isHistoryPanelVisible,
    handleSearch,
    handleHistorySelection, handleCloseHistoryPanel,
    registerShortcuts, addNewQuery
  } = useInputPanel(props);
  
  const focusFirstTextarea = () => {
    const textarea = containerRef.current?.querySelector('textarea');
    if (textarea) {
      textarea.focus();
      const length = textarea.value.length;
      textarea.setSelectionRange(length, length);
    }
  };

  useEffect(() => {
    setTimeout(focusFirstTextarea, 0);
  }, []);

  registerShortcuts(focusFirstTextarea);

  // --- Sub-Components (for clean rendering) ---

  const SearchButton = () => (
    <button 
      ref={searchButtonRef} 
      onClick={() => handleSearch('normal')} 
      className={`${searchButtonClass} w-full`} 
      disabled={isLoading || loading}
      title="Run all queries in parallel (Normal Search)" // --- TOOLTIP ADDED
    >
      {isLoading || loading ? <Loader2 className="animate-spin" /> : <Search />}
    </button>
  );

  const ChainSearchButton = () => (
    <button 
      ref={chainSearchButtonRef} 
      onClick={() => handleSearch('chain')} 
      className={`${searchButtonClass} w-full`} 
      disabled={isLoading || loading}
      title="Use results from one query to refine the next (Chain Search)" // --- TOOLTIP ADDED
    >
      {isLoading || loading ? <Loader2 className="animate-spin" /> : <Zap />}
    </button>
  );

  return {
    panelContent: (
      <div className={`${containerClass} relative`} ref={containerRef}>
        <QueryList
          queries={queries}
          onQueriesChange={setQueries}
          onSingleSearchResult={onSingleSearchResult}
          isAutoTranslateEnabled={isAutoTranslateEnabled}
          user={user}
        />
        <HistoryPanel
          isVisible={isHistoryPanelVisible}
          items={historyItems}
          onSelect={handleHistorySelection}
          onClose={handleCloseHistoryPanel}
        />
      </div>
    ),
    searchButton: <SearchButton />,
    chainSearchButton: <ChainSearchButton />
  };
};

export default InputPanel;