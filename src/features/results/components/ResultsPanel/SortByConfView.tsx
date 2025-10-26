// src/features/results/components/SortedByConfidenceView.tsx
import React, { useState, useCallback, useMemo, memo, useRef, useLayoutEffect } from 'react';
import type { ResultItem } from '../../types';
import {
gridClass,
noResultsClass,
noResultsHintClass,
noResultsTitleClass,
imageClass,
} from './styles';
import ResultCard from './ResultCard';
// AutoSizer is no longer needed
// import AutoSizer from 'react-virtualized-auto-sizer';
import { Grid } from 'react-window';
import type { CellComponentProps } from 'react-window';

// --- PROPS and CONSTANTS remain the same ---
interface Props {
results: ResultItem[];
onResultClick: (item: ResultItem) => void;
onRightClick: (item: ResultItem, event: React.MouseEvent) => void;
onSimilaritySearch: (imageSrc: string, cardId: string) => void;
onResultDoubleClick: (item: ResultItem) => void;
onSubmission: (item: ResultItem) => void;
onDislike: (item: ResultItem) => void;
currentUser: string;
sendMessage: (message: string) => void;
submissionStatuses: { [key: string]: 'PENDING' | 'WRONG' };
optimisticSubmissions: Set<string>;
}
const CARD_WIDTH = 260;
const CARD_HEIGHT = 152;
const GAP_X = 4;
const GAP_Y = 4;
type CustomCellProps = {
sorted: ResultItem[];
loadedImages: Set<string>;
onLoad: (id: string) => void;
onClick: (item: ResultItem) => void;
onContextMenu: (item: ResultItem, e: React.MouseEvent) => void;
onSimilaritySearch: (src: string, id: string) => void;
onSubmit: (item: ResultItem) => void;
onSending: (item: ResultItem) => void;
onDoubleClick: (item: ResultItem) => void;
onDislike: (item: ResultItem) => void;
submissionStatuses: { [key: string]: 'PENDING' | 'WRONG' };
optimisticSubmissions: Set<string>;
colCount: number;
};

const SortedByConfidenceView: React.FC<Props> = ({
results,
onResultClick,
onRightClick,
onSimilaritySearch,
currentUser,
sendMessage,
onResultDoubleClick,
onSubmission,
submissionStatuses,
optimisticSubmissions,
onDislike,
}) => {
// --- State and Handlers remain the same ---
const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
const gapXRef = useRef(GAP_X);
const gapYRef = useRef(GAP_Y);

const sorted = useMemo(
  () => [...results].sort((a, b) => b.confidence - a.confidence),
  [results]
);
const handleImageLoad = useCallback((id: string) => {
  setLoadedImages((prev) => {
    if (prev.has(id)) return prev;
    const next = new Set(prev);
    next.add(id);
    return next;
  });
}, []);
const handleSending = useCallback(
  (item: ResultItem) => {
    const message = { type: 'broadcast_image', payload: { ...item, submittedBy: currentUser } };
    sendMessage(JSON.stringify(message));
  },
  [currentUser, sendMessage]
);

// --- NEW: Manual measurement logic to replace AutoSizer ---
const containerRef = useRef<HTMLDivElement>(null);
const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

useLayoutEffect(() => {
  // This effect observes the container div and updates dimensions when it changes size.
  const container = containerRef.current;
  if (!container) return;

  const observer = new ResizeObserver(entries => {
    const entry = entries[0];
    if (entry) {
      setDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    }
  });

  observer.observe(container);

  // Cleanup function to stop observing when the component unmounts.
  return () => observer.disconnect();
}, []); // Empty dependency array means this runs once on mount.


if (results.length === 0) {
  return (
    <div className={noResultsClass}>
      <p className={noResultsTitleClass}>No results found</p>
      <p className={noResultsHintClass}>Try adjusting your search terms</p>
    </div>
  );
}



// --- RENDER LOGIC: Uses our manually measured dimensions ---

// ...snip...

// ✅ CHANGED: Reworked dimension calculations to incorporate padding into the cell size.

const { width, height } = dimensions;

// How many columns can we fit, including the right-side padding for each card?
const colCount =
width > 0
? Math.max(1, Math.floor(width / (CARD_WIDTH + GAP_X)))
: 1;

const rowCount = Math.ceil(sorted.length / colCount);

// The full width of a grid cell is the available space divided by column count.
const columnWidth =
width > 0 ? Math.floor(width / colCount) : CARD_WIDTH + GAP_X;

// The full height of a grid cell includes the card's height plus the top padding.
const rowHeight = CARD_HEIGHT + GAP_Y;


// ✅ REFACTORED: The Cell component now uses a simpler padding-based approach.
const Cell = memo(
({
columnIndex,
rowIndex,
style,
...cellProps
}: CellComponentProps<CustomCellProps>) => {
const idx = rowIndex * cellProps.colCount + columnIndex;
if (idx >= cellProps.sorted.length) return null;
const item = cellProps.sorted[idx];

const serverStatus = cellProps.submissionStatuses[item.thumbnail];
  const isOptimisticallyPending = cellProps.optimisticSubmissions.has(item.thumbnail);
  const status = serverStatus
    ? serverStatus
    : isOptimisticallyPending
    ? 'PENDING'
    : undefined;

  // This wrapper will fill the grid cell, and we apply padding inside it.
  const paddedStyle: React.CSSProperties = {
    height: '100%',
    width: '100%',
    paddingBottom: `${GAP_Y}px`,
    paddingRight: `${GAP_X}px`,
    boxSizing: 'border-box', // Ensures padding is contained within the element's dimensions
  };

  return (
  <div style={style}>
    <div style={paddedStyle}>
      <ResultCard
        key={item.id}
        item={item}
        loaded={cellProps.loadedImages.has(item.id)}
        onLoad={cellProps.onLoad}
        onClick={cellProps.onClick}
        
        /* ✅ SOLUTION: Pass the stable function reference directly. */
        /* ResultCard's internal `handleContextMenu` will handle the rest. */
        onCardContextMenu={(e) => cellProps.onContextMenu(item, e)}
        onSimilaritySearch={cellProps.onSimilaritySearch}
        onSubmit={cellProps.onSubmit}
        onSending={cellProps.onSending}
        imageClassName={imageClass}
        onDoubleClick={cellProps.onDoubleClick}
        onDislike={cellProps.onDislike}
        submissionStatus={status}
      />
    </div>
  </div>
);
}

);
Cell.displayName = 'VirtualCell';

const cellProps: CustomCellProps = {
sorted,
loadedImages,
onLoad: handleImageLoad,
onClick: onResultClick,
onContextMenu: onRightClick, // (item, event)
onSimilaritySearch,
onSubmit: onSubmission,
onSending: handleSending,
onDoubleClick: onResultDoubleClick,
onDislike,
submissionStatuses,
optimisticSubmissions,
colCount,
};

return (
<div ref={containerRef} className="flex-grow min-h-0 w-full h-full">
{width > 0 && height > 0 && (
<Grid
className="no-scrollbar" 
style={{width, height}}
columnCount={colCount}
rowCount={rowCount}
// ✅ CHANGED: Pass the new calculated cell dimensions to the grid.
columnWidth={columnWidth}
rowHeight={rowHeight}
cellComponent={Cell}
cellProps={cellProps}
overscanCount={2}
/>
)}
</div>
);

};

export default memo(SortedByConfidenceView);