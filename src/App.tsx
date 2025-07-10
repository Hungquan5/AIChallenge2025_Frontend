import React, { useState } from 'react';
import AppShell from './layouts/AppShell';
import InputPanel from './features/search/components/InputPanel/InputPanel';
import ResultsPanel from './features/results/components/ResultsPanel/ResultsPanel';
import type { ResultItem, GroupedResult, ViewMode } from './features/results/types';

const App: React.FC = () => {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [groupedResults, setGroupedResults] = useState<GroupedResult[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('sortByConfidence');

  const handleSearch = (mockData: ResultItem[]) => {
    setResults(mockData);
    const grouped = mockData.reduce((acc, item) => {
      const group = acc.find(g => g.videoId === item.videoId);
      group ? group.items.push(item) : acc.push({ videoId: item.videoId, videoTitle: item.title, items: [item] });
      return acc;
    }, [] as GroupedResult[]);
    setGroupedResults(grouped);
  };

  const leftPanel = <InputPanel onSearch={handleSearch} />;

  const rightPanel = (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Search Results</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('sortByConfidence')}
            className={`px-4 py-2 rounded-lg text-sm ${
              viewMode === 'sortByConfidence'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Sort by Confidence
          </button>
          <button
            onClick={() => setViewMode('groupByVideo')}
            className={`px-4 py-2 rounded-lg text-sm ${
              viewMode === 'groupByVideo'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Group by Video
          </button>
        </div>
      </div>

      <ResultsPanel viewMode={viewMode} results={results} groupedResults={groupedResults} />
    </>
  );

  return <AppShell leftPanel={leftPanel} rightPanel={rightPanel} />;
};

export default App;
