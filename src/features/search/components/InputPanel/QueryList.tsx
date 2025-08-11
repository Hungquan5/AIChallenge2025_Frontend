import React, { useRef, useState, useEffect } from 'react'; // ✅ Add useEffectimport type { RefObject } from 'react';
import { containerClass } from './styles';
import type { Query } from '../../types';
import QueryItem from './QueryItem';
import { useShortcuts } from '../../../../utils/shortcuts';
import { translateText } from '../SearchRequest/searchApi';
import type { ResultItem } from '../../types';

interface QueryListProps {
  queries: Query[];
  onQueriesChange: (queries: Query[]) => void;
  maxQueries?: number;
  firstInputRef?: RefObject<HTMLTextAreaElement>;
  onSingleSearchResult: (results: ResultItem[]) => void;
  isAutoTranslateEnabled: boolean; // ✅ 1. ACCEPT THE PROP
}

const QueryList: React.FC<QueryListProps> = ({ 
  queries, 
  onQueriesChange, 
  maxQueries, 
  firstInputRef, 
  onSingleSearchResult,
  isAutoTranslateEnabled, // ✅ 2. DESTRUCTURE THE PROP
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<number | null>(null); // For debouncing API calls

  const updateQuery = (index: number, updated: Partial<Query>) => {
    const newQueries = [...queries];
    newQueries[index] = { ...newQueries[index], ...updated };
    onQueriesChange(newQueries);
  };
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
// ✅ 3. ADD THE AUTO-TRANSLATE USEEFFECT HOOK
useEffect(() => {
  // If the feature is turned off, do nothing.
  if (!isAutoTranslateEnabled) {
    return;
  }

  // Clear any pending translation to avoid race conditions
  if (debounceTimeoutRef.current) {
    clearTimeout(debounceTimeoutRef.current);
  }

  // Set a new timeout to run after the user stops typing
  debounceTimeoutRef.current = window.setTimeout(async () => {
    // Find all queries that are in 'ori' mode, have original text, but no translated text yet.
    const queriesNeedingTranslation = queries.some(
      q => q.lang === 'ori' && q.origin && !q.text && !q.imageFile
    );

    if (!queriesNeedingTranslation) {
      return; // No work to do
    }

    // Perform translation for all applicable queries
    const translationPromises = queries.map(q => {
      if (q.lang === 'ori' && q.origin && !q.text && !q.imageFile) {
        return translateText(q.origin.trim()).then(translated => ({
          ...q,
          text: translated, // Keep original text, just add the translation
        }));
      }
      return Promise.resolve(q); // Return other queries unmodified
    });

    try {
      const translatedQueries = await Promise.all(translationPromises);
      onQueriesChange(translatedQueries);
    } catch (error) {
      console.error("Auto-translation failed:", error);
    }

  }, 700); // 700ms delay after last keystroke

  // Cleanup function to clear timeout if component unmounts
  return () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  };
}, [queries, isAutoTranslateEnabled, onQueriesChange]); // Rerun effect if these change

  const insertQueryAfter = (index: number) => {
    if (maxQueries && queries.length >= maxQueries) return;
    const newQuery: Query = { text: '', asr: '', ocr: '', origin: '', obj: [], lang: 'ori', imageFile: null };
    const updated = [...queries.slice(0, index + 1), newQuery, ...queries.slice(index + 1)];
    onQueriesChange(updated);
    // Focus vào textarea mới sau khi nó được render
    setTimeout(() => {
      const textareas = containerRef.current?.querySelectorAll('textarea');
      if (textareas && textareas.length > index + 1) {
        (textareas[index + 1] as HTMLTextAreaElement).focus();
      }
    }, 0);
  };
  useShortcuts({
    TRANSLATE_QUERY: () => {
      if (focusedIndex === null) return;
  
      const current = queries[focusedIndex];
      const newLang = current.lang === 'eng' ? 'ori' : 'eng';
  
      if (newLang === 'eng' && current.origin && !current.text) {
        translateText(current.origin.trim())
          .then((translated) => {
            updateQuery(focusedIndex, { text: translated, lang: newLang });
          })
          .catch((err) => {
            console.error('Translation failed:', err);
            updateQuery(focusedIndex, { lang: newLang });
          });
      } else {
        updateQuery(focusedIndex, { lang: newLang });
      }
    }
  })  
  const removeQuery = (index: number) => {
    if (queries.length <= 1) return;
    const updated = queries.filter((_, i) => i !== index);
    onQueriesChange(updated);
  };

  const handleNext = (index: number) => {
    const textareas = containerRef.current?.querySelectorAll('textarea');
    if (textareas) {
      const nextIndex = (index + 1) % textareas.length;
      (textareas[nextIndex] as HTMLTextAreaElement)?.focus();
    }
  };

  const handlePrev = (index: number) => {
    const textareas = containerRef.current?.querySelectorAll('textarea');
    if (textareas) {
      const prevIndex = index === 0 ? textareas.length - 1 : index - 1;
      (textareas[prevIndex] as HTMLTextAreaElement)?.focus();
    }
  };

  return (
    <div className={containerClass} ref={containerRef}>
      <div className="space-y-4">
        {queries.map((query, index) => (
          <QueryItem
          onSingleSearchResult={onSingleSearchResult}
            key={index}
            index={index}
            query={query}
            onFocus={()=> setFocusedIndex(index)}
            onUpdate={updateQuery}
            onInsertAfter={insertQueryAfter}
            onRemove={removeQuery}
            disableRemove={queries.length === 1}
            onNext={() => handleNext(index)}
            onPrev={() => handlePrev(index)}
            inputRef={index === 0 ? firstInputRef : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default QueryList;
