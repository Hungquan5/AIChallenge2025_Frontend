import React, { useState } from 'react';
import SearchTypeSelector from './SearchModeButton';
import TextInputBox from './TextInputBox';
import ImageInputBox from './ImageInputBox';
import { useInputMode } from './useInputMode';
import { containerClass, searchButtonClass } from './styles';
import type { ResultItem } from '../../types/result';
import { searchByText} from '../SearchRequest/searchApi';

interface InputPanelProps {
  onSearch: (results: ResultItem[]) => void;
}

const InputPanel: React.FC<InputPanelProps> = ({ onSearch }) => {
  const { mode, switchMode } = useInputMode('text');
  const [query, setQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const triggerSearch = async () => {
    setLoading(true);

    try {
      let results: ResultItem[] = [];

      if (mode === 'text') {
        results = await searchByText(query);
      }
      onSearch(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={containerClass}>
      <SearchTypeSelector mode={mode} onChange={switchMode} />
      {mode === 'text' && <TextInputBox value={query} onChange={setQuery} />}
      {mode === 'image' && <ImageInputBox selectedImage={selectedImage} onSelectImage={setSelectedImage} />}
      <button onClick={triggerSearch} className={searchButtonClass} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
    </div>
  );
};

export default InputPanel;
