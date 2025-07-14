import React, { useState, useCallback, useMemo } from 'react';
import type { ResultItem } from '../../types';
import {
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
  results: ResultItem[];
}

const SortedByConfidenceView: React.FC<Props> = ({ results }) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  // Memoize sorted results
  const sorted = useMemo(() => 
    [...results].sort((a, b) => b.confidence - a.confidence),
    [results]
  );

  // Optimize image loading handler
  const handleImageLoad = useCallback((id: string) => {
    setLoadedImages(prev => new Set([...prev, id]));
  }, []);

  if (results.length === 0) {
    return (
      <div className={noResultsClass}>
        <p>No results found</p>
        <p className="text-sm mt-2">Try adjusting your search terms</p>
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {sorted.map((item) => (
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
  );
};

// Prevent unnecessary re-renders
export default React.memo(SortedByConfidenceView);
