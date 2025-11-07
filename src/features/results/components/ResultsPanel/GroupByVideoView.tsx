// src/features/results/components/GroupedByVideoView.tsx

import React, { useState, useCallback, useMemo, useRef, useLayoutEffect, memo, useEffect } from 'react';
import type { GroupedResult, ResultItem } from '../../types';
import {
  groupTitleClass,
  groupCountClass,
  noResultsClass,
  noResultsHintClass,
  noResultsTitleClass,
  imageClass
} from './styles';
import ResultCard from './ResultCard';

// Using the List component as you intended
import { List } from 'react-window';
import type { ListImperativeAPI } from 'react-window';

import type { SubmissionStatus } from '../../../communicate/types';

// --- Prop definitions ---
interface Props {
  groupedResults: GroupedResult[];
  onResultClick: (item: ResultItem) => void;
  onRightClick: (item: ResultItem, event: React.MouseEvent) => void;
  onSimilaritySearch: (imageSrc: string, cardId: string) => void;
  currentUser: string;
  sendMessage: (message: string) => void;
  onResultDoubleClick: (item: ResultItem) => void;
  onSubmission: (item: ResultItem) => void;
  submissionStatuses: { [key: string]: SubmissionStatus };
  optimisticSubmissions: Map<string, string>;
  onDislike: (item: ResultItem) => void;
}

// --- Layout Constants remain unchanged ---
const GROUP_HEADER_HEIGHT = 28; // Adjusted for padding
const CARD_ROW_HEIGHT = 152;
const CARD_WIDTH = 260;
const GAP_X = 4;

// The Row component remains unchanged, but we'll update its rendering logic
const Row = memo((props: any) => {
  const { 
    index, 
    style, 
    flatData, 
    loadedImages, 
    submissionStatuses, 
    optimisticSubmissions,
    handleImageLoad,
    handleSending,
    onResultClick,
    onRightClick,
    onResultDoubleClick,
    onSubmission,
    onDislike,
    onSimilaritySearch
  } = props;

  const rowData = flatData[index];
  
  // Render a Group Header
  if (rowData.type === 'header') {
    const group = rowData.content as GroupedResult;
    return (
      <div style={style} className="flex items-center px-4">
        <h2 className={groupTitleClass}>
          {group.videoTitle}
          <span className={groupCountClass}>({group.items.length})</span>
        </h2>
      </div>
    );
  }
  
  // Render a row of Result Cards
  if (rowData.type === 'card_row') {
    const items = rowData.content as ResultItem[];
    return (
      <div style={style} className="flex items-center px-4">
        {items.map(item => {
          // ✅ START: Logic copied directly from SortedByConfidenceView's Cell component
          const serverSubmission = submissionStatuses[item.thumbnail];
          const isOptimisticallyPending = optimisticSubmissions.has(item.thumbnail);

          const status = serverSubmission
            ? serverSubmission.status // 1. Get status from the server state object
            : isOptimisticallyPending
            ? 'PENDING' // 2. Or, if it's optimistically pending
            : undefined;

          const submittedBy = serverSubmission
            ? serverSubmission.submittedBy // 1. Get user from the server state object
            : isOptimisticallyPending
            ? optimisticSubmissions.get(item.thumbnail) // 2. Or, get user from the optimistic map
            : undefined;
          // ✅ END: Logic copied directly from SortedByConfidenceView's Cell component

          return (
            <div key={item.id} style={{ width: CARD_WIDTH, marginRight: GAP_X, height: CARD_ROW_HEIGHT - 8 }}>
              <ResultCard
                item={item}
                loaded={loadedImages.has(item.id)}
                onLoad={handleImageLoad}
                imageClassName={imageClass}
                onClick={onResultClick}
                onCardContextMenu={(event) => onRightClick(item, event)}
                onDoubleClick={onResultDoubleClick}
                onSubmit={onSubmission}
                onSending={handleSending}
                onDislike={onDislike}
                onSimilaritySearch={onSimilaritySearch}
                submissionStatus={status}
                submittedBy={submittedBy}
              />
            </div>
          );
        })}
      </div>
    );
  }
  
  return null;
});
Row.displayName = "GroupedRow";


const GroupedByVideoView: React.FC<Props> = (props) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const { groupedResults, currentUser, sendMessage } = props;
  const [list, setList] = useState<ListImperativeAPI | null>(null);

  const handleImageLoad = useCallback((id: string) => {
    setLoadedImages(prev => {
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
  // ✅ SOLUTION: Add an effect that triggers whenever the groupedResults change
  useEffect(() => {
    if (list) {
      list.scrollToRow({ index: 0, behavior: 'auto' });
    }
  }, [groupedResults, list]); // Add `list` to the dependency array
  const flatData = useMemo(() => {
    const cardsPerRow = dimensions.width > 0 ? Math.max(1, Math.floor(dimensions.width / (CARD_WIDTH + GAP_X))) : 1;
    const data: any[] = [];
    groupedResults.forEach(group => {
      data.push({ type: 'header', content: group });
      for (let i = 0; i < group.items.length; i += cardsPerRow) {
        data.push({ type: 'card_row', content: group.items.slice(i, i + cardsPerRow) });
      }
    });
    return data;
  }, [groupedResults, dimensions.width]);

  const getItemSize = (index: number) => {
    return flatData[index].type === 'header' ? GROUP_HEADER_HEIGHT : CARD_ROW_HEIGHT;
  };

  const rowProps = useMemo(() => ({
    flatData,
    loadedImages,
    submissionStatuses: props.submissionStatuses,
    optimisticSubmissions: props.optimisticSubmissions,
    handleImageLoad,
    handleSending,
    onResultClick: props.onResultClick,
    onRightClick: props.onRightClick,
    onResultDoubleClick: props.onResultDoubleClick,
    onSubmission: props.onSubmission,
    onDislike: props.onDislike,
    onSimilaritySearch: props.onSimilaritySearch,
  }), [flatData, loadedImages, props, handleImageLoad, handleSending]);


  if (groupedResults.length === 0) {
      return (
        <div className={noResultsClass}>
            <p className={noResultsTitleClass}>No results found</p>
            <p className={noResultsHintClass}>Try adjusting your search terms</p>
        </div>
      );
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      {dimensions.width > 0 && dimensions.height > 0 && (
<List
listRef={setList}
className="no-scrollbar"
style={{}}
rowCount={flatData.length}
rowHeight={getItemSize} // Correct prop for variable height function
rowComponent={Row}      // Correct prop for the component renderer
rowProps={rowProps}     // Correct prop for passing extra data
overscanCount={5}
/>
      )}
    </div>
  );
};

export default React.memo(GroupedByVideoView);