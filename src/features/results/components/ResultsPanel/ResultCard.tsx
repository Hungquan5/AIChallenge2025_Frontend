// components/ResultCard.tsx
import React, { useState, useCallback,useRef,useEffect } from 'react';
import { Share2, Search, Send } from 'lucide-react'; // Add Send icon
import {
  cardClass,
  imageClass,
  imageContainerClass,
  imageOverlayClass,
} from './styles';
interface Props {
  imageClassName?: string; // ✅ fixed name  
  id: string;
  thumbnail: string;
  title: string;
  confidence: number;
  timestamp: string;
  loaded: boolean;
  onLoad: (id: string) => void;
  onClick?: () => void;
    // ✅ ADD THIS NEW PROP
  onDoubleClick?: () => void; 
  onContextMenu?: (event: React.MouseEvent) => void;
  onSimilaritySearch?: (imageSrc: string, cardId: string) => void; // New prop for similarity search
  onSubmit?: () => void; // Optional submit handler
  onSending?:() =>void ;
  priority?: boolean;
  alt?: string;
  showConfidence?: boolean;
  showTimestamp?: boolean;
  isSelected?: boolean;
  disabled?: boolean;
  onDislike?: () => void; // ✅ ADD THIS NEW PROP

}


const ResultCard: React.FC<Props> = ({
  imageClassName, 
  id,
  thumbnail,
  title,
  confidence,
  timestamp,
  loaded,
  onLoad,
  onClick,
    // ✅ Destructure the new prop
  onDoubleClick,
  onContextMenu,
  onSimilaritySearch,
  onSubmit,
  onSending,
  priority = false,
  alt,
  showConfidence = false,
  showTimestamp = false,
  isSelected = false,
  disabled = false,
onDislike,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const clickTimeout = useRef<number | null>(null);
  // Maintain a local state for selection for submition
  const [isSelectedState, setIsSelectedState] = useState(isSelected);


  const handleImageLoad = useCallback(() => {
    onLoad(id);
  }, [id, onLoad]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);
// Handle submit action, either from onSubmit using middleclick
const handleSubmit = useCallback(() => {
  if (onSubmit) {
    console.log('Submitting result:', id);
    onSubmit();
  } else if (onClick) {
    onClick();
  }
}, [onSubmit, onClick]);
const handleSending = useCallback(()=> {
  if (onSending){
    console.log('Sending Result:', id);
    onSending();
  } else if (onClick){
    onClick();
  }
}, [onSending,onClick])
  // ✅ 2. This is the new, combined click handler logic
  // ✅ SOLUTION: All mouse click logic is now centralized in this single handler.
  const handleInteraction = useCallback((e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    // --- Modifier + Click Logic ---
    const isCtrlPressed = e.ctrlKey || e.metaKey;

    if (isCtrlPressed) {
      e.preventDefault();
      e.stopPropagation(); // Prevent default browser actions for Ctrl+clicks

      switch (e.button) {
        case 0: // Ctrl + Left Click for Similarity Search
          onSimilaritySearch?.(thumbnail, id);
          return;
        case 1: // Ctrl + Middle Click for Submit
          onSubmit?.();
          return;
        case 2: // Ctrl + Right Click for Dislike
          onDislike?.();
          return;
        default:
          return;
      }
    }

    // --- Standard Click Logic (No Modifiers) ---
    switch (e.button) {
      case 0: // Standard Left Click (handles single vs. double click)
        if (onDoubleClick) {
          if (clickTimeout.current) {
            clearTimeout(clickTimeout.current);
            clickTimeout.current = null;
            onDoubleClick();
          } else {
            clickTimeout.current = window.setTimeout(() => {
              onClick?.();
              clickTimeout.current = null;
            }, 250);
          }
        } else {
          onClick?.(); // No double-click handler, so just single-click
        }
        return;

      case 1: // Standard Middle Click for Sending
        e.preventDefault(); // Prevent default middle-click behavior (e.g., auto-scroll)
        onSending?.();
        return;
      
      case 2: // Standard Right Click
        // Let the default context menu behavior happen,
        // which will be handled by the onContextMenu prop passed to the div.
        return;
    }
  }, [
    disabled, 
    onClick, 
    onDoubleClick, 
    onSimilaritySearch, 
    onSubmit, 
    onSending, 
    onDislike,
    thumbnail, 
    id
  ]);
  useEffect(() => {
    return () => {
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
      }
    };
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    
    // Handle Ctrl+Enter or Cmd+Enter for similarity search
    if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || e.key === ' ') && onSimilaritySearch) {
      e.preventDefault();
      onSimilaritySearch(thumbnail, id);
      return;
    }
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  }, [onClick, onSimilaritySearch, thumbnail, id, disabled]);

  
  // The handleContextMenu is now only for the default right-click menu, if provided.
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    // This will now only be called for a standard right-click,
    // as the Ctrl+Right-Click is already handled in onMouseDown.
    onContextMenu?.(e);
  }, [onContextMenu, disabled]);


  const cardClasses = `
    ${cardClass} 
    group 
    result-item 
    relative
    overflow-hidden
    rounded-lg
    ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-60' : ''} 
    ${disabled ? 'opacity-50 cursor-not-allowed' : onClick ? 'cursor-pointer' : ''}
    transition-all duration-300 ease-out
    ${isHovered && !disabled ? 'transform scale-[1.02] shadow-2xl' : 'x-lg'}
  `.trim();

  const imageElement = imageError ? (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  ) : (
    <img
        src={thumbnail}
  alt={alt || title}
  loading={priority ? "eager" : "lazy"}
  decoding="async"
  className={`
  ${imageClassName || ''}
  ${!loaded ? 'opacity-0 scale-[1.05]' : 'opacity-100 scale-100'} 
  ${isHovered && !disabled ? 'scale-[1.03]' : ''}
`}
      onLoad={handleImageLoad}
      onError={handleImageError}
    />
  );

  return (
    <div
      className={cardClasses}
      tabIndex={disabled ? -1 : 0}
      onMouseDown={handleInteraction}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={onClick ? "button" : undefined}
      aria-label={onClick ? `View ${title}${onSimilaritySearch ? ', Ctrl+click for similarity search' : ''}` : undefined}
      aria-disabled={disabled}
      data-testid={`result-card-${id}`}

    >
      {/* Main image container that fills the entire card */}
      <div className={imageContainerClass}>
        {imageElement}
        {!loaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        )}
      </div>

      {/* Elegant hover overlay with blurred corner content */}
      <div className={`
        absolute inset-0 
        pointer-events-none
        transition-all duration-300 ease-out
        ${isHovered && !disabled ? 'opacity-100' : 'opacity-0'}
      `}>
        {/* Subtle dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Corner content container with backdrop blur */}
        <div className="absolute bottom-2 left-2">
          <div className={`
            backdrop-blur-sm bg-black/70 
            rounded-md px-2 py-1 
            border border-white/20
            shadow-md
            transform transition-all duration-300 ease-out
            text-white text-[10px] leading-snug
            ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}
          `}>
            <div className="font-semibold truncate max-w-[100px]">{title}</div>
            <div className="flex items-center gap-2 text-white/80">
              {showConfidence && (
                <span>{(confidence * 100).toFixed(1)}%</span>
              )}
              {showTimestamp && (
                <span>{timestamp}</span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Focus ring for accessibility */}
      <div className={`
        absolute inset-0 rounded-lg
        transition-all duration-200
        ${isSelected ? 'ring-2 ring-blue-400 ring-opacity-75' : ''}
      `} />
    </div>
  );
};

// Enhanced memo comparison for better performance
export default React.memo(ResultCard, (prevProps, nextProps) => {
  // ✅ ADD the new props to this array
  const keysToCompare: (keyof Props)[] = [
    'id', 'thumbnail', 'title', 'confidence', 'timestamp', 
    'loaded', 'priority', 'alt', 'showConfidence', 'showTimestamp', 
    'isSelected', 'disabled',

  ];
  
  // Also compare that the functions haven't changed, which is good practice
  if (
    prevProps.onClick !== nextProps.onClick ||
    prevProps.onSubmit !== nextProps.onSubmit ||
    prevProps.onDoubleClick !== nextProps.onDoubleClick
  ) {
    return false; // Functions are different, so re-render
  }

  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});