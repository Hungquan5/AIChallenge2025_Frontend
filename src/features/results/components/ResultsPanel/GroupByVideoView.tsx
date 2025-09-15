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
  // ✅ CHANGE 1: Type submissionStatuses for better clarity, matching SortedByConfidenceView.
  submissionStatuses: { [key: string]: 'PENDING' | 'WRONG' };
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

  const handleSending = useCallback((item: ResultItem) => {
    const message = {
      type: 'broadcast_image',
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
              // ✅ CHANGE 2: Implement the exact same status logic as in SortedByConfidenceView.
              // 1. Get the status from the server state (the source of truth).
              const serverStatus = submissionStatuses[item.thumbnail];
              // 2. Check if the submission is pending on the client-side (optimistic update).
              const isOptimisticallyPending = optimisticSubmissions.has(item.thumbnail);
              // 3. Determine the final status, giving precedence to the server status.
              const status = serverStatus ? serverStatus : (isOptimisticallyPending ? 'PENDING' : undefined);

              return (
                <ResultCard
                  key={item.id}
                  item={item}
                  loaded={loadedImages.has(item.id)}
                  onLoad={handleImageLoad}
                  imageClassName={imageClass}
                  onClick={onResultClick}
                  onContextMenu={onRightClick}
                  onDoubleClick={onResultDoubleClick}
                  onSubmit={onSubmission}
                  onSending={handleSending}
                  onDislike={onDislike}
                  onSimilaritySearch={onSimilaritySearch}
                  // ✅ CHANGE 3: Remove the old 'disabled' prop.
                  // disabled={...}

                  // ✅ CHANGE 4: Add the new 'submissionStatus' prop to pass the calculated state.
                  submissionStatus={status}
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