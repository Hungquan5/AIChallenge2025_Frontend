// src/features/dislike/components/DislikePanel.tsx (MODIFIED)

import React from 'react';
import { Trash2, X } from 'lucide-react';
import type { ResultItem } from '../../results/types';
import ResultCard from '../../results/components/ResultsPanel/ResultCard';

interface DislikePanelProps {
  isOpen: boolean;
  items: ResultItem[];
  onClose: () => void;
  onClear: () => void;
  onUndislike: (item: ResultItem) => void;
  onResultClick: (item: ResultItem) => void;
  onSimilaritySearch: (imageSrc: string, cardId: string) => void;
}

const DislikePanel: React.FC<DislikePanelProps> = ({
  isOpen,
  items,
  onClose,
  onClear,
  onUndislike,
  onResultClick,
  onSimilaritySearch,
}) => {
  return (
    // ✅ FIX: The root container now handles its own animation based on the `isOpen` prop.
    // It transitions its width and border, and `overflow-hidden` clips the content during the animation.
    <div 
      className={`
        h-full bg-slate-100/95 backdrop-blur-md shadow-2xl flex flex-col
        transition-all duration-300 ease-in-out overflow-hidden
        ${isOpen ? 'w-[10vw] min-w-[150px] border-l border-slate-300/50' : 'w-0 min-w-0 border-l-0'}
      `}
    >
      {/* Inner wrapper to handle fading the content, preventing text wrapping issues during animation */}
      <div className={`flex flex-col flex-1 min-w-0 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        {/* Panel Header */}
        <header className="flex items-center justify-between p-1  order-b border-slate-300/50 bg-white/50 flex-shrink-0">
          <h2 className="text-sm font-semibold text-slate-700 whitespace-nowrap">Disliked ({items.length})</h2>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                onClick={onClear}
                title="Clear all disliked items"
                className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              title="Close panel (Ctrl+D)"
              className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-300">
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center text-xs text-slate-500 p-2">
              Items you dislike with <kbd>Ctrl</kbd> + <kbd>Right-Click</kbd> will appear here.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1">
              {items.map(item => (
                <ResultCard
                  key={item.id}
                  item={item}
                  loaded={true}
                  onLoad={() => {}}
                  onClick={onResultClick}
                  onDislike={onUndislike}
                  onSimilaritySearch={onSimilaritySearch}
                  imageClassName="transition-all duration-200"
                  showConfidence={true}
                  showTimestamp={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DislikePanel;