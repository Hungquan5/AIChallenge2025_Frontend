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
import { fullSubmissionFlow } from '../../../submit/components/SubmitAPI';

interface Props {
  groupedResults: GroupedResult[];
  onResultClick: (item: ResultItem) => void;
  onRightClick: (item: ResultItem, event: React.MouseEvent) => void;
  onSimilaritySearch: (imageSrc: string, cardId: string) => void;
  currentUser: string;
  sendMessage: (message: string) => void;
  // This prop was correctly added to the interface already.
  onResultDoubleClick: (item: ResultItem) => void;
  onSubmission: (item: ResultItem) => void; // ✅ Add the new prop
  submissionStatuses: { [key: string]: string }; // --- NEW PROP ---
  optimisticSubmissions: Set<string>; // Add new prop
  onDislike: (item: ResultItem) => void; // ✅ Add the new prop

}

// ✅ FIX 1: Destructure the `onResultDoubleClick` prop from the component's props.
const GroupedByVideoView: React.FC<Props> = ({ 
  groupedResults, 
  onResultClick, 
  onRightClick, 
  onSimilaritySearch, 
  currentUser, 
  sendMessage,
  onResultDoubleClick, // <-- Destructure it here
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
      payload: {
        id: item.id,
        videoId: item.videoId,
        thumbnail: item.thumbnail,
        title: item.title,
        timestamp: item.timestamp,
        confidence: item.confidence,
        submittedBy: currentUser,
      },
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
            {group.items.map(item => (
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
                onSubmit={() => onSubmission(item)}
                onSending={() => handleSending(item)}
                onSimilaritySearch={onSimilaritySearch}
                imageClassName={imageClass}
                onDislike={() => onDislike(item)} // ✅ Pass it to the card

                // ✅ FIX 2: Pass the handler down to the ResultCard's onDoubleClick prop.
                onDoubleClick={() => onResultDoubleClick(item)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(GroupedByVideoView);