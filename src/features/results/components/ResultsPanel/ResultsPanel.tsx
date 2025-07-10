// src/features/results/components/ResultsPanel/ResultsPanel.tsx

import React from 'react';
import SortedByConfidenceView from './SortByConfView';
import GroupedByVideoView from './GroupByVideoView';
import type { ResultItem, GroupedResult, ViewMode } from '../../types';

interface ResultsPanelProps {
  viewMode: ViewMode;
  results: ResultItem[];
  groupedResults?: GroupedResult[]; // only used in groupByVideo mode
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ viewMode, results, groupedResults = [] }) => {
  return (
    <div className="space-y-4">
      {viewMode === 'sortByConfidence' ? (
        <SortedByConfidenceView results={results} />
      ) : (
        <GroupedByVideoView groupedResults={groupedResults} />
      )}
    </div>
  );
};

export default ResultsPanel;