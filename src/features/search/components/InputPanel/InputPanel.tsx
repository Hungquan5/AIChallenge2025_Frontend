import React, { useState } from 'react';
import SearchTypeSelector from './SearchModeButton';
import TextInputBox from './TextInputBox';
import ImageInputBox from './ImageInputBox';
import { useInputMode } from './useInputMode';
import { containerClass, searchButtonClass } from './styles';
import type { ResultItem } from '../../../results/types';

interface InputPanelProps {
  onSearch: (results: ResultItem[]) => void;
}

const InputPanel: React.FC<InputPanelProps> = ({ onSearch }) => {
  const { mode, switchMode } = useInputMode('text');
  const [query, setQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const mockResults: ResultItem[] = [
    {
      id: '1',
      videoId: 'v1',
      title: 'Nature - Forest',
      thumbnail: 'https://source.unsplash.com/400x300/?forest',
      confidence: 0.95,
      timestamp: '0:25',
    },
    {
      id: '2',
      videoId: 'v1',
      title: 'Nature - Forest',
      thumbnail: 'https://source.unsplash.com/400x300/?forest',
      confidence: 0.88,
      timestamp: '0:42',
    },
    {
      id: '3',
      videoId: 'v2',
      title: 'Ocean Documentary',
      thumbnail: 'https://source.unsplash.com/400x300/?ocean',
      confidence: 0.91,
      timestamp: '1:05',
    },
  ];

  const triggerSearch = () => {
    onSearch(mockResults);
  };

  return (
    <div className={containerClass}>
      <SearchTypeSelector mode={mode} onChange={switchMode} />
      {mode === 'text' && <TextInputBox value={query} onChange={setQuery} />}
      {mode === 'image' && <ImageInputBox selectedImage={selectedImage} onSelectImage={setSelectedImage} />}
      <button onClick={triggerSearch} className={searchButtonClass}>
        Search
      </button>
    </div>
  );
};

export default InputPanel;
