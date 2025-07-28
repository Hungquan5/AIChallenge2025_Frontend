import React, { useState, useCallback, useMemo } from 'react';
import type { ResultItem } from '../../types';
import {
  gridClass,
  noResultsClass,
  noResultsHintClass,
  noResultsTitleClass,
} from './styles';
import ResultCard from './ResultCard';

interface Props {
  results: ResultItem[];
  onResultClick?: (item: ResultItem) => void;
}

const SortedByConfidenceView: React.FC<Props> = ({ results, onResultClick }) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => [...results].sort((a, b) => b.confidence - a.confidence), [results]);

  const handleImageLoad = useCallback((id: string) => {
    setLoadedImages(prev => new Set([...prev, id]));
  }, []);

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
        />
      ))}
    </div>
  );
};

export default React.memo(SortedByConfidenceView);
