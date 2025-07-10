import React from 'react';
import { FileText, Image } from 'lucide-react';
import type { SearchMode } from './useInputMode';
import {
  buttonGroupGrid,
  modeButtonShared,
  modeButtonSelected,
  modeButtonUnselected,
  modeIconClass,
  modeLabelClass,
} from './styles';

interface SearchTypeSelectorProps {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
}

const searchOptions: { type: SearchMode; label: string; icon: React.ElementType }[] = [
  { type: 'text', label: 'Text', icon: FileText },
  { type: 'image', label: 'Image', icon: Image },
];

const SearchTypeSelector: React.FC<SearchTypeSelectorProps> = ({ mode, onChange }) => {
  return (
    <div className={buttonGroupGrid}>
      {searchOptions.map(({ type, label, icon: Icon }) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={`${modeButtonShared} ${mode === type ? modeButtonSelected : modeButtonUnselected}`}
        >
          <Icon className={modeIconClass} />
          <span className={modeLabelClass}>{label}</span>
        </button>
      ))}
    </div>
  );
};

export default SearchTypeSelector;
