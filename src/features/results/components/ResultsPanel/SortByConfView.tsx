// src/features/results/components/SortedByConfidenceView.tsx
import React, { useState, useCallback, useMemo } from 'react';
import type { ResultItem } from '../../types';
import {
  gridClass,
  noResultsClass,
  noResultsHintClass,
  noResultsTitleClass,
  imageClass
} from './styles';
import ResultCard from './ResultCard';

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
  submissionStatuses: { [key:string]: 'PENDING' | 'WRONG' }; // Typed for clarity
  optimisticSubmissions: Set<string>;
}

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
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => [...results].sort((a, b) => b.confidence - a.confidence), [results]);

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

  if (results.length === 0) {
    return (
      <div className={noResultsClass}>
        <p className={noResultsTitleClass}>No results found</p>
        <p className={noResultsHintClass}>Try adjusting your search terms</p>
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {sorted.map(item => {
        // ✅ --- REPLACEMENT LOGIC ---
        // 1. Get the status from the server state (the source of truth).
        const serverStatus = submissionStatuses[item.thumbnail];
        
        // 2. Check if the submission is pending on the client-side (optimistic update).
        const isOptimisticallyPending = optimisticSubmissions.has(item.thumbnail);

        // 3. Determine the final status to pass to the card.
        //    The server status takes precedence. If it's not available,
        //    we use the optimistic status.
        const status = serverStatus ? serverStatus : (isOptimisticallyPending ? 'PENDING' : undefined);

        return (
          <ResultCard
            key={item.id}
            item={item}
            loaded={loadedImages.has(item.id)}
            onLoad={handleImageLoad}
            onClick={onResultClick}
            onContextMenu={onRightClick}
            onSimilaritySearch={onSimilaritySearch}
            onSubmit={onSubmission}
            onSending={handleSending}
            imageClassName={imageClass}
            onDoubleClick={onResultDoubleClick}
            onDislike={onDislike}
            
            // ✅ REMOVED: The 'disabled' prop is no longer needed.
            // disabled={...}

            // ✅ ADDED: Pass the calculated status to the ResultCard for visual styling.
            submissionStatus={status}
          />
        );
      })}
    </div>
  );
};

export default React.memo(SortedByConfidenceView);