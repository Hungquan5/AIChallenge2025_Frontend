import React from 'react';
import SortedByConfidenceView from './SortByConfView';
import GroupedByVideoView from './GroupByVideoView';
import type { ResultItem, GroupedResult, ViewMode } from '../../types';
import { containerClass } from './styles';

interface ResultsPanelProps {
  viewMode: ViewMode;
  results: ResultItem[];
  groupedResults?: GroupedResult[];
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ viewMode, results, groupedResults = [] }) => {
  return (
    <div className={containerClass}>
      {viewMode === 'sortByConfidence' ? (
        <SortedByConfidenceView results={results} />
      ) : (
        <GroupedByVideoView groupedResults={groupedResults} />
      )}
    </div>
  );
};

export default ResultsPanel;
