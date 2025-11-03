// src/features/results/components/ResultsPanel.tsx
import React, { useState, useRef, memo } from 'react';
import SortedByConfidenceView from './SortByConfView';
import GroupedByVideoView from './GroupByVideoView';
import type { ResultItem, GroupedResult, ViewMode } from '../../types';
import { useShortcuts } from '../../../../utils/shortcuts';

// Define the specific status type once to be reusable
type SubmissionStatus = 'PENDING' | 'WRONG';

interface ResultsPanelProps {
  viewMode: ViewMode;
  results: ResultItem[];
  groupedResults?: GroupedResult[];
  onResultClick: (item: ResultItem) => void;
  onResultRightClick: (item: ResultItem, event: React.MouseEvent) => void;
  onSimilaritySearch: (imageSrc: string, cardId: string) => void;
  currentUser: string;
  sendMessage: (message: string) => void;
  onItemBroadcast?: (item: ResultItem) => void;
  onSubmission: (item: ResultItem) => void;
  submissionStatuses: { [key: string]: SubmissionStatus };
  optimisticSubmissions: Set<string>;
  onResultDoubleClick: (item: ResultItem) => void;
  onResultDislike: (item: ResultItem) => void;
  // ✅ SOLUTION: Add a callback to handle view mode toggling via shortcut.
  onToggleViewMode?: () => void;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  viewMode,
  results,
  groupedResults = [],
  onResultClick,
  onResultRightClick,
  onSimilaritySearch,
  currentUser, sendMessage,
  onResultDoubleClick,
  onSubmission,
  submissionStatuses,
  optimisticSubmissions,
  onResultDislike,
  onToggleViewMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const focusNextResult = () => {
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
  };

  const focusPrevResult = () => {
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
  };
 

  return (
    <div className="h-full flex flex-col" ref={containerRef}>
      {viewMode === 'sortByConfidence' ? (
        <SortedByConfidenceView
          results={results}
          onResultClick={onResultClick}
          onRightClick={onResultRightClick}
          onSimilaritySearch={onSimilaritySearch}
          currentUser={currentUser}
          sendMessage={sendMessage}
          onResultDoubleClick={onResultDoubleClick}
          onSubmission={onSubmission}
          submissionStatuses={submissionStatuses}
          optimisticSubmissions={optimisticSubmissions}
          onDislike={onResultDislike}
        />
      ) : (
        <GroupedByVideoView
          groupedResults={groupedResults}
          onResultClick={onResultClick}
          onRightClick={onResultRightClick}
          onSimilaritySearch={onSimilaritySearch}
          currentUser={currentUser}
          sendMessage={sendMessage}
          onResultDoubleClick={onResultDoubleClick}
          onSubmission={onSubmission}
          submissionStatuses={submissionStatuses}
          optimisticSubmissions={optimisticSubmissions}
          onDislike={onResultDislike}
        />
      )}
    </div>
  );
};

export default memo(ResultsPanel);