// src/features/results/components/SortedByConfidenceView.tsx
import React, { useState, useCallback, useMemo, memo, useRef, useLayoutEffect } from 'react';
import type { ResultItem } from '../../types';
import type { SubmissionStatus } from '../../../communicate/types';

import {
noResultsClass,
noResultsHintClass,
noResultsTitleClass,
imageClass,
} from './styles';
import ResultCard from './ResultCard';
import { Grid } from 'react-window';
import type { CellComponentProps } from 'react-window';

// --- Prop Definitions ---
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
  submissionStatuses: { [key: string]: SubmissionStatus };
// ✅ CHANGED: Update the prop type to reflect the new Map structure.
optimisticSubmissions: Map<string, string>;
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
  submissionStatuses: { [key: string]: SubmissionStatus };
// ✅ CHANGED: Update the internal prop type as well.
optimisticSubmissions: Map<string, string>;
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
const containerRef = useRef<HTMLDivElement>(null);
const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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

useLayoutEffect(() => {
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
  return () => observer.disconnect();
}, []);


if (results.length === 0) {
  return (
    <div className={noResultsClass}>
      <p className={noResultsTitleClass}>No results found</p>
      <p className={noResultsHintClass}>Try adjusting your search terms</p>
    </div>
  );
}

const { width, height } = dimensions;
const colCount =
width > 0
? Math.max(1, Math.floor(width / (CARD_WIDTH + GAP_X)))
: 1;
const rowCount = Math.ceil(sorted.length / colCount);
const columnWidth =
width > 0 ? Math.floor(width / colCount) : CARD_WIDTH + GAP_X;
const rowHeight = CARD_HEIGHT + GAP_Y;


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

// ✅ FIX 4/4: Update the logic to correctly derive status and user from multiple sources
    const serverSubmission = cellProps.submissionStatuses[item.thumbnail];
    const isOptimisticallyPending = cellProps.optimisticSubmissions.has(item.thumbnail);

    const status = serverSubmission
      ? serverSubmission.status // 1. Get status from the server state object
      : isOptimisticallyPending
      ? 'PENDING' // 2. Or, if it's optimistically pending
      : undefined;

    const submittedBy = serverSubmission
      ? serverSubmission.submittedBy // 1. Get user from the server state object
      : isOptimisticallyPending
      ? cellProps.optimisticSubmissions.get(item.thumbnail) // 2. Or, get user from the optimistic map
      : undefined;

    const paddedStyle: React.CSSProperties = {
      height: '100%',
      width: '100%',
      paddingBottom: `${GAP_Y}px`,
      paddingRight: `${GAP_X}px`,
      boxSizing: 'border-box',
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
        onCardContextMenu={(e) => cellProps.onContextMenu(item, e)}
        onSimilaritySearch={cellProps.onSimilaritySearch}
        onSubmit={cellProps.onSubmit}
        onSending={cellProps.onSending}
        imageClassName={imageClass}
        onDoubleClick={cellProps.onDoubleClick}
        onDislike={cellProps.onDislike}
        submissionStatus={status}
        // ✅ ADDED: Pass the submitter's name down to the card.
        submittedBy={submittedBy}
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
onContextMenu: onRightClick,
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