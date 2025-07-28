import React, { useRef, useEffect, useState } from 'react';
import SortedByConfidenceView from './SortByConfView';
import GroupedByVideoView from './GroupByVideoView';
import type { ResultItem, GroupedResult, ViewMode } from '../../types';
import { containerClass } from './styles';
import { useShortcuts } from '../../../../utils/shortcuts';
import FrameCarousel from '../../../../components/FrameCarousel';

interface ResultsPanelProps {
  viewMode: ViewMode;
  results: ResultItem[];
  groupedResults?: GroupedResult[];
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ viewMode, results, groupedResults = [] }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [carouselFrames, setCarouselFrames] = useState<ResultItem[] | null>(null);
  const [activeFrameId, setActiveFrameId] = useState<string | number | null>(null);

  const handleResultClick = async (item: ResultItem) => {
    const res = await fetch('/embeddings/nearby_frames', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_id: item.videoId,
        frame_id: item.timestamp,
        window_size: 5
      })
    });
    const data = await res.json();
    setCarouselFrames(data);
    setActiveFrameId(item.timestamp);
  };

  const focusNextResult = () => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll('.result-item');
    const currentFocus = document.activeElement;
    const currentIndex = Array.from(items).indexOf(currentFocus as Element);
    
    if (currentIndex === -1 && items.length > 0) {
      // No item focused, focus first item
      (items[0] as HTMLElement).focus();
    } else if (currentIndex < items.length - 1) {
      // Focus next item
      (items[currentIndex + 1] as HTMLElement).focus();
    }
  };

  const focusPrevResult = () => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll('.result-item');
    const currentFocus = document.activeElement;
    const currentIndex = Array.from(items).indexOf(currentFocus as Element);
    
    if (currentIndex === -1 && items.length > 0) {
      // No item focused, focus last item
      (items[items.length - 1] as HTMLElement).focus();
    } else if (currentIndex > 0) {
      // Focus previous item
      (items[currentIndex - 1] as HTMLElement).focus();
    }
  };

  useShortcuts({
    NEXT_RESULT: focusNextResult,
    PREV_RESULT: focusPrevResult,
  });

  return (
    <div className={containerClass} ref={containerRef}>
      {viewMode === 'sortByConfidence' ? (
        <SortedByConfidenceView results={results} onResultClick={handleResultClick} />
      ) : (
        <GroupedByVideoView groupedResults={groupedResults} onResultClick={handleResultClick} />
      )}
      {carouselFrames && activeFrameId && (
        <FrameCarousel
          frames={carouselFrames}
          activeFrameId={activeFrameId}
          onClose={() => setCarouselFrames(null)}
        />
      )}
    </div>
  );
};

export default ResultsPanel;
