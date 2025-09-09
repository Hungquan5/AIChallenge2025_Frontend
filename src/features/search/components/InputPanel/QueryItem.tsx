// src/features/search/components/InputPanel/QueryItem.tsx

import type { RefObject } from 'react';
import React, { useEffect, useRef, useState } from 'react';
import { isShortcut, SHORTCUTS } from '../../../../utils/shortcuts';
import type { Query, ResultItem} from '../../types';
import type { User } from '../../../communicate/types';
import {
FileText, Image, ScanText, Mic, Target, Filter, Camera, UploadCloud,
Trash2, Globe, Languages, Loader2, Search, XCircle
} from 'lucide-react';

import {
actionButtonClass, addButtonClass, asrActiveColor, asrInputClass, bottomControlsClass,
featureGridClass, featureInputClass, featureToggleActiveClass, featureToggleButtonClass,
featureToggleInactiveClass, imageModeActiveColor, inputClass, languageToggleClass,
modeToggleActiveClass, modeToggleButtonClass, modeToggleInactiveClass, objActiveColor,
objInputClass, ocrActiveColor, ocrInputClass, queryItemContainerClass,
removeButtonClass, textModeActiveColor, uploadAreaClass, uploadedImageClass,
uploadIconClass, uploadTextClass,
} from './styles';

// ============================================================================
// === 1. CHILD COMPONENTS (SmartLanguageToggle MODIFIED) =====================
// ============================================================================

// --- FeatureToggleButton, EnhancedModeToggle, EnhancedFeatureToggles, EnhancedUploadArea are unchanged ---
const FeatureToggleButton = ({ active, icon, onClick, activeColor }: { active: boolean; icon: React.ReactNode; onClick: () => void; activeColor: string; }) => ( <button className={`${featureToggleButtonClass} ${active ? `${activeColor} ${featureToggleActiveClass}` : featureToggleInactiveClass}`} onClick={onClick}> {icon} </button> );
const EnhancedModeToggle = ({ mode, onModeChange }: { mode: 'text' | 'image', onModeChange: (newMode: 'text' | 'image') => void }) => ( <div className="flex items-center gap-1 p-1 bg-slate-100/60 rounded-xl backdrop-blur-sm"> <button className={`${modeToggleButtonClass} ${mode === 'text' ? textModeActiveColor + ' ' + modeToggleActiveClass : modeToggleInactiveClass} transition-all duration-300`} onClick={() => onModeChange('text')}> <FileText className="w-5 h-5" /> </button> <button className={` ${modeToggleButtonClass} ${mode === 'image' ? imageModeActiveColor + ' ' + modeToggleActiveClass : modeToggleInactiveClass} transition-all duration-300`} onClick={() => onModeChange('image')}> <Image className="w-5 h-5" /> </button> </div> );
const EnhancedFeatureToggles = ({ showOCR, showASR, showOBJ, onToggle, query }: { showOCR: boolean; showASR: boolean; showOBJ: boolean; onToggle: (feature: 'ocr' | 'asr' | 'obj') => void; query: Query; }) => { const featureCount = [showOCR && query.ocr, showASR && query.asr, showOBJ && query.obj?.length].filter(Boolean).length; return ( <div className="flex items-center justify-between"> <div className="flex items-center gap-2"> <FeatureToggleButton active={showOCR} icon={<ScanText className="w-5 h-5" />} onClick={() => onToggle('ocr')} activeColor={ocrActiveColor} /> <FeatureToggleButton active={showASR} icon={<Mic className="w-5 h-5" />} onClick={() => onToggle('asr')} activeColor={asrActiveColor} /> <FeatureToggleButton active={showOBJ} icon={<Target className="w-5 h-5" />} onClick={() => onToggle('obj')} activeColor={objActiveColor} /> </div> {featureCount > 0 && ( <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100/60 text-blue-700 text-xs font-medium rounded-full"> <Filter className="w-4 h-4 text-blue-600" /> <span>{featureCount} Filter{featureCount > 1 ? 's' : ''}</span> </div> )} </div> ); };
const EnhancedUploadArea = ({ onImageUpload, imageFile, index }: { onImageUpload: (e: React.ChangeEvent<HTMLInputElement> | { target: { files: File[] | null } }) => void; imageFile: File | null; index: number; }) => { const [isDragging, setIsDragging] = useState(false); const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDragging(true); }; const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDragging(false); }; const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDragging(false); const files = e.dataTransfer.files; if (files.length > 0 && files[0].type.startsWith('image/')) { onImageUpload({ target: { files: Array.from(files) } }); } }; return ( <label htmlFor={`file-upload-${index}`} className={`${uploadAreaClass} ${isDragging ? 'border-purple-500/80 bg-purple-50/80 scale-[1.03]' : ''} relative group`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} > {imageFile ? ( <> <img src={URL.createObjectURL(imageFile)} alt="Uploaded preview" className={uploadedImageClass} /> <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-center justify-center"> <button onClick={(e) => { e.preventDefault(); onImageUpload({ target: { files: null } }) }} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg"> <Trash2 className="w-4 h-4" /> Remove </button> </div> </> ) : ( <div className="flex flex-col items-center pointer-events-none text-slate-500"> {isDragging ? <UploadCloud className="w-10 h-10 mb-2" /> : <Camera className="w-10 h-10 mb-2" />} <span className={uploadTextClass}>{isDragging ? 'Drop image to upload' : 'Click, or Drag & Drop'}</span> </div> )} <input id={`file-upload-${index}`} type="file" accept="image/*" onChange={onImageUpload} className="hidden" /> </label> ); };


// ✅ REFACTORED: SmartLanguageToggle is now simpler and controlled by parent state
const SmartLanguageToggle = ({ query, onToggle, status }: {
query: Query;
onToggle: () => void;
status: 'idle' | 'pending' | 'error';
}) => {
const getButtonContent = () => {
switch (status) {
case 'pending':
return <><Loader2 className="w-5 h-5 animate-spin" /><span className="text-xs">Translating...</span></>;
case 'error':
return <><XCircle className="w-5 h-5 text-red-500" /><span className="text-xs text-red-500">Failed</span></>;
default:
return query.lang === 'eng' ? <><Globe className="w-5 h-5" /><span className="text-xs">English</span></> : <><Languages className="w-5 h-5" /><span className="text-xs">Original</span></>;
}
};

return (
<button onClick={onToggle} disabled={status === 'pending'} className={`${languageToggleClass} ${status === 'pending' ? 'opacity-75 cursor-wait' : ''} flex items-center gap-2 justify-center w-[110px]`}>
{getButtonContent()}
</button>
);
};

const ActionButton = ({ onClick, icon, tooltip, variant = 'default', disabled = false }: { onClick: () => void; icon: React.ReactNode; tooltip: string; variant?: 'default' | 'danger' | 'search'; disabled?: boolean; }) => { const [showTooltip, setShowTooltip] = useState(false); const variantClasses = { default: addButtonClass, danger: removeButtonClass, search: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 hover:shadow-emerald-500/25', }; return ( <div className="relative flex items-center"> <button onClick={onClick} disabled={disabled} className={`${actionButtonClass} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)} onFocus={() => setShowTooltip(true)} onBlur={() => setShowTooltip(false)} > {icon} </button> {showTooltip && ( <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-md whitespace-nowrap z-50 shadow-lg animate-in fade-in-95 slide-in-from-bottom-1"> {tooltip} <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-800"></div> </div> )} </div> ); };
const QueryStatusIndicator = ({ query, mode }: { query: Query; mode: 'text' | 'image' }) => { const getStatus = () => { if (mode === 'image' && query.imageFile) return 'ready'; if (mode === 'text' && (query.text || query.origin)) return 'ready'; if (query.asr || query.ocr || query.obj?.length > 0) return 'partial'; return 'empty'; }; const status = getStatus(); const statusConfig = { ready: { color: 'bg-green-100/80 text-green-800 ring-green-600/20', label: 'Ready', icon: '✓' }, partial: { color: 'bg-yellow-100/80 text-yellow-800 ring-yellow-600/20', label: 'Partial', icon: '⚡' }, empty: { color: 'bg-slate-100/80 text-slate-700 ring-slate-600/10', label: 'Empty', icon: '○' } }; const config = statusConfig[status]; return ( <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ring-1 ${config.color} transition-all`}> <span>{config.icon}</span> <span>{config.label}</span> </div> ); };

// ============================================================================
// === 2. PROPS INTERFACE (MODIFIED) ==========================================
// ============================================================================

type FocusField = 'ocr' | 'asr' | 'obj';
type Mode = 'text' | 'image';

interface QueryItemProps {
index: number;
query: Query;
onFocus?: () => void;
onUpdate: (index: number, updated: Partial<Query>) => void;
onInsertAfter: (index: number) => void;
onRemove: (index: number) => void;
onItemSearch: (index: number) => void;
isSearching: boolean;
disableRemove?: boolean;
onNext?: () => void;
onPrev?: () => void;
inputRef?: RefObject<HTMLTextAreaElement>;
focusRequest: { index: number; field: FocusField } | null;
onFocusRequestConsumed: () => void;
modeChangeRequest: { index: number; mode: Mode } | null;
onModeChangeRequestConsumed: () => void;
user: User | null;
translationStatus: 'idle' | 'pending' | 'error'; // ✅ ADDED
onLanguageToggle: () => void; // ✅ ADDED
}

// ============================================================================
// === 3. CUSTOM HOOK useQueryItem (REMOVED translation logic) ================
// ============================================================================

const useQueryItem = ({ index, query, onUpdate, onInsertAfter, onNext, onPrev }: Omit<QueryItemProps, 'onItemSearch' | 'isSearching' | 'translationStatus' | 'onLanguageToggle'>) => {
const [queryMode, setQueryMode] = useState<'text' | 'image'>(query.imageFile ? 'image' : 'text');
const [showOCR, setShowOCR] = useState(!!query.ocr);
const [showASR, setShowASR] = useState(!!query.asr);
const [showOBJ, setShowOBJ] = useState(!!query.obj?.length);
const [localText, setLocalText] = useState(query.lang === 'eng' ? query.text : query.origin);

useEffect(() => {
    setQueryMode(query.imageFile ? 'image' : 'text');
    setLocalText(query.lang === 'eng' ? query.text : query.origin);
}, [query.imageFile, query.lang, query.text, query.origin]);

const handleModeToggle = (newMode: 'text' | 'image') => {
    setQueryMode(newMode);
    if (newMode === 'text') {
        onUpdate(index, { imageFile: null });
    } else {
        onUpdate(index, { text: '', origin: '', lang: 'ori' });
    }
};

const handleFeatureToggle = (feature: 'ocr' | 'asr' | 'obj') => {
    if (feature === 'ocr') setShowOCR(p => !p);
    if (feature === 'asr') setShowASR(p => !p);
    if (feature === 'obj') setShowOBJ(p => !p);
};

const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement> | { target: { files: File[] | null } }) => {
    const file = e.target.files?.[0];
    onUpdate(index, { imageFile: file || null, text: '', origin: '' });
};

// ✅ REFACTORED: This function now handles the automatic switch back to 'ori' mode.
const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalText(value);

    if (query.lang === 'eng') {
        // If the user clears the input while in English mode,
        // we assume they want to revert to the original language.
        if (value === '') {
            onUpdate(index, { text: '', lang: 'ori' });
        } else {
            onUpdate(index, { text: value });
        }
    } else {
        // In original mode, just update the origin text.
        onUpdate(index, { origin: value, text: '' });
    }
};
const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isShortcut(e, SHORTCUTS.NEW_QUERY)) { e.preventDefault(); onInsertAfter(index); }
    else if (isShortcut(e, SHORTCUTS.NEXT_CELL)) { e.preventDefault(); onNext?.(); }
    else if (isShortcut(e, SHORTCUTS.PREV_CELL)) { e.preventDefault(); onPrev?.(); }
    else if (e.key === 'ArrowDown' && e.currentTarget.selectionStart === e.currentTarget.value.length) { e.preventDefault(); onNext?.(); }
    else if (e.key === 'ArrowUp' && e.currentTarget.selectionStart === 0) { e.preventDefault(); onPrev?.(); }
};

return {
    queryMode, setQueryMode, showOCR, setShowOCR, showASR, setShowASR, showOBJ, setShowOBJ, localText,
    handleModeToggle, handleFeatureToggle, handleImageUpload, handleTextChange, handleKeyDown
};
};

// ============================================================================
// === 4. QueryItem COMPONENT (MODIFIED to pass new props) ====================
// ============================================================================

const QueryItem: React.FC<QueryItemProps> = (props) => {
const { index, query, onUpdate, onFocus, onInsertAfter, onRemove, disableRemove, focusRequest, onFocusRequestConsumed, modeChangeRequest, onModeChangeRequestConsumed, onItemSearch, isSearching, translationStatus, onLanguageToggle } = props;

const {
    queryMode, setQueryMode, showOCR, setShowOCR, showASR, setShowASR, showOBJ, setShowOBJ, localText,
    handleModeToggle, handleFeatureToggle, handleImageUpload, handleTextChange, handleKeyDown
} = useQueryItem(props);

const localTextareaRef = useRef<HTMLTextAreaElement>(null);
const ocrInputRef = useRef<HTMLInputElement>(null);
const asrInputRef = useRef<HTMLInputElement>(null);
const objInputRef = useRef<HTMLInputElement>(null);
const textareaRef = props.inputRef || localTextareaRef;

useEffect(() => { if (focusRequest?.index === index) { const { field } = focusRequest; const focusMap = { ocr: () => { setShowOCR(true); setTimeout(() => ocrInputRef.current?.focus(), 0); }, asr: () => { setShowASR(true); setTimeout(() => asrInputRef.current?.focus(), 0); }, obj: () => { setShowOBJ(true); setTimeout(() => objInputRef.current?.focus(), 0); }, }; focusMap[field]?.(); onFocusRequestConsumed(); } }, [focusRequest, index, onFocusRequestConsumed, setShowASR, setShowOBJ, setShowOCR]);
useEffect(() => { if (modeChangeRequest?.index === index) { setQueryMode(modeChangeRequest.mode); onModeChangeRequestConsumed(); } }, [modeChangeRequest, index, onModeChangeRequestConsumed, setQueryMode]);

return (
    <div className={`${queryItemContainerClass} ${isSearching ? 'opacity-75 pointer-events-none' : ''}`}>
        {isSearching && ( <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl z-20"> <div className="flex items-center gap-3 text-blue-600"> <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div> <span className="text-base font-medium">Searching this item...</span> </div> </div> )}

        <div className="flex items-center justify-between">
            <EnhancedModeToggle mode={queryMode} onModeChange={handleModeToggle} />
            {(query.text || query.origin) && queryMode === 'text' && (
                    <SmartLanguageToggle query={query} onToggle={onLanguageToggle} status={translationStatus} />
                )}
        </div>

        <div className="space-y-4">
            {queryMode === 'text' ? ( <textarea ref={textareaRef} value={localText} onChange={handleTextChange} onKeyDown={handleKeyDown} placeholder="Enter your query..." className={inputClass} rows={4} onFocus={onFocus} /> ) : ( <EnhancedUploadArea onImageUpload={handleImageUpload} imageFile={query.imageFile || null} index={index} /> )}
        </div>

        <div className="space-y-4">
            <EnhancedFeatureToggles showOCR={showOCR} showASR={showASR} showOBJ={showOBJ} onToggle={handleFeatureToggle} query={query} />
            {showOCR && <input ref={ocrInputRef} type="text" value={query.ocr || ''} onChange={(e) => onUpdate(index, { ocr: e.target.value })} placeholder="OCR input..." className={`${featureInputClass} ${ocrInputClass}`} />}
            {showASR && <input ref={asrInputRef} type="text" value={query.asr || ''} onChange={(e) => onUpdate(index, { asr: e.target.value })} placeholder="ASR input..." className={`${featureInputClass} ${asrInputClass}`} />}
            {showOBJ && <input ref={objInputRef} type="text" value={query.obj?.[0] || ''} onChange={(e) => onUpdate(index, { obj: [e.target.value] })} placeholder="ex: person=8 bicycle<=2" className={`${featureInputClass} ${objInputClass}`} />}
        </div>
    </div>
);
};

export default QueryItem;