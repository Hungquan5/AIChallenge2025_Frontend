// src/features/search/components/InputPanel/QueryItem.tsx

import type { RefObject } from 'react';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { isShortcut, SHORTCUTS } from '../../../../utils/shortcuts';
import type { Query } from '../../types';
import type { User } from '../../../communicate/types';
import {
    FileText, Image, ScanText, Mic, Target, Filter, Camera, UploadCloud,
    Trash2
} from 'lucide-react';
import { urlToFile } from '../../../../utils/urlToFiles';
import {
    featureToggleButtonClass, featureToggleActiveClass, featureToggleInactiveClass,
    imageModeActiveColor, inputClass, 
    modeToggleActiveClass, modeToggleButtonClass, modeToggleInactiveClass,
    ocrActiveColor, ocrInputClass, asrActiveColor, asrInputClass, objActiveColor, objInputClass,
    queryItemContainerClass, textModeActiveColor, uploadAreaClass, uploadedImageClass,
    featureInputClass
} from './styles';

// ============================================================================
// === 1. CHILD COMPONENTS & ICONS (STABLE & MEMOIZED) ========================
// ============================================================================

const ocrIcon = <ScanText className="w-5 h-5" />;
const asrIcon = <Mic className="w-5 h-5" />;
const objIcon = <Target className="w-5 h-5" />;

const FeatureToggleButton = ({ active, icon, onClick, activeColor }: { active: boolean; icon: React.ReactNode; onClick: () => void; activeColor: string; }) => (
    <button className={`${featureToggleButtonClass} ${active ? `${activeColor} ${featureToggleActiveClass}` : featureToggleInactiveClass}`} onClick={onClick}>
        {icon}
    </button>
);
const MemoizedFeatureToggleButton = React.memo(FeatureToggleButton);

const EnhancedModeToggle = ({ mode, onModeChange }: { mode: 'text' | 'image', onModeChange: (newMode: 'text' | 'image') => void }) => (
    <div className="flex items-center gap-1 p-1 bg-slate-100/60 rounded-xl backdrop-blur-sm">
        <button className={`${modeToggleButtonClass} ${mode === 'text' ? textModeActiveColor + ' ' + modeToggleActiveClass : modeToggleInactiveClass} transition-all duration-300`} onClick={() => onModeChange('text')}> <FileText className="w-5 h-5" /> </button>
        <button className={` ${modeToggleButtonClass} ${mode === 'image' ? imageModeActiveColor + ' ' + modeToggleActiveClass : modeToggleInactiveClass} transition-all duration-300`} onClick={() => onModeChange('image')}> <Image className="w-5 h-5" /> </button>
    </div>
);
const MemoizedEnhancedModeToggle = React.memo(EnhancedModeToggle);
// Add this type:
type EnhancedFeatureTogglesProps = {
  showOCR: boolean;
  showASR: boolean;
  showOBJ: boolean;
  onToggle: (feature: "ocr" | "asr" | "obj") => void;
  query: Query;
};
const EnhancedFeatureToggles = ({
  showOCR,
  showASR,
  showOBJ,
  onToggle,
  query,
}: EnhancedFeatureTogglesProps) => {
    const featureCount = [showOCR && query.ocr, showASR && query.asr, showOBJ && query.obj?.length].filter(Boolean).length;
    const handleToggleOCR = useCallback(() => onToggle('ocr'), [onToggle]);
    const handleToggleASR = useCallback(() => onToggle('asr'), [onToggle]);
    const handleToggleOBJ = useCallback(() => onToggle('obj'), [onToggle]);

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <MemoizedFeatureToggleButton active={showOCR} icon={ocrIcon} onClick={handleToggleOCR} activeColor={ocrActiveColor} />
                <MemoizedFeatureToggleButton active={showASR} icon={asrIcon} onClick={handleToggleASR} activeColor={asrActiveColor} />
                <MemoizedFeatureToggleButton active={showOBJ} icon={objIcon} onClick={handleToggleOBJ} activeColor={objActiveColor} />
            </div>
            {featureCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100/60 text-blue-700 text-xs font-medium rounded-full">
                    <Filter className="w-4 h-4 text-blue-600" />
                    <span>{featureCount} Filter{featureCount > 1 ? 's' : ''}</span>
                </div>
            )}
        </div>
    );
};
const MemoizedEnhancedFeatureToggles = React.memo(EnhancedFeatureToggles);

const EnhancedUploadArea = ({
  onImageUpload,
  imageFile,
  index,
}: {
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement> | { target: { files: File[] | null } }) => void;
  imageFile: File | null;
  index: number;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  const [previewSrc, setPreviewSrc] = React.useState<string>("");

  // ✅ Safe in Strict Mode: create once per file, revoke in cleanup
  React.useEffect(() => {
    if (!imageFile) { setPreviewSrc(""); return; }
    const url = URL.createObjectURL(imageFile);
    setPreviewSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);


  useEffect(() => {
    return () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); };
  }, []);

  const importFromUrl = useCallback(async (raw: string) => {
    const url = raw?.trim();
    if (!url) return;
    try {
      const file = await urlToFile(url);
      onImageUpload({ target: { files: [file] } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      alert(`Could not import image from URL: ${msg}`);
    }
  }, [onImageUpload]);

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault(); setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault(); setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault(); setIsDragging(false);

    // 1) File(s)
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0].type?.startsWith?.('image/')) {
      onImageUpload({ target: { files: [files[0]] } });
      return;
    }
    // 2) URL (text/uri-list or text/plain)
    const uri = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (uri) importFromUrl(uri);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLLabelElement>) => {
    // Prefer pasted image file
    const items = e.clipboardData?.items;
    if (items) {
      for (const it of items) {
        if (it.kind === 'file') {
          const f = it.getAsFile();
          if (f && f.type.startsWith('image/')) {
            onImageUpload({ target: { files: [f] } });
            return;
          }
        }
      }
    }
    // Fallback: pasted URL/text
    const text = e.clipboardData?.getData('text/plain');
    if (text) importFromUrl(text);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    onImageUpload({ target: { files: f ? [f] : null } });
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.preventDefault();
    onImageUpload({ target: { files: null } });
  };

  return (
    <label
      htmlFor={`file-upload-${index}`}
      className={`${uploadAreaClass} ${isDragging ? 'border-purple-500/80 bg-purple-50/80 scale-[1.03]' : ''} relative group`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
      title="Click to upload, or drag & drop / paste image or URL"
    >
      {imageFile ? (
        <>
          <img src={previewSrc} alt="Uploaded preview" className={uploadedImageClass} />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-center justify-center">
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg"
            >
              <Trash2 className="w-4 h-4" /> Remove
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center pointer-events-none text-slate-500">
          {isDragging ? <UploadCloud className="w-10 h-10 mb-2" /> : <Camera className="w-10 h-10 mb-2" />}
          <span className="text-sm font-semibold">Click / Drag & Drop / Paste</span>
        </div>
      )}
      <input
        id={`file-upload-${index}`}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </label>
  );
};
const MemoizedEnhancedUploadArea = React.memo(EnhancedUploadArea);


// ============================================================================
// === 2. PROPS INTERFACE =====================================================
// ============================================================================

type FocusField = 'ocr' | 'asr' | 'obj';
type Mode = 'text' | 'image';

interface QueryItemProps {
    index: number;
    query: Query;
    onFocus?: (index: number) => void;
    onUpdate: (index: number, updated: Partial<Query>) => void;
    onInsertAfter: (index: number) => void;
    onRemove: (index: number) => void;
    onItemSearch: (index: number) => void;
    onLanguageToggle: (index: number) => void;
    onNext?: (index: number) => void;
    onPrev?: (index: number) => void;
    isSearching: boolean;
    disableRemove?: boolean;
    inputRef?: RefObject<HTMLTextAreaElement>;
    focusRequest: { index: number; field: FocusField } | null;
    onFocusRequestConsumed: () => void;
    modeChangeRequest: { index: number; mode: Mode } | null;
    onModeChangeRequestConsumed: () => void;
    user: User | null;
    translationStatus: 'idle' | 'pending' | 'error';
}

// ============================================================================
// === 3. QueryItem COMPONENT WITH DEBOUNCING =================================
// ============================================================================

const QueryItem: React.FC<QueryItemProps> = (props) => {
    const {
        index, query, onUpdate, onFocus, onInsertAfter, onNext, onPrev,
        focusRequest, onFocusRequestConsumed, modeChangeRequest, onModeChangeRequestConsumed,
        isSearching, 
    } = props;

    // --- Refs ---
    const localTextareaRef = useRef<HTMLTextAreaElement>(null);
    const ocrInputRef = useRef<HTMLInputElement>(null);
    const asrInputRef = useRef<HTMLInputElement>(null);
    const objInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = props.inputRef || localTextareaRef;
    const debounceTimeoutRef = useRef<number | null>(null);

    // --- Local State ---
    const [queryMode, setQueryMode] = useState<'text' | 'image'>(query.imageFile ? 'image' : 'text');
    const [showOCR, setShowOCR] = useState(!!query.ocr);
    const [showASR, setShowASR] = useState(!!query.asr);
    const [showOBJ, setShowOBJ] = useState(!!query.obj?.length);
    const [localText, setLocalText] = useState(query.lang === 'eng' ? query.text : query.origin);

    // --- Sync local state from props ---
    useEffect(() => {
        // Sync local text only if it differs from the prop to avoid cursor jumps
        const propText = query.lang === 'eng' ? query.text : query.origin;
        if (propText !== localText) {
            setLocalText(propText);
        }
    }, [query.text, query.origin, query.lang]);

    useEffect(() => {
        setQueryMode(query.imageFile ? 'image' : 'text');
    }, [query.imageFile]);

    // --- Debounced Update Effect ---
    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = window.setTimeout(() => {
            const propText = query.lang === 'eng' ? query.text : query.origin;
            if (localText !== propText) {
                if (query.lang === 'eng') {
                    if (localText === '') {
                        onUpdate(index, { text: '', origin: query.origin, lang: 'ori' });
                    } else {
                        onUpdate(index, { text: localText });
                    }
                } else {
                    onUpdate(index, { origin: localText, text: '' });
                }
            }
        }, 100); // 300ms delay

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [localText, query.lang, index, onUpdate, query.origin, query.text]);

    // --- Stable Handlers ---
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalText(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (isShortcut(e, SHORTCUTS.NEW_QUERY)) { e.preventDefault(); onInsertAfter(index); }
        else if (isShortcut(e, SHORTCUTS.NEXT_CELL)) { e.preventDefault(); onNext?.(index); }
        else if (isShortcut(e, SHORTCUTS.PREV_CELL)) { e.preventDefault(); onPrev?.(index); }
    };



    const handleModeToggle = useCallback((newMode: 'text' | 'image') => {
        setQueryMode(newMode);
        if (newMode === 'text') onUpdate(index, { imageFile: null });
        else onUpdate(index, { text: '', origin: '', lang: 'ori' });
    }, [index, onUpdate]);

    const handleFeatureToggle = useCallback((feature: 'ocr' | 'asr' | 'obj') => {
        if (feature === 'ocr') setShowOCR(p => !p);
        if (feature === 'asr') setShowASR(p => !p);
        if (feature === 'obj') setShowOBJ(p => !p);
    }, []);
    
    // QueryItem.tsx (unchanged handler)
const handleImageUpload = useCallback(
  (e: React.ChangeEvent<HTMLInputElement> | { target: { files: File[] | null } }) => {
    const file = e.target.files?.[0] || null;
    onUpdate(index, { imageFile: file, text: '', origin: '' });
  },
  [index, onUpdate]
);

    // --- Effects for focus requests ---
    useEffect(() => { if (focusRequest?.index === index) { const { field } = focusRequest; const focusMap = { ocr: () => { setShowOCR(true); setTimeout(() => ocrInputRef.current?.focus(), 0); }, asr: () => { setShowASR(true); setTimeout(() => asrInputRef.current?.focus(), 0); }, obj: () => { setShowOBJ(true); setTimeout(() => objInputRef.current?.focus(), 0); }, }; focusMap[field]?.(); onFocusRequestConsumed(); } }, [focusRequest, index, onFocusRequestConsumed]);
    useEffect(() => { if (modeChangeRequest?.index === index) { setQueryMode(modeChangeRequest.mode); onModeChangeRequestConsumed(); } }, [modeChangeRequest, index, onModeChangeRequestConsumed]);

    return (
        <div className={`${queryItemContainerClass} ${isSearching ? 'opacity-75 pointer-events-none' : ''}`}>
            {isSearching && (<div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl z-20"> <div className="flex items-center gap-3 text-blue-600"> <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div> <span className="text-base font-medium">Searching...</span> </div> </div>)}

            <div className="flex items-center justify-between">
                <MemoizedEnhancedModeToggle mode={queryMode} onModeChange={handleModeToggle} />
            </div>

            <div className="space-y-4">
                {queryMode === 'text' ? (
                    <textarea ref={textareaRef} value={localText} onChange={handleTextChange} onKeyDown={handleKeyDown} placeholder="Enter your query..." className={inputClass} rows={4} onFocus={() => onFocus?.(index)} />
                ) : (
                    <MemoizedEnhancedUploadArea
  onImageUpload={handleImageUpload}   // ✅ prop name matches component
  imageFile={query.imageFile || null}
  index={index}
/>
                )}
            </div>

            <div className="space-y-4">
                <MemoizedEnhancedFeatureToggles showOCR={showOCR} showASR={showASR} showOBJ={showOBJ} onToggle={handleFeatureToggle} query={query} />
                {showOCR && <input ref={ocrInputRef} type="text" value={query.ocr || ''} onChange={(e) => onUpdate(index, { ocr: e.target.value })} placeholder="OCR input..." className={`${featureInputClass} ${ocrInputClass}`} />}
                {showASR && <input ref={asrInputRef} type="text" value={query.asr || ''} onChange={(e) => onUpdate(index, { asr: e.target.value })} placeholder="ASR input..." className={`${featureInputClass} ${asrInputClass}`} />}
                {showOBJ && <input ref={objInputRef} type="text" value={query.obj?.[0] || ''} onChange={(e) => onUpdate(index, { obj: [e.target.value] })} placeholder="ex: person=8 bicycle<=2" className={`${featureInputClass} ${objInputClass}`} />}
            </div>
        </div>
    );
};

export default React.memo(QueryItem);