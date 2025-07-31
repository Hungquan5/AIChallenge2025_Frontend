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
}

// ✅ FIX 1: Destructure `onSimilaritySearch` from the component's props
const GroupedByVideoView: React.FC<Props> = ({ groupedResults, onResultClick, onRightClick, onSimilaritySearch }) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = useCallback((id: string) => {
    setLoadedImages(prev => new Set([...prev, id]));
  }, []);

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
                // ✅ FIX 2: Pass the `onSimilaritySearch` prop down to the ResultCard
                onSimilaritySearch={onSimilaritySearch}
                imageClassName={imageClass} // Use the imported class for image styling
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(GroupedByVideoView);