import React, { useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { Query } from '../../types';
import { translateText } from '../SearchRequest/searchApi';
import { isShortcut, SHORTCUTS } from '../../../../utils/shortcuts';
import {
  inputClass,
  labelClass,
} from './styles';

interface QueryItemProps {
  index: number;
  query: Query;
  onUpdate: (index: number, updated: Partial<Query>) => void;
  onInsertAfter: (index: number) => void;
  onRemove: (index: number) => void;
  disableRemove?: boolean;
  onClear?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  inputRef?: RefObject<HTMLTextAreaElement>;
}

const ToggleButton = ({ active, label, onClick, bg }: { active: boolean; label: string; onClick: () => void; bg: string }) => (
  <button
    className={`px-2 py-1 rounded-md ${
      active ? `${bg} text-black` : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
    } text-sm hover:brightness-105 transition-all hover:-translate-y-0.5`}
    onClick={onClick}
  >
    {label}
  </button>
);

const QueryItem: React.FC<QueryItemProps> = ({
  index,
  query,
  onUpdate,
  onInsertAfter,
  onRemove,
  disableRemove,
  onNext,
  onPrev,
  inputRef,
}) => {
  const [showASR, setShowASR] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  const [showOBJ, setShowOBJ] = useState(false);
  const localTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef || localTextareaRef;

  const handleBlur = async () => {
    if (query.lang !== 'eng') {
      const inputText = query.origin.trim();
      if (!inputText || query.text) return;

      try {
        const translated = await translateText(inputText);
        onUpdate(index, { text: translated, lang: 'eng' });
      } catch (err) {
        console.error('Translation failed:', err);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isShortcut(e, SHORTCUTS.NEW_QUERY)) {
      e.preventDefault();
      onInsertAfter(index);
    } else if (isShortcut(e, SHORTCUTS.NEXT_CELL)) {
      e.preventDefault();
      onNext?.();
    } else if (isShortcut(e, SHORTCUTS.PREV_CELL)) {
      e.preventDefault();
      onPrev?.();
    } else if (e.key === 'ArrowDown' && e.currentTarget.selectionStart === e.currentTarget.value.length) {
      e.preventDefault();
      onNext?.();
    } else if (e.key === 'ArrowUp' && e.currentTarget.selectionStart === 0) {
      e.preventDefault();
      onPrev?.();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    query.lang === 'eng'
      ? onUpdate(index, { text: value })
      : onUpdate(index, { origin: value, text: '' });
  };

  return (
    <div className="p-3 border border-[var(--border-color)] rounded-lg shadow-md space-y-2 bg-[var(--bg-secondary)]" tabIndex={0}>
      <div className="flex gap-2 mb-2">
        <ToggleButton active={showOCR} label="📄 OCR" onClick={() => setShowOCR(prev => !prev)} bg="bg-red-100" />
        <ToggleButton active={showASR} label="🎤 ASR" onClick={() => setShowASR(prev => !prev)} bg="bg-blue-100" />
        <ToggleButton active={showOBJ} label="🧝 OBJ" onClick={() => setShowOBJ(prev => !prev)} bg="bg-green-100" />
      </div>

      <textarea
        ref={textareaRef}
        value={query.lang === 'eng' ? query.text : query.origin}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="Enter your query..."
        className={`${inputClass} resize-none flex-1 scrollbar-thin scrollbar-thumb-[var(--border-color)] scrollbar-track-[var(--bg-tertiary)]`}
        rows={7}
      />

      {showOCR && (
        <input
          type="text"
          value={query.ocr}
          onChange={(e) => onUpdate(index, { ocr: e.target.value })}
          placeholder="OCR input"
          className="w-full p-2 rounded-md bg-red-100 border border-[var(--border-color)] text-sm text-black placeholder-gray-700"
        />
      )}

      {showASR && (
        <input
          type="text"
          value={query.asr}
          onChange={(e) => onUpdate(index, { asr: e.target.value })}
          placeholder="ASR input"
          className="w-full p-2 rounded-md bg-blue-100 border border-[var(--border-color)] text-sm text-black placeholder-gray-700"
        />
      )}

      {showOBJ && (
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={query.obj?.[0] || ''}
            onChange={(e) => onUpdate(index, { obj: [e.target.value] })}
            placeholder="ex: person=8 bicycle<=2 motorcycle=1"
            className="w-full p-2 rounded-md bg-green-100 border border-[var(--border-color)] text-sm text-black placeholder-gray-700"
          />
        </div>
      )}

      <div className="flex justify-between items-center mt-2">
        <div>
          {(query.text || query.origin) && (
            <button
              onClick={() => {
                const newLang = query.lang === 'eng' ? 'ori' : 'eng';
                onUpdate(index, { lang: newLang });
              }}
              className="text-xs bg-[var(--bg-tertiary)] text-[var(--text-primary)] px-2 py-1 rounded hover:bg-[var(--bg-secondary)] transition-all hover:-translate-y-0.5"
            >
              {query.lang === 'eng' ? 'ENG' : 'ORI'}
            </button>
          )}
        </div>

        <div className="flex gap-2 ml-4">
          {!disableRemove && (
            <button
              onClick={() => onRemove(index)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#E53E3E] text-white hover:bg-[#C53030] transition-all hover:-translate-y-0.5"
              title="Remove query"
            >
              −
            </button>
          )}
          <button
            onClick={() => onInsertAfter(index)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--accent-color)] text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-all hover:-translate-y-0.5"
            title="Add query after"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default QueryItem;
