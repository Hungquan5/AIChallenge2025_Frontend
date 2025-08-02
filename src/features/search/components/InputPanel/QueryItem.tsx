import type { RefObject } from 'react';
import React, { useEffect, useRef, useState } from 'react';
import { isShortcut, SHORTCUTS, useShortcuts } from '../../../../utils/shortcuts';
import type { Query } from '../../types';
import { translateText } from '../SearchRequest/searchApi';
import {
  actionButtonClass,
  addButtonClass,
  asrActiveColor,
  asrInputClass,
  bottomControlsClass,
  featureGridClass,
  featureInputClass,
  featureToggleActiveClass,
  featureToggleButtonClass,
  featureToggleInactiveClass,
  imageModeActiveColor,
  inputClass,
  languageToggleClass,
  modeToggleActiveClass,
  modeToggleButtonClass,
  modeToggleInactiveClass,
  objActiveColor,
  objInputClass,
  ocrActiveColor,
  ocrInputClass,
  queryItemContainerClass,
  removeButtonClass,
  textModeActiveColor,
  uploadAreaClass,
  uploadedImageClass,
  uploadIconClass,
  uploadTextClass
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

const ModeToggleButton = ({ active, icon, onClick, activeColor }: {
  active: boolean;
  icon: string;
  onClick: () => void;
  activeColor: string;
}) => (
  <button
    className={`
      ${modeToggleButtonClass}
      ${active
        ? `${activeColor} ${modeToggleActiveClass}`
        : modeToggleInactiveClass
      }
    `}
    onClick={onClick}
  >
    {icon}
  </button>
);
const FeatureToggleButton = ({ active, icon, onClick, activeColor }: { 
  active: boolean; 
  icon: string; 
  onClick: () => void; 
  activeColor: string; 
}) => (
  <button
    className={`
      ${featureToggleButtonClass}
      ${active 
        ? `${activeColor} ${featureToggleActiveClass}` 
        : featureToggleInactiveClass
      }
    `}
    onClick={onClick}
  >
    {icon}
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
  const [displayMode, setDisplayMode] = useState<'text' | 'image'>(
    query.imageFile ? 'image' : 'text'
  );
  
 const [queryMode, setQueryMode] = useState<'text' | 'image'>(
    query.imageFile ? 'image' : 'text'
  );  const [showASR, setShowASR] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  const [showOBJ, setShowOBJ] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const localTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef || localTextareaRef;
  useEffect(() => {
    // Sync local state if the query from the parent changes (e.g., clearing all)
    setImageFile(query.imageFile || null);
    setDisplayMode(query.imageFile ? 'image' : 'text');
  }, [query.imageFile]);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // When an image is uploaded, it automatically becomes an image query.
      // Clear text fields and update the parent with the file.
      onUpdate(index, {
        imageFile: file,
        text: '',
        origin: '',
        // You might want to decide if OCR/ASR/OBJ should also be cleared
        // ocr: '',
        // asr: '',
      });
    }
  };



  
// Hover your mouse over the address bar, selecting everything in there,
// ready for you to enter a new address or search.
useEffect(() => {
  const handleGlobalKeyDown = (e: KeyboardEvent) => {
    if (isShortcut(e, SHORTCUTS.NAVIGATE_SEARCH)) {
      e.preventDefault();
      if (queryMode === 'text' && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select(); // Select all text
      }
    }
  };

  window.addEventListener('keydown', handleGlobalKeyDown);
  return () => {
    window.removeEventListener('keydown', handleGlobalKeyDown);
  };
}, [queryMode, textareaRef]);



// Also ensure that when switching to image mode, the state is properly managed
const handleModeToggle = (newMode: 'text' | 'image') => {
    setQueryMode(newMode);

    if (newMode === 'text') {
      // If switching to text mode, clear the image file.
      onUpdate(index, { imageFile: null });
    } else {
      // If switching to image mode, clear all text-related fields.
      onUpdate(index, {
        text: '',
        origin: '',
        lang: 'ori', // Reset language
      });
    }
  };


  const handleLanguageToggle = () => {
    const newLang = query.lang === 'eng' ? 'ori' : 'eng';
    if (newLang === 'eng' && query.origin && !query.text) {
      translateText(query.origin.trim())
        .then(translated => {
          onUpdate(index, { text: translated, lang: newLang });
        })
        .catch(err => {
          console.error('Translation failed:', err);
          onUpdate(index, { lang: newLang }); // Fallback to just switch lang
        });
    } else {
      onUpdate(index, { lang: newLang });
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
    <div className={queryItemContainerClass} tabIndex={0}>
      
      {/* === Mode and Feature Toggles === */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <ModeToggleButton
            active={queryMode === 'text'}
            icon="📝"
            onClick={() => handleModeToggle('text')}
            activeColor={textModeActiveColor}
          />
          <ModeToggleButton
            active={queryMode === 'image'}
            icon="🖼️"
            onClick={() => handleModeToggle('image')}
            activeColor={imageModeActiveColor}
          />
        </div>

        <div className={featureGridClass}>
          <FeatureToggleButton 
            active={showOCR} 
            icon="📄" 
            onClick={() => setShowOCR(prev => !prev)} 
            activeColor={ocrActiveColor}
          />
          <FeatureToggleButton 
            active={showASR} 
            icon="🎤" 
            onClick={() => setShowASR(prev => !prev)} 
            activeColor={asrActiveColor}
          />
          <FeatureToggleButton 
            active={showOBJ} 
            icon="🎯" 
            onClick={() => setShowOBJ(prev => !prev)} 
            activeColor={objActiveColor}
          />
        </div>
      </div>

      {/* === Query Content === */}
      <div className="space-y-3">
        {queryMode === 'text' && (
          <textarea
            ref={textareaRef}
            value={query.lang === 'eng' ? query.text : query.origin}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter your query..."
            className={`${inputClass} resize-none flex-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100`}
            rows={7}
          />
        )}

        {queryMode === 'image' && (
          <div className="space-y-3">
            <label
              htmlFor={`file-upload-${index}`}
              className={uploadAreaClass}
            >
              <div className="flex flex-col items-center">
                <span className={uploadIconClass}>
                  {imageFile ? '🔄' : '📸'}
                </span>
                <span className={uploadTextClass}>
                  {imageFile ? 'Change Image' : 'Click to upload image'}
                </span>
              </div>
              <input
                id={`file-upload-${index}`}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {imageFile && (
              <div className="flex justify-center">
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Uploaded preview"
                  className={uploadedImageClass}
                />
              </div>
            )}
          </div>
        )}

        {/* === Feature Input Fields === */}
        {showOCR && (
          <input
            type="text"
            value={query.ocr}
            onChange={(e) => onUpdate(index, { ocr: e.target.value })}
            placeholder="OCR input..."
            className={`${featureInputClass} ${ocrInputClass}`}
          />
        )}

        {showASR && (
          <input
            type="text"
            value={query.asr}
            onChange={(e) => onUpdate(index, { asr: e.target.value })}
            placeholder="ASR input..."
            className={`${featureInputClass} ${asrInputClass}`}
          />
        )}

        {showOBJ && (
          <input
            type="text"
            value={query.obj?.[0] || ''}
            onChange={(e) => onUpdate(index, { obj: [e.target.value] })}
            placeholder="ex: person=8 bicycle<=2"
            className={`${featureInputClass} ${objInputClass}`}
          />
        )}
      </div>

      {/* === Bottom Controls === */}
      <div className={bottomControlsClass}>
        <div>
          {(query.text || query.origin) && queryMode === 'text' && (
           <button
  onClick={async () => {
    const newLang = query.lang === 'eng' ? 'ori' : 'eng';

    if (newLang === 'eng' && query.origin && !query.text) {
      try {
        const translated = await translateText(query.origin.trim());
        onUpdate(index, { text: translated, lang: newLang });
      } catch (err) {
        console.error('Translation failed:', err);
        onUpdate(index, { lang: newLang }); // fallback to just switch lang
      }
    } else {
      onUpdate(index, { lang: newLang });
    }
  }}
  className={languageToggleClass}
>
  {query.lang === 'eng' ? '🇺🇸 ENG' : '🌐 ORI'}
</button>

          )}
        </div>

        <div className="flex gap-2">
          {!disableRemove && (
            <button
              onClick={() => onRemove(index)}
              className={`${actionButtonClass} ${removeButtonClass}`}
              title="Remove query"
            >
              ✕
            </button>
          )}
          <button
            onClick={() => onInsertAfter(index)}
            className={`${actionButtonClass} ${addButtonClass}`}
            title="Add query after"
          >
            ✚
          </button>
        </div>
      </div>
    </div>
  );
};

export default QueryItem; 