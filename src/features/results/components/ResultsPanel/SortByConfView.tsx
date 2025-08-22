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
import { fullSubmissionFlow } from '../../../submit/components/SubmitAPI';  
interface Props {
  results: ResultItem[];
  onResultClick: (item: ResultItem) => void;
  onRightClick: (item: ResultItem, event: React.MouseEvent) => void;
  onSimilaritySearch: (imageSrc: string, cardId: string) => void;
  // --- NEW PROPS ---
  currentUser: string; // The name of the current user for broadcasting
  sendMessage: (message: string) => void; // WebSocket send function
  onResultDoubleClick: (item: ResultItem) => void; // Add prop
  onSubmission: (item: ResultItem) => void; // ✅ Add the new prop
  submissionStatuses: { [key: string]: string }; // --- NEW PROP ---
  optimisticSubmissions: Set<string>; // Add new prop

}


// ✅ FIX 1: Destructure `onSimilaritySearch` from the component's props
const SortedByConfidenceView: React.FC<Props> = ({
  results,
  onResultClick,
  onRightClick,
  onSimilaritySearch,
  currentUser, // Destructure new prop
  sendMessage, // Destructure new prop
  onResultDoubleClick,
  onSubmission,
  submissionStatuses, // --- Destructure the new prop ---
  optimisticSubmissions,
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => [...results].sort((a, b) => b.confidence - a.confidence), [results]);

  const handleImageLoad = useCallback((id: string) => {
    setLoadedImages(prev => new Set([...prev, id]));
  }, []);
  // ✅ FIX: This handler now sends a complete and consistent ResultItem payload
  const handleSending = useCallback((item: ResultItem) => {
    const message = {
      type: 'broadcast_image',
      payload: {
        // Ensure all fields from the ResultItem type are present
        id: item.id,
        videoId: item.videoId,
        thumbnail: item.thumbnail,
        title: item.title,
        timestamp: item.timestamp,
        confidence: item.confidence, // Pass confidence as well
        submittedBy: currentUser, // Add the sender's name
      },
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
        // ✅ Combined check for disabled status
        const isDisabledByServer = !!submissionStatuses[item.thumbnail];
        const isDisabledOptimistically = optimisticSubmissions.has(item.thumbnail);
        return (
          <ResultCard
          key={item.id}
          id={item.id}
          thumbnail={item.thumbnail}
          title={item.title}
          confidence={item.confidence}
          timestamp={item.timestamp}
          loaded={loadedImages.has(item.id)}
          onLoad={handleImageLoad}
          onClick={onResultClick ? () => onResultClick(item) : undefined}
          onContextMenu={(event) => onRightClick(item, event)}
          // ✅ FIX 2: Pass the `onSimilaritySearch` prop down to the ResultCard
          onSimilaritySearch={onSimilaritySearch}
          onSubmit={() => onSubmission(item)}
          onSending={() => handleSending(item)}
          imageClassName={imageClass} // Use the imported class for image styling
          onDoubleClick={() => onResultDoubleClick(item)}
          disabled={isDisabledByServer || isDisabledOptimistically} // Use the combined result
        />
      );
    })}
  </div>
);
};

export default React.memo(SortedByConfidenceView);