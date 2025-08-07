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
}


// ✅ FIX 1: Destructure `onSimilaritySearch` from the component's props
const SortedByConfidenceView: React.FC<Props> = ({
  results,
  onResultClick,
  onRightClick,
  onSimilaritySearch,
  currentUser, // Destructure new prop
  sendMessage, // Destructure new prop
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => [...results].sort((a, b) => b.confidence - a.confidence), [results]);

  const handleImageLoad = useCallback((id: string) => {
    setLoadedImages(prev => new Set([...prev, id]));
  }, []);
// --- NEW HANDLER ---
  // This function will handle both the existing submission and the new broadcast
  const handleSending = useCallback((item: ResultItem) => {
    // 2. Create and send the WebSocket message
    const message = {
      type: 'broadcast_image',
      payload: {
        id: item.id,
        thumbnail: item.thumbnail,
        title: item.title,
        submittedBy: currentUser,
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
      {sorted.map(item => (
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
          onSubmit={() => fullSubmissionFlow(item)} // Call the submit function with the item
          onSending={() => handleSending(item)}
          imageClassName={imageClass} // Use the imported class for image styling
        />
      ))}
    </div>
  );
};

export default React.memo(SortedByConfidenceView);