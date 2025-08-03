import React, { useRef,useState } from 'react';
import type { RefObject } from 'react';
import { containerClass } from './styles';
import type { Query } from '../../types';
import QueryItem from './QueryItem';
import { useShortcuts } from '../../../../utils/shortcuts';
import { translateText } from '../SearchRequest/searchApi';
interface QueryListProps {
  queries: Query[];
  onQueriesChange: (queries: Query[]) => void;
  maxQueries?: number;
  firstInputRef?: RefObject<HTMLTextAreaElement>;
}

const QueryList: React.FC<QueryListProps> = ({ queries, onQueriesChange, maxQueries, firstInputRef }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const updateQuery = (index: number, updated: Partial<Query>) => {
    const newQueries = [...queries];
    newQueries[index] = { ...newQueries[index], ...updated };
    onQueriesChange(newQueries);
  };
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

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
