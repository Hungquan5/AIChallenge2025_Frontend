// src/features/results/components/GroupedByVideoView.tsx

import React, { useState, useCallback } from 'react';
import type { GroupedResult, ResultItem } from '../../types';
import {
  groupContainerClass,
  groupTitleClass,
  groupCountClass,
  gridClass,
  noResultsClass,
  noResultsHintClass,
  noResultsTitleClass,
  imageClass
} from './styles';
import ResultCard from './ResultCard';

interface Props {
  groupedResults: GroupedResult[];
  onResultClick: (item: ResultItem) => void;
  onRightClick: (item: ResultItem, event: React.MouseEvent) => void;
  onSimilaritySearch: (imageSrc: string, cardId: string) => void;
  currentUser: string;
  sendMessage: (message: string) => void;
  onResultDoubleClick: (item: ResultItem) => void;
  onSubmission: (item: ResultItem) => void;
  submissionStatuses: { [key: string]: string };
  optimisticSubmissions: Set<string>;
  onDislike: (item: ResultItem) => void;

}

const GroupedByVideoView: React.FC<Props> = ({ 
  groupedResults, 
  onResultClick, 
  onRightClick, 
  onSimilaritySearch, 
  currentUser, 
  sendMessage,
  onResultDoubleClick,
  submissionStatuses,
  onSubmission,
  optimisticSubmissions,
  onDislike
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = useCallback((id: string) => {
    setLoadedImages(prev => new Set([...prev, id]));
  }, []);
  
  // This handler is now consistent with SortedByConfidenceView
  const handleSending = useCallback((item: ResultItem) => {
    const message = {
      type: 'broadcast_image',
      // ✅ FIX: Spread the item to ensure a complete and consistent payload
      payload: { ...item, submittedBy: currentUser },
    };
    sendMessage(JSON.stringify(message));
  }, [currentUser, sendMessage]);

  if (groupedResults.length === 0) {
    return (
      <div className={noResultsClass}>
        <p className={noResultsTitleClass}>No results found</p>
        <p className={noResultsHintClass}>Try adjusting your search terms</p>
      </div>
    );
  }

  return (
    <div className={groupContainerClass}>
      {groupedResults.map(group => (
        <div key={group.videoId}>
          <h2 className={groupTitleClass}>
            {group.videoTitle}
            <span className={groupCountClass}>({group.items.length})</span>
          </h2>
          <div className={gridClass}>
            {group.items.map(item => {
              // ✅ CHANGE 1: Add disabled state logic, same as in SortedByConfidenceView.
              const isDisabledByServer = !!submissionStatuses[item.thumbnail];
              const isDisabledOptimistically = optimisticSubmissions.has(item.thumbnail);

              return (
                <ResultCard
                  key={item.id}
                  // ✅ CHANGE 2: Pass the entire `item` object directly for cleaner code.
                  item={item}
                  loaded={loadedImages.has(item.id)}
                  onLoad={handleImageLoad}
                  imageClassName={imageClass}
                  // ✅ CHANGE 3: Pass event handlers directly without wrapping them.
                  // The ResultCard component is responsible for passing the `item` back.
                  onClick={onResultClick}
                  onContextMenu={onRightClick}
                  onDoubleClick={onResultDoubleClick}
                  onSubmit={onSubmission}
                  onSending={handleSending}
                  onDislike={onDislike}
                  onSimilaritySearch={onSimilaritySearch}
                  // ✅ CHANGE 4: Pass the calculated disabled state to the card.
                  disabled={isDisabledByServer || isDisabledOptimistically}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(GroupedByVideoView);