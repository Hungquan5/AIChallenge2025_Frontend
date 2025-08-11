import type { RefObject } from 'react';
import React, { useEffect, useRef, useState } from 'react';
import { isShortcut, SHORTCUTS } from '../../../../utils/shortcuts';
import type { Query, ResultItem } from '../../types';
import { searchBySingleQuery, translateText } from '../SearchRequest/searchApi';
import { fileToBase64 } from '../../../../utils/fileConverter'; // Assuming this utility exists
import { Filter } from 'lucide-react';


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
  uploadTextClass,
} from './styles';

// --- ENHANCED COMPONENT DEFINITIONS (Copied from your suggestions) ---

// ✅ FIX: ADD THE MISSING FeatureToggleButton DEFINITION HERE
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

// #1: Loading state is handled inside the main component
// #2: Enhanced Mode Toggle
const EnhancedModeToggle = ({ mode, onModeChange }: { mode: 'text' | 'image', onModeChange: (newMode: 'text' | 'image') => void }) => (
  <div className="flex items-center gap-1 p-1 bg-slate-100/60 rounded-xl backdrop-blur-sm">
    <button
      className={`${modeToggleButtonClass} ${mode === 'text' ? textModeActiveColor + ' ' + modeToggleActiveClass : modeToggleInactiveClass} transition-all duration-300`}
      onClick={() => onModeChange('text')}
    >
      <span className="flex items-center gap-1.5">
        📝
      </span>
    </button>
    <button
      className={` ${modeToggleButtonClass} ${mode === 'image' ? imageModeActiveColor + ' ' + modeToggleActiveClass : modeToggleInactiveClass} transition-all duration-300`}
      onClick={() => onModeChange('image')}
    >
      <span className="flex items-center gap-1.5">
        🖼️
      </span>
    </button>
  </div>
);

// #3: Feature Toggle with Badges
const EnhancedFeatureToggles = ({ showOCR, showASR, showOBJ, onToggle, query }: {
  showOCR: boolean;
  showASR: boolean;
  showOBJ: boolean;
  onToggle: (feature: 'ocr' | 'asr' | 'obj') => void;
  query: Query;
}) => {
  const getFeatureCount = () => {
    let count = 0;
    if (showOCR && query.ocr) count++;
    if (showASR && query.asr) count++;
    if (showOBJ && query.obj?.length) count++;
    return count;
  };
  const featureCount = getFeatureCount();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <FeatureToggleButton active={showOCR} icon="📄" onClick={() => onToggle('ocr')} activeColor={ocrActiveColor} />
        <FeatureToggleButton active={showASR} icon="🎤" onClick={() => onToggle('asr')} activeColor={asrActiveColor} />
        <FeatureToggleButton active={showOBJ} icon="🎯" onClick={() => onToggle('obj')} activeColor={objActiveColor} />
      </div>
      {featureCount > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100/60 text-blue-700 text-xs font-medium rounded-full">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          <Filter className="w-5 h-5 text-gray-600" />

        </div>
      )}
    </div>
  );
};

// #4: Enhanced Upload Area
const EnhancedUploadArea = ({ onImageUpload, imageFile, index }: {
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement> | { target: { files: File[] | null } }) => void;
  imageFile: File | null;
  index: number;
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      onImageUpload({ target: { files: Array.from(files) } });
    }
  };

  return (
    // The <label> is now the main container for everything.
    <label
      htmlFor={`file-upload-${index}`}
      className={`${uploadAreaClass} ${isDragging ? 'border-purple-500/80 bg-purple-50/80 scale-[1.03]' : ''} relative group`} // Added relative and group
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {imageFile ? (
        // STATE 1: An image has been uploaded
        <>
          <img 
            src={URL.createObjectURL(imageFile)} 
            alt="Uploaded preview" 
            className={uploadedImageClass} // This class will make it fill the area
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-center justify-center">
             {/* This button now sits on top of the image on hover */}
            <button
              onClick={(e) => {
                e.preventDefault(); // Prevent label from triggering file input
                onImageUpload({ target: { files: null } })
              }}
              className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg"
            >
              Remove
            </button>
          </div>
        </>
      ) : (
        // STATE 2: No image, show the upload prompt
        <div className="flex flex-col items-center pointer-events-none">
          <span className={uploadIconClass}>{isDragging ? '📤' : '📸'}</span>
          <span className={uploadTextClass}>{isDragging ? 'Drop image here' : 'Upload & Drag & Drop'}</span>
        </div>
      )}

      {/* The actual file input remains hidden */}
      <input id={`file-upload-${index}`} type="file" accept="image/*" onChange={onImageUpload} className="hidden" />
    </label>
  );
};


// #5: Smart Language Toggle
const SmartLanguageToggle = ({ query, onUpdate, index }: {
  query: Query;
  onUpdate: (index: number, updated: Partial<Query>) => void;
  index: number;
}) => {
  const [isTranslating, setIsTranslating] = useState(false);

  const handleLanguageToggle = async () => {
    const newLang = query.lang === 'eng' ? 'ori' : 'eng';
    if (newLang === 'eng' && query.origin && !query.text) {
      setIsTranslating(true);
      try {
        const translated = await translateText(query.origin.trim());
        onUpdate(index, { text: translated, lang: newLang });
      } catch (err) {
        console.error('Translation failed:', err);
        onUpdate(index, { lang: newLang }); // fallback
      } finally {
        setIsTranslating(false);
      }
    } else {
      onUpdate(index, { lang: newLang });
    }
  };

  return (
    <button onClick={handleLanguageToggle} disabled={isTranslating} className={`${languageToggleClass} ${isTranslating ? 'opacity-75 cursor-wait' : ''} flex items-center gap-2 justify-center`}>
      {isTranslating ? (
        <>
          <div className="w-4 h-4 border-2 border-slate-400/50 border-t-slate-600 rounded-full animate-spin"></div>
          <span className="text-xs">Translating...</span>
        </>
      ) : (
        <span>{query.lang === 'eng' ? '🇺🇸' : '🌐'}</span>
      )}
    </button>
  );
};


// #6: Enhanced Action Buttons
const ActionButton = ({ onClick, icon, tooltip, variant = 'default', disabled = false }: {
  onClick: () => void;
  icon: string;
  tooltip: string;
  variant?: 'default' | 'danger' | 'search';
  disabled?: boolean;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const variantClasses = {
    default: addButtonClass,
    danger: removeButtonClass,
    search: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 hover:shadow-emerald-500/25',
  };

  return (
    <div className="relative flex items-center">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${actionButtonClass} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
      >
        {icon}
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-md whitespace-nowrap z-50 shadow-lg animate-in fade-in-95 slide-in-from-bottom-1">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-800"></div>
        </div>
      )}
    </div>
  );
};

// #7: Query Status Indicator
const QueryStatusIndicator = ({ query, mode }: { query: Query; mode: 'text' | 'image' }) => {
  const getStatus = () => {
    if (mode === 'image' && query.imageFile) return 'ready';
    if (mode === 'text' && (query.text || query.origin)) return 'ready';
    if (query.asr || query.ocr || query.obj?.length > 0) return 'partial';
    return 'empty';
  };
  const status = getStatus();
  const statusConfig = {
    ready: { color: 'bg-green-100/80 text-green-800 ring-green-600/20', label: 'Ready', icon: '✓' },
    partial: { color: 'bg-yellow-100/80 text-yellow-800 ring-yellow-600/20', label: 'Partial', icon: '⚡' },
    empty: { color: 'bg-slate-100/80 text-slate-700 ring-slate-600/10', label: 'Empty', icon: '○' }
  };
  const config = statusConfig[status];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ring-1 ${config.color} transition-all`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
};

// --- MAIN QUERY ITEM PROPS & COMPONENT ---

interface QueryItemProps {
  index: number;
  query: Query;
  onFocus?: () => void;
  onUpdate: (index: number, updated: Partial<Query>) => void;
  onInsertAfter: (index: number) => void;
  onRemove: (index: number) => void;
  onSingleSearchResult: (results: ResultItem[]) => void;
  disableRemove?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  inputRef?: RefObject<HTMLTextAreaElement>;
}

const QueryItem: React.FC<QueryItemProps> = ({
  index,
  query,
  onUpdate,
  onFocus,
  onInsertAfter,
  onRemove,
  disableRemove,
  onNext,
  onPrev,
  inputRef,
  onSingleSearchResult
}) => {
  const [queryMode, setQueryMode] = useState<'text' | 'image'>(query.imageFile ? 'image' : 'text');
  const [showOCR, setShowOCR] = useState(!!query.ocr);
  const [showASR, setShowASR] = useState(!!query.asr);
  const [showOBJ, setShowOBJ] = useState(!!query.obj?.length);
  const [isItemSearching, setIsItemSearching] = useState(false); // For item-specific loading
  
  const localTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef || localTextareaRef;

  useEffect(() => {
    // Sync queryMode if the imageFile is added/removed from parent
    setQueryMode(query.imageFile ? 'image' : 'text');
  }, [query.imageFile]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement> | { target: { files: File[] | null } }) => {
    const file = e.target.files?.[0];
    onUpdate(index, { imageFile: file || null, text: '', origin: '' });
  };
  
  const handleModeToggle = (newMode: 'text' | 'image') => {
    setQueryMode(newMode);
    if (newMode === 'text') {
      onUpdate(index, { imageFile: null });
    } else {
      onUpdate(index, { text: '', origin: '', lang: 'ori' });
    }
  };
  
  const handleFeatureToggle = (feature: 'ocr' | 'asr' | 'obj') => {
    if (feature === 'ocr') setShowOCR(prev => !prev);
    if (feature === 'asr') setShowASR(prev => !prev);
    if (feature === 'obj') setShowOBJ(prev => !prev);
  };

  const handleItemSearch = async () => {
    setIsItemSearching(true);
    const { asr, ocr, origin, obj, lang, imageFile, text } = query;
    let finalApiQuery;

    if (imageFile) {
        const image = await fileToBase64(imageFile);
        finalApiQuery = { asr, ocr, origin, obj, lang, text: '', image };
    } else {
        finalApiQuery = { asr, ocr, origin, obj, lang, text, image: '' };
    }

    try {
        const results = await searchBySingleQuery(finalApiQuery);
        onSingleSearchResult(results);
    } catch (error) {
        console.error('Single item search failed:', error);
        alert('Search for this item failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
        setIsItemSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isShortcut(e, SHORTCUTS.NEW_QUERY)) { e.preventDefault(); onInsertAfter(index); }
    else if (isShortcut(e, SHORTCUTS.NEXT_CELL)) { e.preventDefault(); onNext?.(); }
    else if (isShortcut(e, SHORTCUTS.PREV_CELL)) { e.preventDefault(); onPrev?.(); }
    else if (e.key === 'ArrowDown' && e.currentTarget.selectionStart === e.currentTarget.value.length) { e.preventDefault(); onNext?.(); }
    else if (e.key === 'ArrowUp' && e.currentTarget.selectionStart === 0) { e.preventDefault(); onPrev?.(); }
  };


  // ✅ MODIFY THIS FUNCTION
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Check if we are currently in English mode
    if (query.lang === 'eng') {
      // If the user clears the text area, revert the state to 'ori'
      if (value === '') {
        onUpdate(index, { text: '', lang: 'ori' });
      } else {
        // Otherwise, just update the English text
        onUpdate(index, { text: value });
      }
    } else {
      // If in original mode, update the origin text and clear any old translation
      onUpdate(index, { origin: value, text: '' });
    }
  };
  return (
    <div className={`${queryItemContainerClass} ${isItemSearching ? 'opacity-75 pointer-events-none' : ''}`}>
      {/* #1: Loading State Overlay */}
      {isItemSearching && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl z-20">
          <div className="flex items-center gap-3 text-blue-600">
            <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-base font-medium">Searching this item...</span>
          </div>
        </div>
      )}

      {/* --- Top Controls --- */}
      <div className="flex items-center justify-between">
        <EnhancedModeToggle mode={queryMode} onModeChange={handleModeToggle} />
        <QueryStatusIndicator query={query} mode={queryMode} />
      </div>

      {/* --- Query Content --- */}
      <div className="space-y-4">
        {queryMode === 'text' ? (
          <textarea
            ref={textareaRef}
            value={query.lang === 'eng' ? query.text : query.origin}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter your query..."
            className={inputClass}
            rows={4}
            onFocus={onFocus}
          />
        ) : (
          <EnhancedUploadArea onImageUpload={handleImageUpload} imageFile={query.imageFile || null} index={index} />
        )}
      </div>

      {/* --- Feature Toggles & Inputs --- */}
      <div className="space-y-4">
         <EnhancedFeatureToggles showOCR={showOCR} showASR={showASR} showOBJ={showOBJ} onToggle={handleFeatureToggle} query={query} />
        {showOCR && <input type="text" value={query.ocr} onChange={(e) => onUpdate(index, { ocr: e.target.value })} placeholder="OCR input..." className={`${featureInputClass} ${ocrInputClass}`} />}
        {showASR && <input type="text" value={query.asr} onChange={(e) => onUpdate(index, { asr: e.target.value })} placeholder="ASR input..." className={`${featureInputClass} ${asrInputClass}`} />}
        {showOBJ && <input type="text" value={query.obj?.[0] || ''} onChange={(e) => onUpdate(index, { obj: [e.target.value] })} placeholder="ex: person=8 bicycle<=2" className={`${featureInputClass} ${objInputClass}`} />}
      </div>

      {/* --- Bottom Controls --- */}
      <div className={bottomControlsClass}>
        <div className="flex-1">
          {(query.text || query.origin) && queryMode === 'text' && (
            <SmartLanguageToggle query={query} onUpdate={onUpdate} index={index} />
          )}
        </div>

        <div className="flex items-center gap-2">
          <ActionButton onClick={handleItemSearch} icon="🔍" tooltip="Search this item" variant="search" disabled={isItemSearching} />
          <ActionButton onClick={() => onInsertAfter(index)} icon="✚" tooltip="Add query after" />
          {!disableRemove && (
            <ActionButton onClick={() => onRemove(index)} icon="✕" tooltip="Remove query" variant="danger" />
          )}
        </div>
      </div>
    </div>
  );
};

export default QueryItem;