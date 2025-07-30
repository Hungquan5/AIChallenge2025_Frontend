// src/features/results/components/ResultsPanel.tsx
import React, { useState,useRef, useCallback } from 'react';
import SortedByConfidenceView from './SortByConfView';
import GroupedByVideoView from './GroupByVideoView';
import type { ResultItem, GroupedResult, ViewMode } from '../../types';
import { useShortcuts } from '../../../../utils/shortcuts';
import VideoPanel from '../../../detail_info/components/VideoPanel/VideoPanel';
// We no longer import FrameCarousel or its related hooks here.

interface ResultsPanelProps {
  viewMode: ViewMode;
  results: ResultItem[];
  groupedResults?: GroupedResult[];
  // Add a prop to pass the click event up to the parent component
  onResultClick: (item: ResultItem) => void;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  viewMode,
  results,
  groupedResults = [],
  onResultClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [modalData, setModalData] = useState<ResultItem | null>(null);

  const handleRightClick = (item: ResultItem, event: React.MouseEvent) => {
    event.preventDefault();
    setModalData(item);
  };
  const closeModal = () => {
    setModalData(null);
  };

  // Keyboard shortcut logic for navigating results remains unchanged.
  const focusNextResult = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const items = container.querySelectorAll('.result-item');
    const currentFocus = document.activeElement;
    const currentIndex = Array.from(items).indexOf(currentFocus as Element);
    if (currentIndex === -1 && items.length > 0) {
      (items[0] as HTMLElement).focus();
    } else if (currentIndex < items.length - 1) {
      (items[currentIndex + 1] as HTMLElement).focus();
    }
  }, []);

  const focusPrevResult = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const items = container.querySelectorAll('.result-item');
    const currentFocus = document.activeElement;
    const currentIndex = Array.from(items).indexOf(currentFocus as Element);
    if (currentIndex === -1 && items.length > 0) {
      (items[items.length - 1] as HTMLElement).focus();
    } else if (currentIndex > 0) {
      (items[currentIndex - 1] as HTMLElement).focus();
    }
  }, []);

  useShortcuts({
    NEXT_RESULT: focusNextResult,
    PREV_RESULT: focusPrevResult,
    });

     return (
    <div className="min-h-full" ref={containerRef}>
      {viewMode === 'sortByConfidence' ? (
        <SortedByConfidenceView results={results} onResultClick={onResultClick} onRightClick={handleRightClick} />
      ) : (
        <GroupedByVideoView groupedResults={groupedResults} onResultClick={onResultClick} onRightClick={handleRightClick} />
      )}
      
      {/* This section is now much simpler */}
      {modalData && (
        <VideoPanel
          // Pass the raw data instead of a pre-built URL
          videoId={modalData.videoId}
          timestamp={modalData.timestamp}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default ResultsPanel;