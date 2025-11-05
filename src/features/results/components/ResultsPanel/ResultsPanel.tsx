// src/features/results/components/ResultsPanel/ResultsPanel.tsx

import React, { useRef, memo, useMemo } from 'react';
import SortedByConfidenceView from './SortByConfView';
import GroupedByVideoView from './GroupByVideoView';
import type { ResultItem, GroupedResult, ViewMode } from '../../types';

import type { SubmissionStatus } from '../../../communicate/types';

interface ResultsPanelProps {
  viewMode: ViewMode;
  results: ResultItem[];
  onResultClick: (item: ResultItem) => void;
  onResultRightClick: (item: ResultItem, event: React.MouseEvent) => void;
  onSimilaritySearch: (imageSrc: string, cardId: string) => void;
  currentUser: string;
  sendMessage: (message: string) => void;
  onItemBroadcast?: (item: ResultItem) => void;
  onSubmission: (item: ResultItem) => void;
  submissionStatuses: { [key: string]: SubmissionStatus };
  // ✅ FIX: Changed the type from Set<string> to Map<string, string>
  optimisticSubmissions: Map<string, string>;
  onResultDoubleClick: (item: ResultItem) => void;
  onResultDislike: (item: ResultItem) => void;
  onToggleViewMode?: () => void;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  viewMode,
  results,
  onResultClick,
  onResultRightClick,
  onSimilaritySearch,
  currentUser,
  sendMessage,
  onResultDoubleClick,
  onSubmission,
  submissionStatuses,
  optimisticSubmissions, // This is now a Map
  onResultDislike,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const groupedResultsAsArray = useMemo((): GroupedResult[] => {
    if (results.length === 0) return [];
    
    const grouped: { [videoId: string]: ResultItem[] } = {};
    results.forEach(item => {
      if (!grouped[item.videoId]) {
        grouped[item.videoId] = [];
      }
      grouped[item.videoId].push(item);
    });
    
    return Object.values(grouped)
      .sort((a, b) => b.length - a.length)
      .map(items => ({
        videoId: items[0].videoId,
        videoTitle: `Frames from ${items[0].videoId}`,
        items: items,
      }));
  }, [results]);

  const sortedView = useMemo(() => (
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
      optimisticSubmissions={optimisticSubmissions} // Correctly passed as a Map
      onDislike={onResultDislike}
    />
  ), [
    results,
    onResultClick,
    onResultRightClick,
    onSimilaritySearch,
    currentUser,
    sendMessage,
    onResultDoubleClick,
    onSubmission,
    submissionStatuses,
    optimisticSubmissions,
    onResultDislike,
  ]);

  const groupedView = useMemo(() => (
    <GroupedByVideoView
      groupedResults={groupedResultsAsArray}
      onResultClick={onResultClick}
      onRightClick={onResultRightClick}
      onSimilaritySearch={onSimilaritySearch}
      currentUser={currentUser}
      sendMessage={sendMessage}
      onResultDoubleClick={onResultDoubleClick}
      onSubmission={onSubmission}
      submissionStatuses={submissionStatuses}
      optimisticSubmissions={optimisticSubmissions} // Correctly passed as a Map
      onDislike={onResultDislike}
    />
  ), [
    groupedResultsAsArray,
    onResultClick,
    onResultRightClick,
    onSimilaritySearch,
    currentUser,
    sendMessage,
    onResultDoubleClick,
    onSubmission,
    submissionStatuses,
    optimisticSubmissions,
    onResultDislike,
  ]);

  return (
    <div className="h-full flex flex-col" ref={containerRef}>
      {viewMode === 'sortByConfidence' ? sortedView : groupedView}
    </div>
  );
};

const arePropsEqual = (
  prevProps: ResultsPanelProps,
  nextProps: ResultsPanelProps
): boolean => {
  if (prevProps.results !== nextProps.results) return false;
  if (prevProps.viewMode !== nextProps.viewMode) return false;
  if (prevProps.currentUser !== nextProps.currentUser) return false;
  if (prevProps.submissionStatuses !== nextProps.submissionStatuses) return false;
  // This comparison is still valid for checking if the map has changed
  if (prevProps.optimisticSubmissions.size !== nextProps.optimisticSubmissions.size) return false;

  return true;
};

export default memo(ResultsPanel, arePropsEqual);