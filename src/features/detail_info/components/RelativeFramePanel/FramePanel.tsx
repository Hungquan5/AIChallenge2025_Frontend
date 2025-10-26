// src/features/detail_info/components/RelativeFramePanel/FramePanel.tsx

import React, { useRef, useEffect, useLayoutEffect, useMemo, useCallback, memo, useState } from 'react';
import { getImageUrl } from '../../../../utils/getImageURL';
import type { ResultItem } from '../../../results/types';
import ResultCard from '../../../results/components/ResultsPanel/ResultCard';
import { Grid } from 'react-window';
import type { GridImperativeAPI, CellComponentProps as ReactWindowCellProps } from 'react-window';
import { X } from 'lucide-react';
import { useDebouncedCallback } from '../../../../utils/useDebounceCallback';
import * as styles from './styles';

// --- PROPS, CONSTANTS, and CELL definition (Unchanged) ---
// ... (no changes in this section)
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

const CARD_WIDTH = 220;
const CARD_HEIGHT = 140;
const GAP_X = 12;
const GAP_Y = 12;

type CustomCellData = {
  frames: ResultItem[];
  activeFrameId: string | number | null;
  onFrameClick: (item: ResultItem) => void;
  onRightClick: (item: ResultItem, event: React.MouseEvent) => void;
  onSimilaritySearch: (imageSrc: string, cardId: string) => void;
  onSubmission: (item: ResultItem) => void;
  handleSending: (item: ResultItem) => void;
  onResultDoubleClick: (item: ResultItem) => void;
  rowCount: number;
};

type CellProps = ReactWindowCellProps<CustomCellData>;

const Cell = memo(({ columnIndex, rowIndex, style, ...cellData }: CellProps) => {
  const { frames, rowCount, activeFrameId, ...handlers } = cellData;
  const idx = columnIndex * rowCount + rowIndex;
  if (idx >= frames.length) return null;

  const frame = frames[idx];
  const isActive = frame.timestamp === activeFrameId?.toString();
  const itemWithDetails = useMemo(() => ({
    ...frame,
    thumbnail: getImageUrl(frame.videoId, frame.thumbnail),
    title: `${frame.timestamp}`,
  }), [frame]);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    setIsImageLoaded(false);
    const img = new Image();
    img.src = itemWithDetails.thumbnail;
    img.onload = () => setIsImageLoaded(true);
  }, [itemWithDetails.thumbnail]);

  const paddedStyle: React.CSSProperties = {
    ...style,
    paddingRight: `${GAP_X}px`,
    paddingBottom: `${GAP_Y}px`,
    boxSizing: 'border-box',
    transition: 'opacity 300ms ease-in-out',
    opacity: isImageLoaded ? 1 : 0,
    backgroundColor: '#e0e0e0',
  };

  return (
    <div style={paddedStyle}>
      <ResultCard
        key={frame.id}
        item={itemWithDetails}
        loaded={isImageLoaded} 
        onLoad={() => {}}
        onClick={handlers.onFrameClick}
        onContextMenu={handlers.onRightClick}
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
});
Cell.displayName = 'FrameCell';


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

  const scrollStateRef = useRef<{ 
    prevFrameCount: number;
    scrollLeft?: number;
    scrollWidth?: number;
  } | null>(null);

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

  // useEffect(() => {
  //   if (!activeFrameId || !gridRef.current || frames.length === 0) return;
  //   const activeIndex = frames.findIndex(f => f.timestamp === activeFrameId.toString());
  //   if (activeIndex !== -1) {
  //     const columnIndex = Math.floor(activeIndex / rowCount);
  //     gridRef.current.scrollToCell({ columnIndex, rowIndex: 0, columnAlign: 'center' });
  //   }
  // }, [activeFrameId, frames.length, rowCount]);

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

  // ✅ 1. Add a Wheel event handler to translate vertical scroll to horizontal
  const handleWheelScroll = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    // Get the scrollable element from the grid's imperative API
    const scrollableElement = gridRef.current?.element;

    if (scrollableElement) {
      // Prevent the default vertical page scroll
      event.preventDefault();

      // Apply the vertical scroll delta (event.deltaY) to the horizontal scroll position (scrollLeft)
      // We also add deltaX to naturally support trackpads and mice with tilt wheels.
      scrollableElement.scrollLeft += event.deltaY + event.deltaX;
    }
  }, []); // No dependencies needed as gridRef is a stable ref

  const cellProps = useMemo(() => ({
    frames, rowCount, activeFrameId, onFrameClick, onRightClick, onSimilaritySearch, onSubmission, handleSending, onResultDoubleClick
  }), [frames, rowCount, activeFrameId, onFrameClick, onRightClick, onSimilaritySearch, onSubmission, handleSending, onResultDoubleClick]);

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

        {/* --- Panel Body --- */}
        <div
          ref={containerRef}
          className={styles.panelBodyClass}
          // ✅ 2. Attach the onWheel handler to the Grid's container
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
                  onScroll={onScroll}
                  style={{ width, height }}
                  columnCount={colCount}
                  rowCount={rowCount}
                  columnWidth={columnWidth}
                  rowHeight={rowHeight}
                  cellProps={cellProps}
                  cellComponent={Cell}
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