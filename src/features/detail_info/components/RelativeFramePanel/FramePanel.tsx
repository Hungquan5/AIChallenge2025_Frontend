import React, { useRef, useLayoutEffect, useMemo, useCallback, memo, useState } from 'react';
import { getImageUrl } from '../../../../utils/getImageURL';
import type { ResultItem } from '../../../results/types';
import ResultCard from '../../../results/components/ResultsPanel/ResultCard';
import { Grid } from 'react-window';
// ✅ FIX: The correct type to import for the `cellComponent` pattern
import type { GridImperativeAPI, CellComponentProps } from 'react-window';
import { X } from 'lucide-react';
import { useDebouncedCallback } from '../../../../utils/useDebounceCallback';
import * as styles from './styles';

// --- PROPS INTERFACE (Unchanged) ---
interface FramesPanelProps {
  frames: ResultItem[];
  videoTitle: string;
  isLoading: boolean;
  activeFrameId: string | number | null;
  onClose: () => void;
  onFrameClick: (item: ResultItem) => void;
  onSimilaritySearch: (imageSrc: string, cardId: string) => void;
  onRightClick: (item: ResultItem, event: React.MouseEvent) => void;
  currentUser: string;
  sendMessage: (message: string) => void;
  onSubmission: (item: ResultItem) => void;
  onResultDoubleClick: (item: ResultItem) => void;
  loadNextFrames: () => void;
  hasMoreNext: boolean;
  hasMorePrev: boolean;
  loadPreviousFrames: () => void;
  isFetchingNext: boolean;
  isFetchingPrev: boolean;
}

const CARD_WIDTH = 260;
const CARD_HEIGHT = 120;
const GAP_X = 12;
const GAP_Y = 12;

// --- CELL PROPS & COMPONENT ---
// These are the props that will be passed via `cellProps`
type CustomCellProps = {
  frames: ResultItem[];
  rowCount: number;
  activeFrameId: string | number | null;
  loadedImages: Set<string | number>;
  onLoad: (id: string | number) => void;
  onFrameClick: (item: ResultItem) => void;
  onRightClick: (item: ResultItem, event: React.MouseEvent) => void;
  onSimilaritySearch: (imageSrc: string, cardId: string) => void;
  onSubmission: (item: ResultItem) => void;
  handleSending: (item: ResultItem) => void;
  onResultDoubleClick: (item: ResultItem) => void;
};

// ✅ FIX: The Cell now correctly uses CellComponentProps.
// It destructures props directly, NOT from a `data` object. This resolves the first error.
const Cell = memo(
  ({
    columnIndex,
    rowIndex,
    style,
    ...cellData // The rest of the props from `cellProps` are spread here
  }: CellComponentProps<CustomCellProps>) => {
    const {
      frames,
      rowCount,
      activeFrameId,
      loadedImages,
      onLoad,
      ...handlers
    } = cellData;

    const idx = columnIndex * rowCount + rowIndex;
    if (idx >= frames.length) return null;

    const frame = frames[idx];
    const isActive = frame.timestamp === activeFrameId?.toString();
    const itemWithDetails = useMemo(() => ({
      ...frame,
      thumbnail: getImageUrl(frame.videoId, frame.timestamp),
      title: `${frame.thumbnail}`,
    }), [frame]);
    
    const isLoaded = loadedImages.has(itemWithDetails.id);

    const paddedStyle: React.CSSProperties = {
      ...style,
      paddingRight: `${GAP_X}px`,
      paddingBottom: `${GAP_Y}px`,
      boxSizing: 'border-box',
    };

    return (
      <div style={paddedStyle}>
        <ResultCard
          key={itemWithDetails.id}
          item={itemWithDetails}
          loaded={isLoaded}
          onLoad={() => onLoad(itemWithDetails.id)}
          onClick={handlers.onFrameClick}
          onCardContextMenu={(event) => handlers.onRightClick(itemWithDetails, event)}
          onSimilaritySearch={handlers.onSimilaritySearch}
          onSubmit={handlers.onSubmission}
          onSending={handlers.handleSending}
          onDoubleClick={handlers.onResultDoubleClick}
          showConfidence
          showTimestamp
          isSelected={isActive}
          priority={isActive}
        />
      </div>
    );
  }
);
Cell.displayName = 'FrameCell';


// --- MAIN PANEL COMPONENT ---
const FramesPanel: React.FC<FramesPanelProps> = ({
  frames, videoTitle, isLoading, onClose, onFrameClick, onSimilaritySearch,
  activeFrameId, onRightClick, currentUser, sendMessage, onResultDoubleClick,
  onSubmission, loadNextFrames, loadPreviousFrames, hasMoreNext, hasMorePrev,
  isFetchingNext, isFetchingPrev,
}) => {
  const debouncedLoadNext = useDebouncedCallback(loadNextFrames, 150);
  const debouncedLoadPrev = useDebouncedCallback(loadPreviousFrames, 150);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<GridImperativeAPI>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [loadedImages, setLoadedImages] = useState<Set<string | number>>(new Set());

  const scrollStateRef = useRef<{ 
    prevFrameCount: number;
    scrollLeft?: number;
    scrollWidth?: number;
  } | null>(null);

  const handleImageLoad = useCallback((id: string | number) => {
    setLoadedImages((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const handleSending = useCallback((item: ResultItem) => {
    const message = { type: 'broadcast_image', payload: { ...item, submittedBy: currentUser } };
    sendMessage(JSON.stringify(message));
  }, [currentUser, sendMessage]);
  
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) { setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height }); }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const { width, height } = dimensions;

  const rowCount = useMemo(() => 
    height > 0 ? Math.max(1, Math.floor(height / (CARD_HEIGHT + GAP_Y))) : 1, 
    [height]
  );
  const colCount = Math.ceil(frames.length / rowCount);
  const rowHeight = height > 0 ? Math.floor(height / rowCount) : CARD_HEIGHT + GAP_Y;
  const columnWidth = CARD_WIDTH + GAP_X;

  useLayoutEffect(() => {
    const scrollableElement = gridRef.current?.element;
    if (!scrollableElement || !scrollStateRef.current || frames.length <= scrollStateRef.current.prevFrameCount) {
      scrollStateRef.current = null;
      return;
    }
    const { scrollLeft, scrollWidth } = scrollStateRef.current;
    const newScrollWidth = scrollableElement.scrollWidth;
    const widthAdded = newScrollWidth - (scrollWidth || 0);
    if (widthAdded > 0 && scrollLeft !== undefined) {
      scrollableElement.scrollLeft = scrollLeft + widthAdded;
    }
    scrollStateRef.current = null;
  }, [frames.length]);

  // ✅ FIX: The `onScroll` handler now uses the correct React.UIEvent type.
  // This resolves the second error.
  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, scrollWidth, clientWidth } = event.currentTarget;
    const scrollThreshold = clientWidth * 0.3;

    if (hasMoreNext && !isFetchingNext && scrollLeft + clientWidth >= scrollWidth - scrollThreshold) {
      debouncedLoadNext();
    }
    if (hasMorePrev && !isFetchingPrev && scrollLeft <= scrollThreshold) {
      if (!scrollStateRef.current) {
        scrollStateRef.current = { 
          prevFrameCount: frames.length,
          scrollLeft: scrollLeft,
          scrollWidth: scrollWidth
        };
        debouncedLoadPrev();
      }
    }
  }, [hasMoreNext, hasMorePrev, isFetchingNext, isFetchingPrev, debouncedLoadNext, debouncedLoadPrev, frames.length]);
  
  const handleWheelScroll = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    const scrollableElement = gridRef.current?.element;
    if (scrollableElement) {
      event.preventDefault();
      scrollableElement.scrollLeft += event.deltaY + event.deltaX;
    }
  }, []);

  // This object is passed to `cellProps`
  const cellProps: CustomCellProps = useMemo(() => ({
    frames, rowCount, activeFrameId, loadedImages, 
    onLoad: handleImageLoad, onFrameClick, onRightClick, 
    onSimilaritySearch, onSubmission, handleSending, onResultDoubleClick
  }), [frames, rowCount, activeFrameId, loadedImages, handleImageLoad, onFrameClick, onRightClick, onSimilaritySearch, onSubmission, handleSending, onResultDoubleClick]);

  return (
    <div className={styles.overlayClass} onClick={onClose}>
      <div className={styles.modalClass} onClick={(e) => e.stopPropagation()}>
        <div className={styles.panelHeaderClass}>
          <h2 className={styles.panelTitleClass}>{`Frames from: ${videoTitle}`}</h2>
          {(isFetchingPrev || isFetchingNext) && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className={styles.loadingSpinnerClass} style={{width: '1rem', height: '1rem', borderWidth: '2px'}}></div>
                <span>Loading...</span>
              </div>
          )}
          <button onClick={onClose} className={styles.closeButtonClass} aria-label="Close frames view">
            <X size={18} />
          </button>
        </div>

        <div
          ref={containerRef}
          className={styles.panelBodyClass}
          onWheel={handleWheelScroll}
        >
          {isLoading && frames.length <= 1 ? (
            <div className={styles.loadingContainerClass}><div className={styles.loadingSpinnerClass}></div></div>
          ) : !isLoading && frames.length === 0 ? (
            <div className={styles.noResultsClass}><p className={styles.noResultsTitleClass}>No frames were found for this video.</p></div>
          ) : (
            width > 0 && height > 0 && (
              <Grid
                  gridRef={gridRef}
                  className="no-scrollbar"
                  onScroll={onScroll} // Correctly typed handler
                  style={{ width, height }}
                  columnCount={colCount}
                  rowCount={rowCount}
                  columnWidth={columnWidth}
                  rowHeight={rowHeight}
                  // ✅ FIX: Using the `cellComponent` and `cellProps` API, which works with React.memo
                  cellComponent={Cell}
                  cellProps={cellProps}
                  overscanCount={5}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};
export default memo(FramesPanel);