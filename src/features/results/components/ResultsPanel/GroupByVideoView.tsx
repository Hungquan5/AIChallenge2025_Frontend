import React, { useState, useCallback } from 'react';
import type { GroupedResult } from '../../types';
import {
  groupContainerClass,
  groupTitleClass,
  gridClass,
  cardClass,
  imageClass,
  imageContainerClass,
  imageOverlayClass,
  contentClass,
  titleClass,
  confidenceClass,
  timestampClass,
  noResultsClass,
} from './styles';

interface Props {
  groupedResults: GroupedResult[];
}

const GroupedByVideoView: React.FC<Props> = ({ groupedResults }) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = useCallback((id: string) => {
    setLoadedImages(prev => new Set([...prev, id]));
  }, []);

  if (groupedResults.length === 0) {
    return (
      <div className={noResultsClass}>
        <p>No results found</p>
        <p className="text-sm mt-2">Try adjusting your search terms</p>
      </div>
    );
  }

  return (
    <div className={groupContainerClass}>
      {groupedResults.map((group) => (
        <div key={group.videoId}>
          <h2 className={groupTitleClass}>
            {group.videoTitle}
            <span className="text-xs text-gray-400 ml-2">({group.items.length})</span>
          </h2>
          <div className={gridClass}>
            {group.items.map((item) => (
              <div key={item.id} className={`${cardClass} group`}>
                <div className={imageContainerClass}>
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className={`${imageClass} ${!loadedImages.has(item.id) ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => handleImageLoad(item.id)}
                  />
                  <div className={imageOverlayClass} />
                  {!loadedImages.has(item.id) && (
                    <div className="absolute inset-0 bg-white/10 animate-pulse" />
                  )}
                </div>
                <div className={contentClass}>
                  <h3 className={titleClass}>{item.title}</h3>
                  <p className={confidenceClass}>{(item.confidence * 100).toFixed(1)}%</p>
                  <p className={timestampClass}>{item.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(GroupedByVideoView);
