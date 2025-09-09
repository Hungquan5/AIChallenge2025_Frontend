import React, { useRef, useState, useEffect} from 'react';
import type { RefObject } from 'react';
import { containerClass } from './styles'; // Assuming this exists
import type { Query, ResultItem } from '../../types';
import type { User } from '../../../communicate/types';
import QueryItem from './QueryItem';
import { useShortcuts } from '../../../../utils/shortcuts';
import { translateText } from '../SearchRequest/searchApi';

// ============================================================================
// === 1. PROPS INTERFACE & TYPES =============================================
// ============================================================================

interface QueryListProps {
  queries: Query[];
  onQueriesChange: (queries: Query[]) => void;
  maxQueries?: number;
  firstInputRef?: RefObject<HTMLTextAreaElement>;
  onSingleSearchResult: (results: ResultItem[]) => void;
  isAutoTranslateEnabled: boolean;
  user: User | null;
}

type FocusField = 'ocr' | 'asr' | 'obj';
type Mode = 'text' | 'image';

// ============================================================================
// === 2. NEW CUSTOM HOOK `useQueryListManager` ===============================
// ============================================================================

/**
 * Manages the business logic for a list of queries.
 * This includes state management for focus, mode changes, shortcuts,
 * and the complex auto-translation side effect.
 */
const useQueryListManager = ({ queries, onQueriesChange, isAutoTranslateEnabled, maxQueries }: QueryListProps) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ index: number; field: FocusField } | null>(null);
  const [modeChangeRequest, setModeChangeRequest] = useState<{ index: number; mode: Mode } | null>(null);

  const debounceTimeoutRef = useRef<number | null>(null);
  const translationAbortControllerRef = useRef<AbortController | null>(null);

  // --- Core List Manipulation Functions ---

  const updateQuery = (index: number, updated: Partial<Query>) => {
    const newQueries = [...queries];
    newQueries[index] = { ...newQueries[index], ...updated };
    onQueriesChange(newQueries);
  };

  const insertQueryAfter = (index: number) => {
    if (maxQueries && queries.length >= maxQueries) return;
    const newQuery: Query = { text: '', asr: '', ocr: '', origin: '', obj: [], lang: 'ori', imageFile: null };
    const updated = [...queries.slice(0, index + 1), newQuery, ...queries.slice(index + 1)];
    onQueriesChange(updated);
    return updated.length; // Return new length for focus management
  };

  const removeQuery = (index: number) => {
    if (queries.length <= 1) return;
    // Immediately stop any pending side effects before changing state
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    translationAbortControllerRef.current?.abort();

    const updated = queries.filter((_, i) => i !== index);
    onQueriesChange(updated);
  };

  // --- Side Effect for Auto-Translation ---

  useEffect(() => {
    if (!isAutoTranslateEnabled) return;

    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    translationAbortControllerRef.current?.abort();

    const controller = new AbortController();
    translationAbortControllerRef.current = controller;

    debounceTimeoutRef.current = window.setTimeout(async () => {
      const queriesToTranslate = queries.filter(q => q.lang === 'ori' && q.origin && !q.text && !q.imageFile);
      if (queriesToTranslate.length === 0) return;

      const promises = queriesToTranslate.map(q =>
        translateText(q.origin.trim() /*, { signal: controller.signal } */) // Assuming API can take a signal
          .then(translatedText => ({ origin: q.origin, translatedText }))
          .catch(error => {
            console.error(`Translation for "${q.origin}" failed:`, error);
            return null; // Don't let one failure break the batch
          })
      );

      try {
        const results = await Promise.all(promises);
        if (controller.signal.aborted) return;

        const newQueries = queries.map(q => {
          const result = results.find(r => r?.origin === q.origin);
          // Passively add the translation; don't change the user's language mode
          return result ? { ...q, text: result.translatedText } : q;
        });

        onQueriesChange(newQueries);
      } catch (error) {
        if (!controller.signal.aborted) console.error("Auto-translation batch failed:", error);
      }
    }, 700);

    return () => { // Cleanup function
      clearTimeout(debounceTimeoutRef.current!);
      controller.abort();
    };
  }, [queries, isAutoTranslateEnabled, onQueriesChange]);
  
  // --- Shortcut Handling Logic ---

  useShortcuts({
    TRANSLATE_QUERY: () => {
      if (focusedIndex === null) return;
      const current = queries[focusedIndex];
      const newLang = current.lang === 'eng' ? 'ori' : 'eng';

      if (newLang === 'eng' && current.origin && !current.text) {
        translateText(current.origin.trim())
          .then(translated => updateQuery(focusedIndex, { text: translated, lang: newLang }))
          .catch(err => {
            console.error('Translation failed:', err);
            updateQuery(focusedIndex, { lang: newLang }); // Still toggle lang on failure
          });
      } else {
        updateQuery(focusedIndex, { lang: newLang });
      }
    },
    TOGGLE_OCR: () => focusedIndex !== null && setFocusRequest({ index: focusedIndex, field: 'ocr' }),
    TOGGLE_ASR: () => focusedIndex !== null && setFocusRequest({ index: focusedIndex, field: 'asr' }),
    TOGGLE_OBJ: () => focusedIndex !== null && setFocusRequest({ index: focusedIndex, field: 'obj' }),
    TOGGLE_TEXT_MODE: () => {
      if (focusedIndex !== null) {
        updateQuery(focusedIndex, { imageFile: null });
        setModeChangeRequest({ index: focusedIndex, mode: 'text' });
      }
    },
    TOGGLE_IMAGE_MODE: () => {
      if (focusedIndex !== null) {
        updateQuery(focusedIndex, { text: '', origin: '', lang: 'ori' });
        setModeChangeRequest({ index: focusedIndex, mode: 'image' });
      }
    },
  });

  return {
    focusedIndex, setFocusedIndex,
    focusRequest, setFocusRequest,
    modeChangeRequest, setModeChangeRequest,
    updateQuery,
    insertQueryAfter,
    removeQuery
  };
};

// ============================================================================
// === 3. REFACTORED `QueryList` COMPONENT ====================================
// ============================================================================

const QueryList: React.FC<QueryListProps> = (props) => {
  const { queries, firstInputRef, onSingleSearchResult, user } = props;
  const containerRef = useRef<HTMLDivElement>(null);

  // All business logic is now cleanly managed by our custom hook
  const {
    setFocusedIndex,
    focusRequest, setFocusRequest,
    modeChangeRequest, setModeChangeRequest,
    updateQuery,
    insertQueryAfter,
    removeQuery
  } = useQueryListManager(props);

  // --- DOM-Specific Handlers (Remain in the component) ---

  const handleInsertAfterAndFocus = (index: number) => {
    insertQueryAfter(index);
    // Focus the new textarea after it has been rendered
    setTimeout(() => {
      const textareas = containerRef.current?.querySelectorAll('textarea');
      textareas?.[index + 1]?.focus();
    }, 0);
  };

  const handleNavigate = (currentIndex: number, direction: 'next' | 'prev') => {
    const textareas = containerRef.current?.querySelectorAll('textarea');
    if (!textareas || textareas.length === 0) return;
    
    let targetIndex;
    if (direction === 'next') {
      targetIndex = (currentIndex + 1) % textareas.length;
    } else {
      targetIndex = currentIndex === 0 ? textareas.length - 1 : currentIndex - 1;
    }
    textareas[targetIndex]?.focus();
  };

  return (
    <div ref={containerRef} className="space-y-4">
      {queries.map((query, index) => (
        <QueryItem
          key={index}
          index={index}
          query={query}
          user={user}
          onFocus={() => setFocusedIndex(index)}
          onUpdate={updateQuery}
          onInsertAfter={() => handleInsertAfterAndFocus(index)}
          onRemove={() => removeQuery(index)}
          disableRemove={queries.length === 1}
          onSingleSearchResult={onSingleSearchResult}
          onNext={() => handleNavigate(index, 'next')}
          onPrev={() => handleNavigate(index, 'prev')}
          inputRef={index === 0 ? firstInputRef : undefined}
          focusRequest={focusRequest}
          onFocusRequestConsumed={() => setFocusRequest(null)}
          modeChangeRequest={modeChangeRequest}
          onModeChangeRequestConsumed={() => setModeChangeRequest(null)}
        />
      ))}
    </div>
  );
};

export default QueryList;