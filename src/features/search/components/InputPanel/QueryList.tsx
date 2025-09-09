// src/features/search/components/InputPanel/QueryList.tsx

import React, { useRef, useState, useEffect, useCallback} from 'react';
import type { RefObject, SetStateAction } from 'react';
import { containerClass } from './styles';
import type { Query, ResultItem, ApiQuery } from '../../types';
import type { User } from '../../../communicate/types';
import QueryItem from './QueryItem';
import { useShortcuts } from '../../../../utils/shortcuts';
import { translateText, searchBySingleQuery } from '../SearchRequest/searchApi';
import { fileToBase64 } from '../../../../utils/fileConverter';

// ============================================================================
// === 1. PROPS INTERFACE & TYPES (Unchanged) =================================
// ============================================================================

interface QueryListProps {
queries: Query[];
onQueriesChange: React.Dispatch<SetStateAction<Query[]>>;
maxQueries?: number;
firstInputRef?: RefObject<HTMLTextAreaElement>;
onSingleSearchResult: (results: ResultItem[]) => void;
isAutoTranslateEnabled: boolean;
user: User | null;
}

type FocusField = 'ocr' | 'asr' | 'obj';
type Mode = 'text' | 'image';
type TranslationStatus = 'idle' | 'pending' | 'error';


// ============================================================================
// === 2. CUSTOM HOOK useQueryListManager (CORRECTED) =========================
// ============================================================================
const useQueryListManager = ({ queries, onQueriesChange, isAutoTranslateEnabled, maxQueries, user, onSingleSearchResult }: QueryListProps) => {
const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
const [focusRequest, setFocusRequest] = useState<{ index: number; field: FocusField } | null>(null);
const [modeChangeRequest, setModeChangeRequest] = useState<{ index: number; mode: Mode } | null>(null);
const [searchingIndex, setSearchingIndex] = useState<number | null>(null);
const [translationStatuses, setTranslationStatuses] = useState<Record<number, TranslationStatus>>({});

const debounceTimeoutRef = useRef<number | null>(null);
const translationAbortControllerRef = useRef<AbortController | null>(null);

const updateQuery = (index: number, updated: Partial<Query>) => {
onQueriesChange(
queries.map((q, i) => (i === index ? { ...q, ...updated } : q))
);
};

const insertQueryAfter = (index: number) => { if (maxQueries && queries.length >= maxQueries) return; const newQuery: Query = { text: '', asr: '', ocr: '', origin: '', obj: [], lang: 'ori', imageFile: null }; const updated = [...queries.slice(0, index + 1), newQuery, ...queries.slice(index + 1)]; onQueriesChange(updated); return updated.length; };
const removeQuery = (index: number) => { if (queries.length <= 1) return; if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current); translationAbortControllerRef.current?.abort(); const updated = queries.filter((_, i) => i !== index); onQueriesChange(updated); };
const handleItemSearch = useCallback(async (index: number | null) => { if (index === null || !user || searchingIndex !== null) return; setSearchingIndex(index); try { const query = queries[index]; const { asr, ocr, origin, obj, lang, imageFile, text } = query; const apiQuery: ApiQuery = { asr, ocr, origin, obj, lang, text, image: '' }; if (imageFile) { apiQuery.image = await fileToBase64(imageFile); apiQuery.text = ''; } const results = await searchBySingleQuery(apiQuery, user.username); onSingleSearchResult(results); } catch (error) { console.error(`Single item search failed for index ${index}:`, error); alert(`Search for this item failed: ${error instanceof Error ? error.message : 'Unknown error'}`); } finally { setSearchingIndex(null); } }, [queries, user, onSingleSearchResult, searchingIndex]);


useEffect(() => {
  translationAbortControllerRef.current?.abort();
  if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
  
  const controller = new AbortController();
  translationAbortControllerRef.current = controller;
  
  debounceTimeoutRef.current = window.setTimeout(async () => {
  // ✅ REFACTORED: The condition to translate is now much more specific and robust.
  const queriesToTranslate = queries.map((q, index) => ({ ...q, index }))
  .filter(q =>
  // We only trigger a translation if the query meets ALL these criteria:
  // 1. The user has explicitly set the mode to English.
  // 2. There is original text available to translate.
  // 3. The translated text field is currently empty.
  // 4. It's not an image query.
  q.lang === 'eng' && q.origin && !q.text && !q.imageFile
  );
  
  if (queriesToTranslate.length === 0) return;
  
  const pendingIndexes = queriesToTranslate.map(q => q.index);
  setTranslationStatuses(prev => { const newStatuses = { ...prev }; pendingIndexes.forEach(i => { newStatuses[i] = 'pending'; }); return newStatuses; });
  
  const promises = queriesToTranslate.map(q =>
  translateText(q.origin.trim())
  .then(translatedText => ({ index: q.index, status: 'fulfilled' as const, value: translatedText }))
  .catch(error => ({ index: q.index, status: 'rejected' as const, reason: error }))
  );
  
  const results = await Promise.all(promises);
  if (controller.signal.aborted) return;
  
  onQueriesChange(currentQueries =>
  currentQueries.map((q, index) => {
  const result = results.find(r => r.index === index);
  if (result?.status === 'fulfilled') {
  // Only update the text, leaving the user's chosen language ('eng') intact.
  return { ...q, text: result.value };
  }
  return q;
  })
  );
  
  const finalStatuses: Record<number, TranslationStatus> = {};
  results.forEach(result => { finalStatuses[result.index] = result.status === 'fulfilled' ? 'idle' : 'error'; });
  setTranslationStatuses(prev => ({ ...prev, ...finalStatuses }));
  
  setTimeout(() => {
  setTranslationStatuses(prev => {
  const clearedStatuses = { ...prev };
  Object.keys(finalStatuses).forEach(key => {
  const index = parseInt(key, 10);
  if (clearedStatuses[index] === 'error') { delete clearedStatuses[index]; }
  });
  return clearedStatuses;
  });
  }, 2500);
  
  }, 500); // Debounce time remains the same
  
  return () => {
  clearTimeout(debounceTimeoutRef.current!);
  controller.abort();
  };
  }, [queries, onQueriesChange]); // Removed isAutoTranslateEnabled as it's no longer needed here


useShortcuts({
SEARCH_FOCUSED_ITEM: () => { if (focusedIndex !== null) handleItemSearch(focusedIndex); },
TRANSLATE_QUERY: () => {
if (focusedIndex === null) return;
const current = queries[focusedIndex];
// ✅ FIX 1: Explicitly type 'newLang' to prevent it from being widened to 'string'
const newLang: 'ori' | 'eng' = current.lang === 'eng' ? 'ori' : 'eng';
const updatedQuery = newLang === 'ori' ? { lang: newLang, text: '' } : { lang: newLang };
updateQuery(focusedIndex, updatedQuery);
},
TOGGLE_OCR: () => focusedIndex !== null && setFocusRequest({ index: focusedIndex, field: 'ocr' }),
TOGGLE_ASR: () => focusedIndex !== null && setFocusRequest({ index: focusedIndex, field: 'asr' }),
TOGGLE_OBJ: () => focusedIndex !== null && setFocusRequest({ index: focusedIndex, field: 'obj' }),
TOGGLE_TEXT_MODE: () => { if (focusedIndex !== null) { updateQuery(focusedIndex, { imageFile: null }); setModeChangeRequest({ index: focusedIndex, mode: 'text' }); } },
TOGGLE_IMAGE_MODE: () => { if (focusedIndex !== null) { updateQuery(focusedIndex, { text: '', origin: '', lang: 'ori' }); setModeChangeRequest({ index: focusedIndex, mode: 'image' }); } },
});

useEffect(() => { const handleKeyDown = (event: KeyboardEvent) => { if ( event.altKey && !event.ctrlKey && !event.shiftKey && !event.metaKey && /^[1-9]$/.test(event.key) ) { const index = parseInt(event.key, 10) - 1; if (index < queries.length) { event.preventDefault(); handleItemSearch(index); } } }; window.addEventListener('keydown', handleKeyDown); return () => { window.removeEventListener('keydown', handleKeyDown); }; }, [handleItemSearch, queries.length]);

return {
focusedIndex, setFocusedIndex,
focusRequest, setFocusRequest,
modeChangeRequest, setModeChangeRequest,
searchingIndex,
translationStatuses,
handleItemSearch,
updateQuery,
insertQueryAfter,
removeQuery
};
};

// ============================================================================
// === 3. QueryList COMPONENT (CORRECTED) =====================================
// ============================================================================

const QueryList: React.FC<QueryListProps> = (props) => {
const { queries, firstInputRef, user } = props;
const containerRef = useRef<HTMLDivElement>(null);

const {
setFocusedIndex,
focusRequest, setFocusRequest,
modeChangeRequest, setModeChangeRequest,
searchingIndex,
translationStatuses,
handleItemSearch,
updateQuery,
insertQueryAfter,
removeQuery
} = useQueryListManager(props);

const handleInsertAfterAndFocus = (index: number) => { insertQueryAfter(index); setTimeout(() => { const textareas = containerRef.current?.querySelectorAll('textarea'); textareas?.[index + 1]?.focus(); }, 0); };
const handleNavigate = (currentIndex: number, direction: 'next' | 'prev') => { const textareas = containerRef.current?.querySelectorAll('textarea'); if (!textareas || textareas.length === 0) return; let targetIndex; if (direction === 'next') { targetIndex = (currentIndex + 1) % textareas.length; } else { targetIndex = currentIndex === 0 ? textareas.length - 1 : currentIndex - 1; } textareas[targetIndex]?.focus(); };

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
onItemSearch={handleItemSearch}
isSearching={searchingIndex === index}
onNext={() => handleNavigate(index, 'next')}
onPrev={() => handleNavigate(index, 'prev')}
inputRef={index === 0 ? firstInputRef : undefined}
focusRequest={focusRequest}
onFocusRequestConsumed={() => setFocusRequest(null)}
modeChangeRequest={modeChangeRequest}
onModeChangeRequestConsumed={() => setModeChangeRequest(null)}
translationStatus={translationStatuses[index] || 'idle'}
onLanguageToggle={() => {
const current = queries[index];
// ✅ FIX 1: Explicitly type 'newLang' here as well
const newLang: 'ori' | 'eng' = current.lang === 'eng' ? 'ori' : 'eng';
const updatedQuery = newLang === 'ori' ? { lang: newLang, text: '' } : { lang: newLang };
updateQuery(index, updatedQuery);
}}
/>
))}
</div>
);
};

export default QueryList;