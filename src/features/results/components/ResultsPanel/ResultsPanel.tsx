// src/features/results/components/ResultsPanel.tsx
import React, { useState, useRef, useCallback } from 'react';
import SortedByConfidenceView from './SortByConfView';
import GroupedByVideoView from './GroupByVideoView';
import type { ResultItem, GroupedResult, ViewMode } from '../../types';
import { useShortcuts } from '../../../../utils/shortcuts';
import VideoPanel from '../../../detail_info/components/VideoPanel/VideoPanel';
// REMOVE useSimilaritySearch import if it's not used elsewhere
// import { useSimilaritySearch } from '../../../search/components/SimilaritySearch/SimilaritySearch';

interface ResultsPanelProps {
  viewMode: ViewMode;
  results: ResultItem[];
  groupedResults?: GroupedResult[];
  onResultClick: (item: ResultItem) => void;
  // This prop is now the single source of truth for triggering a search.
  onSimilaritySearch: (imageSrc: string, cardId: string) => void;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  viewMode,
  results,
  groupedResults = [],
  onResultClick,
  onSimilaritySearch, // We will use THIS prop directly.
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [modalData, setModalData] = useState<ResultItem | null>(null);

  // --- REMOVE ALL THIS LOCAL STATE AND LOGIC ---
  // const [isSearchingSimilar, setIsSearchingSimilar] = useState(false);
  // const [similarityError, setSimilarityError] = useState<string | null>(null);
  // const handleSimilaritySearch = useSimilaritySearch(...); // This is the line causing the issue.

  const handleRightClick = (item: ResultItem, event: React.MouseEvent) => {
    event.preventDefault();
    setModalData(item);
  };

  const closeModal = () => {
    setModalData(null);
  };

  // Keyboard shortcut logic can remain
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
  useShortcuts({ NEXT_RESULT: focusNextResult, PREV_RESULT: focusPrevResult });

  return (
    <div className="min-h-full" ref={containerRef}>
      {/* 
        Loading and Error indicators should be moved to App.tsx, 
        since it's now managing the state for this global action.
      */}

      {viewMode === 'sortByConfidence' ? (
        <SortedByConfidenceView
          results={results}
          onResultClick={onResultClick}
          onRightClick={handleRightClick}
          // ✅ Pass the PROP from App.tsx down to the view
          onSimilaritySearch={onSimilaritySearch}
        />
      ) : (
        <GroupedByVideoView
          groupedResults={groupedResults}
          onResultClick={onResultClick}
          onRightClick={handleRightClick}
          // ✅ Pass the PROP from App.tsx down to the view
          onSimilaritySearch={onSimilaritySearch}
        />
      )}

      {modalData && (
        <VideoPanel
          videoId={modalData.videoId}
          timestamp={modalData.timestamp}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default ResultsPanel;