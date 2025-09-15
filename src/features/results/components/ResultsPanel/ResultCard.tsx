// components/ResultCard.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ResultItem } from '../../types';
import { Clock, Ban } from 'lucide-react'; 
// --- Style Definitions ---
import {
  cardClass,
  imageClass,
  imageContainerClass,
} from './styles';

// --- Prop Definitions ---
interface ResultCardProps {
  // ✅ CHANGED: We now accept the full item object.
  item: ResultItem;

  loaded: boolean;
  onLoad: (id: string) => void;
  onClick?: (item: ResultItem) => void;
  onDoubleClick?: (item: ResultItem) => void;
  onContextMenu?: (item: ResultItem, event: React.MouseEvent) => void;
  onSimilaritySearch?: (imageSrc: string, cardId: string) => void;
  
  // ✅ CHANGED: The signature is now explicit: it provides the item.
  onSubmit?: (item: ResultItem) => void;
  onSending?: (item: ResultItem) => void;
  onDislike?: (item: ResultItem) => void;
  
  priority?: boolean;
  alt?: string;
  showConfidence?: boolean;
  showTimestamp?: boolean;
  isSelected?: boolean;
  disabled?: boolean;
  imageClassName?: string;
  submissionStatus?: 'PENDING' | 'WRONG';
}

// ✅ REFACTORED: This component is now cleaner and more robust.

const ResultCard: React.FC<ResultCardProps> = ({
  item,
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
  submissionStatus
}) => {
  const { id, thumbnail, title, confidence, timestamp } = item;

  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // This ref is used to manage the timer for detecting double-clicks.
  const clickTimeout = useRef<number | null>(null);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
      }
    };
  }, []);

  // --- Event Handlers ---

  const handleImageLoad = useCallback(() => onLoad(id), [id, onLoad]);
  const handleImageError = useCallback(() => setImageError(true), []);

 // ✅ FIXED: All handlers now pass the 'item' object back up to the parent.
 const handleClick = useCallback((e: React.MouseEvent) => {
  if (disabled) return;
  const isCtrl = e.ctrlKey || e.metaKey;

  if (isCtrl && onSimilaritySearch) {
    e.preventDefault();
    onSimilaritySearch(thumbnail, id);
    return;
  }
  
  if (onDoubleClick) {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      onDoubleClick(item); // Pass item
    } else {
      clickTimeout.current = window.setTimeout(() => {
        onClick?.(item); // Pass item
        clickTimeout.current = null;
      }, 250);
    }
  } else {
    onClick?.(item); // Pass item
  }
}, [disabled, onClick, onDoubleClick, onSimilaritySearch, thumbnail, id, item]);

const handleMouseDown = useCallback((e: React.MouseEvent) => {
  if (disabled) return;
  
  const isCtrl = e.ctrlKey || e.metaKey;

  // ✅ FIXED: Pass the 'item' object in the callback.
  if (isCtrl && e.button === 1 && onSubmit) {
    e.preventDefault();
    onSubmit(item);
  }
  else if (isCtrl && e.button === 2 && onDislike) {
    e.preventDefault();
    onDislike(item);
  }
  else if (e.button === 1 && onSending) {
    e.preventDefault();
    onSending(item);
  }
}, [disabled, onSubmit, onDislike, onSending, item]);
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    
    const isCtrl = e.ctrlKey || e.metaKey;
    const isActionKey = e.key === 'Enter' || e.key === ' ';

    if (isActionKey) {
        e.preventDefault();
        if (isCtrl && onSimilaritySearch) {
            onSimilaritySearch(thumbnail, id);
        } else if (onClick) {
            onClick(item);
        }
    }
  }, [onClick, onSimilaritySearch, thumbnail, id, disabled]);
// ✅ SOLUTION: Create an intermediate handler for the context menu
const handleContextMenu = useCallback((event: React.MouseEvent) => {
  // If the card is disabled, do nothing.
  if (disabled) {
    event.preventDefault(); // Still a good idea to prevent the default menu
    return;
  }
  
  // Call the onContextMenu prop passed from the parent,
  // providing it with BOTH the item and the event.
  onContextMenu?.(item, event);

}, [disabled, item, onContextMenu]); // Add dependencies for the useCallback hook
  // --- Render Logic (No changes below this line) ---

   // ✅ SOLUTION: Conditionally apply classes based on the submissionStatus prop.
   const cardClasses = [
    cardClass, 'group', 'result-item', 'relative', 'overflow-hidden', 'rounded-lg',
    'transition-all duration-300 ease-out',
    isSelected ? 'ring-2 ring-blue-500 ring-opacity-60' : '',
    disabled ? 'opacity-50 cursor-not-allowed' : (onClick ? 'cursor-pointer' : ''),
    isHovered && !disabled ? 'transform scale-[1.02] shadow-2xl' : 'shadow-lg',
    // --- NEW STATUS STYLES ---
    submissionStatus === 'PENDING' && 'opacity-60', // Reduce opacity for pending
    submissionStatus === 'WRONG' && 'opacity-60 ring-2 ring-red-500', // Opacity + red border for wrong
  ].filter(Boolean).join(' ');

  const imageClasses = [
    imageClassName || '',
    !loaded ? 'opacity-0 scale-[1.05]' : 'opacity-100 scale-100',
    isHovered && !disabled ? 'scale-[1.03]' : '',
  ].filter(Boolean).join(' ');

  const renderStatusIcon = () => {
    if (!submissionStatus) return null;

    // ✅ 2. USE THE IMPORTED LUCIDE COMPONENTS DIRECTLY
    let iconDetails = {
      Icon: null as React.ElementType | null,
      bgColor: '',
      title: '',
    };

    switch (submissionStatus) {
      case 'PENDING':
        iconDetails = { Icon: Clock, bgColor: 'bg-blue-500/80', title: 'Submission Pending' };
        break;
      case 'WRONG':
        iconDetails = { Icon: Ban, bgColor: 'bg-red-500/80', title: 'Incorrect Submission' };
        break;
      default:
        return null;
    }

    const { Icon, bgColor, title } = iconDetails;

    return (
      <div
        title={title}
        className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-white backdrop-blur-sm ${bgColor} pointer-events-none`}
      >
        {Icon && <Icon className="w-4 h-4" />}
      </div>
    );
  };

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
        loading={"lazy"}
        // ✅ CORRECTED: Use camelCase for the JSX prop
        fetchPriority={priority ? "high" : "auto"}        
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
    tabIndex={onClick && !disabled ? 0 : -1}
    onMouseDown={handleMouseDown}
    onClick={disabled ? undefined : handleClick}
    onContextMenu={disabled ? undefined : handleContextMenu}
    onKeyDown={handleKeyDown}
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
    role={onClick ? "button" : undefined}
    aria-label={onClick ? `View ${title}${onSimilaritySearch ? ', Ctrl+click for similarity search' : ''}` : undefined}
    aria-disabled={disabled}
    data-testid={`result-card-${id}`}
  >
    {renderStatusIcon()}
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

      {isSelected && (
        <div className="absolute inset-0 rounded-lg ring-2 ring-blue-400 ring-opacity-75 pointer-events-none" />
      )}
    </div>
  );
};

export default React.memo(ResultCard);