import React, { useState } from 'react';
import SearchTypeSelector from './SearchModeButton';
import QueryList from './QueryList';
import ImageInputBox from './ImageInputBox';
import { useInputMode } from './useInputMode';
import { containerClass, searchButtonClass } from './styles';
import type { ResultItem, SearchMode } from '../../types/result';
import { searchByText, searchByOcr } from '../SearchRequest/searchApi';

interface InputPanelProps {
  onSearch: (results: ResultItem[]) => void;
}

const InputPanel: React.FC<InputPanelProps> = ({ onSearch }) => {
  const { mode, switchMode } = useInputMode('text');
  const [queries, setQueries] = useState<string[]>(['']); // Initialize with one empty query
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>('normal');

  const triggerSearch = async () => {
    // Validate if any query is empty
    if (queries.some(q => !q.trim())) {
      alert('Please fill in all query fields');
      return;
    }

    setLoading(true);

    try {
      let results: ResultItem[] = [];

      if (mode === 'text') {
        if (searchMode === 'ocr') {
          // For OCR search, only use the first query
          results = await searchByOcr(queries[0]);
        } else {
          results = await searchByText(queries, searchMode);
        }
      }
      onSearch(results);
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={containerClass}>
      <SearchTypeSelector mode={mode} onChange={switchMode} />
      
      {mode === 'text' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-gray-300">Search Mode:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSearchMode('normal')}
                className={`px-3 py-1 rounded text-sm ${
                  searchMode === 'normal'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setSearchMode('chain')}
                className={`px-3 py-1 rounded text-sm ${
                  searchMode === 'chain'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Chain Search
              </button>
              <button
                onClick={() => setSearchMode('ocr')}
                className={`px-3 py-1 rounded text-sm ${
                  searchMode === 'ocr'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                OCR Search
              </button>
            </div>
          </div>
          <QueryList 
            queries={queries} 
            onQueriesChange={setQueries}
            maxQueries={searchMode === 'ocr' ? 1 : undefined}  // Only allow 1 query for OCR search
          />
        </>
      )}
      
      {mode === 'image' && <ImageInputBox selectedImage={selectedImage} onSelectImage={setSelectedImage} />}
      
      <button 
        onClick={triggerSearch} 
        className={searchButtonClass} 
        disabled={loading || (mode === 'text' && queries.every(q => !q.trim()))}
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </div>
  );
};

export default InputPanel;
