// src/features/results/components/SortedByConfidenceView.tsx
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
  // 1. Accept the onRightClick prop from the parent component
  onRightClick: (item: ResultItem, event: React.MouseEvent) => void;
}

// 2. Destructure the new onRightClick prop
const SortedByConfidenceView: React.FC<Props> = ({ results, onResultClick, onRightClick }) => {
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
          // 3. Add the onContextMenu event handler to the ResultCard
          // This will trigger the function passed down from ResultsPanel
          onContextMenu={(event) => onRightClick(item, event)}
        />
      ))}
    </div>
  );
};

export default React.memo(SortedByConfidenceView);