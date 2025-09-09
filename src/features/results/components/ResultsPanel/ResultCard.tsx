// components/ResultCard.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Share2, Search, Send } from 'lucide-react';

// It's highly recommended to use a utility for conditional class names
// for better readability and maintainability.
// You can install it: `npm install clsx` or `yarn add clsx`
// import clsx from 'clsx'; 

// --- Style Definitions (assumed to be in './styles') ---
import {
  cardClass,
  imageClass,
  imageContainerClass,
} from './styles';

// --- Prop Definitions ---
interface ResultCardProps {
  id: string;
  thumbnail: string;
  title: string;
  confidence: number;
  timestamp:string;
  loaded: boolean;
  onLoad: (id: string) => void;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
  onSimilaritySearch?: (imageSrc: string, cardId: string) => void;
  onSubmit?: () => void;
  onSending?: () => void;
  onDislike?: () => void;
  priority?: boolean;
  alt?: string;
  showConfidence?: boolean;
  showTimestamp?: boolean;
  isSelected?: boolean;
  disabled?: boolean;
  imageClassName?: string;
}

// --- Custom Hook for Click Logic ---
// Encapsulates the complexity of distinguishing single vs. double clicks.
const useClickLogic = (
  onClick?: () => void,
  onDoubleClick?: () => void,
  delay = 250
) => {
  const clickTimeout = useRef<number | null>(null);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
      }
    };
  }, []);

  const handleClick = useCallback(() => {
    if (onDoubleClick) {
      if (clickTimeout.current) {
        // Double click detected
        clearTimeout(clickTimeout.current);
        clickTimeout.current = null;
        onDoubleClick();
      } else {
        // Start timer for a potential double click
        clickTimeout.current = window.setTimeout(() => {
          onClick?.();
          clickTimeout.current = null;
        }, delay);
      }
    } else {
      // If no onDoubleClick is provided, just execute onClick
      onClick?.();
    }
  }, [onClick, onDoubleClick, delay]);

  return handleClick;
};


// --- The Refactored Component ---

const ResultCard: React.FC<ResultCardProps> = ({
  id,
  thumbnail,
  title,
  confidence,
  timestamp,
  loaded,
  onLoad,
  onClick,
  onDoubleClick,
  onContextMenu,
  onSimilaritySearch,
  onSubmit,
  onSending,
  onDislike,
  priority = false,
  alt,
  showConfidence = false,
  showTimestamp = false,
  isSelected = false,
  disabled = false,
  imageClassName,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const handleSingleOrDoubleClick = useClickLogic(onClick, onDoubleClick);

  // --- Event Handlers ---

  const handleImageLoad = useCallback(() => onLoad(id), [id, onLoad]);
  const handleImageError = useCallback(() => setImageError(true), []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    const isCtrl = e.ctrlKey || e.metaKey;

    // --- Modifier Key + Click Logic ---
    if (isCtrl) {
      e.preventDefault();
      e.stopPropagation();
      switch (e.button) {
        case 0: onSimilaritySearch?.(thumbnail, id); break; // Ctrl + Left Click
        case 1: onSubmit?.(); break;                       // Ctrl + Middle Click
        case 2: onDislike?.(); break;                      // Ctrl + Right Click
      }
      return; // Stop further processing
    }

    // --- Standard Click Logic (No Modifiers) ---
    if (e.button === 1) { // Middle Click
      e.preventDefault();
      onSending?.();
    }
    // Left and Right clicks are handled by onClick and onContextMenu respectively
  }, [disabled, onSimilaritySearch, onSubmit, onDislike, onSending, thumbnail, id]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    
    const isCtrl = e.ctrlKey || e.metaKey;
    const isActionKey = e.key === 'Enter' || e.key === ' ';

    if (isActionKey) {
        e.preventDefault();
        if (isCtrl && onSimilaritySearch) {
            onSimilaritySearch(thumbnail, id);
        } else if (onClick) {
            onClick();
        }
    }
  }, [onClick, onSimilaritySearch, thumbnail, id, disabled]);

  // --- Render Logic ---

  // Using a library like `clsx` here would be cleaner, but template literals work too.
  const cardClasses = [
    cardClass,
    'group',
    'result-item',
    'relative',
    'overflow-hidden',
    'rounded-lg',
    'transition-all duration-300 ease-out',
    isSelected ? 'ring-2 ring-blue-500 ring-opacity-60' : '',
    disabled ? 'opacity-50 cursor-not-allowed' : (onClick ? 'cursor-pointer' : ''),
    isHovered && !disabled ? 'transform scale-[1.02] shadow-2xl' : 'shadow-lg',
  ].filter(Boolean).join(' ');

  const imageClasses = [
    imageClassName || '',
    !loaded ? 'opacity-0 scale-[1.05]' : 'opacity-100 scale-100',
    isHovered && !disabled ? 'scale-[1.03]' : '',
  ].filter(Boolean).join(' ');


  const renderImage = () => {
    if (imageError) {
      return (
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      );
    }
    return (
      <img
        src={thumbnail}
        alt={alt || title}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={imageClasses}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    );
  };

  return (
    <div
      className={cardClasses}
      tabIndex={disabled ? -1 : 0}
      onMouseDown={handleMouseDown}
      onClick={disabled ? undefined : handleSingleOrDoubleClick}
      onContextMenu={disabled ? undefined : onContextMenu}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={onClick ? "button" : undefined}
      aria-label={onClick ? `View ${title}${onSimilaritySearch ? ', Ctrl+click for similarity search' : ''}` : undefined}
      aria-disabled={disabled}
      data-testid={`result-card-${id}`}
    >
      <div className={imageContainerClass}>
        {renderImage()}
        {!loaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        )}
      </div>

      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ease-out ${isHovered && !disabled ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        <div className="absolute bottom-2 left-2">
          <div className="backdrop-blur-sm bg-black/70 rounded-md px-2 py-1 border border-white/20 shadow-md transform transition-all duration-300 ease-out text-white text-[10px] leading-snug">
            <div className="font-semibold truncate max-w-[100px]">{title}</div>
            <div className="flex items-center gap-2 text-white/80">
              {showConfidence && <span>{(confidence * 100).toFixed(1)}%</span>}
              {showTimestamp && <span>{timestamp}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Focus / Selection Ring */}
      {isSelected && (
        <div className="absolute inset-0 rounded-lg ring-2 ring-blue-400 ring-opacity-75 pointer-events-none" />
      )}
    </div>
  );
};

// By default, React.memo does a shallow comparison of props.
// This is usually sufficient if you ensure that complex props (like onClick functions)
// are memoized in the parent component using `useCallback`.
// This is more robust than a custom comparison function.
export default React.memo(ResultCard);