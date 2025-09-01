import React, { useRef, useState, useEffect } from 'react'; // ✅ Add useEffectimport type { RefObject } from 'react';
import { containerClass } from './styles';
import type { Query } from '../../types';
import QueryItem from './QueryItem';
import { useShortcuts } from '../../../../utils/shortcuts';
import { translateText } from '../SearchRequest/searchApi';
import type { ResultItem } from '../../types';
import type { User } from '../../../communicate/types';
interface QueryListProps {
  queries: Query[];
  onQueriesChange: (queries: Query[]) => void;
  maxQueries?: number;
  firstInputRef?: RefObject<HTMLTextAreaElement>;
  onSingleSearchResult: (results: ResultItem[]) => void;
  isAutoTranslateEnabled: boolean; // ✅ 1. ACCEPT THE PROP
  user: User | null; // ✅ FIX: Allow user to be null

}

type FocusField = 'ocr' | 'asr' | 'obj';
type Mode = 'text' | 'image'; // ✅ 1. Add a type for clarity


const QueryList: React.FC<QueryListProps> = ({ 
  queries, 
  onQueriesChange, 
  maxQueries, 
  firstInputRef, 
  onSingleSearchResult,
  isAutoTranslateEnabled, // ✅ 2. DESTRUCTURE THE PROP
  user // ✅ ADDED

}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<number | null>(null); // For debouncing API calls

  const updateQuery = (index: number, updated: Partial<Query>) => {
    const newQueries = [...queries];
    newQueries[index] = { ...newQueries[index], ...updated };
    onQueriesChange(newQueries);
  };
  const translationAbortControllerRef = useRef<AbortController | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ index: number; field: FocusField } | null>(null);
  const [modeChangeRequest, setModeChangeRequest] = useState<{ index: number; mode: Mode } | null>(null);

  // ✅ 2. Refactor the auto-translate effect to be cancellable
  useEffect(() => {
    if (!isAutoTranslateEnabled) {
      return;
    }

    // A. Cancel any previous debounced timeout and abort any ongoing API call
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (translationAbortControllerRef.current) {
      translationAbortControllerRef.current.abort();
    }

    // B. Create a new controller for this new potential translation
    const controller = new AbortController();
    translationAbortControllerRef.current = controller;

    debounceTimeoutRef.current = window.setTimeout(async () => {
      const queriesNeedingTranslation = queries.filter(
        q => q.lang === 'ori' && q.origin && !q.text && !q.imageFile
      );

      if (queriesNeedingTranslation.length === 0) {
        return; // No work to do
      }

      const translationPromises = queriesNeedingTranslation.map(q => 
        // We assume translateText can accept a signal to be truly cancellable
        translateText(q.origin.trim() /*, { signal: controller.signal } */)
          .then(translated => ({
            origin: q.origin, // Keep track of which original text this belongs to
            translatedText: translated,
          }))
          .catch(error => {
             // Prevent a single failed translation from breaking the whole batch
            console.error(`Translation for "${q.origin}" failed:`, error);
            return null;
          })
      );

      try {
        const results = await Promise.all(translationPromises);
        
        // C. Before updating state, check if this operation was cancelled
        if (controller.signal.aborted) {
          return;
        }

        // D. Create the new state based on successful translations
        const translatedQueries = queries.map(q => {
          const result = results.find(r => r?.origin === q.origin);
          if (result) {
            // Passively add the translation but DON'T change the lang mode.
            // The user stays in 'ori' mode with a pre-filled translation.
            return { ...q, text: result.translatedText };
          }
          return q;
        });

        onQueriesChange(translatedQueries);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Auto-translation failed:", error);
        }
      }
    }, 700);

    // ✅ 3. Cleanup function: runs when effect re-runs or component unmounts
    return () => {
      clearTimeout(debounceTimeoutRef.current!);
      controller.abort();
    };
  }, [queries, isAutoTranslateEnabled, onQueriesChange]);
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
    },
      // ✅ ADD THE NEW HANDLERS HERE
      TOGGLE_OCR: () => {
        if (focusedIndex !== null) {
          setFocusRequest({ index: focusedIndex, field: 'ocr' });
        }
      },
      TOGGLE_ASR: () => {
        if (focusedIndex !== null) {
          setFocusRequest({ index: focusedIndex, field: 'asr' });
        }
      },
      TOGGLE_OBJ: () => {
        if (focusedIndex !== null) {
          setFocusRequest({ index: focusedIndex, field: 'obj' });
        }
      },
       // ✅ ADD THE NEW HANDLERS for text/image mode
    // ✅ 3. MODIFY the TOGGLE_TEXT_MODE and TOGGLE_IMAGE_MODE handlers
    TOGGLE_TEXT_MODE: () => {
      if (focusedIndex !== null) {
        // This part is good, it clears the image data
        updateQuery(focusedIndex, { imageFile: null });
        // Now, also send a command to ensure the UI updates
        setModeChangeRequest({ index: focusedIndex, mode: 'text' });
      }
    },
    TOGGLE_IMAGE_MODE: () => {
      if (focusedIndex !== null) {
        // This part clears the text data
        updateQuery(focusedIndex, { text: '', origin: '', lang: 'ori' });
        // Now, send the command to switch the UI to image mode
        setModeChangeRequest({ index: focusedIndex, mode: 'image' });
      }
    },
  }); 
  const removeQuery = (index: number) => {
    if (queries.length <= 1) return;

    // Immediately stop any pending auto-translation before changing the state
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    if (translationAbortControllerRef.current) translationAbortControllerRef.current.abort();

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
    <div ref={containerRef}>
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
            focusRequest={focusRequest}
            onFocusRequestConsumed={() => setFocusRequest(null)}
            user={user} // ✅ ADDED: Pass user to each QueryItem

            // ✅ 4. Pass the new props down to the QueryItem
            modeChangeRequest={modeChangeRequest}
            onModeChangeRequestConsumed={() => setModeChangeRequest(null)}          />
        ))}
      </div>
    </div>
  );
};

export default QueryList;
