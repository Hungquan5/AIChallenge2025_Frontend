// src/features/dislike/components/DislikePanel.tsx

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
  // We need to pass these through to the ResultCard
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
    // ✅ Remove absolute positioning - it's now handled by the parent container
    <div 
      className="
        h-full w-[10vw] min-w-[150px]
        bg-slate-100/95 backdrop-blur-md shadow-2xl 
        flex flex-col border-l border-slate-300/50
      "
    >
      {/* Panel Header - Fixed at top */}
      <header className="flex items-center justify-between p-2 border-b border-slate-300/50 bg-white/50 flex-shrink-0">
        <h2 className="text-sm font-semibold text-slate-700">Disliked ({items.length})</h2>
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

      {/* Scrollable content area - Independent scrolling */}
      <div className="flex-1 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-300">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center text-xs text-slate-500 p-4">
            Items you dislike with <kbd>Ctrl</kbd> + <kbd>Right-Click</kbd> will appear here.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-1">
            {items.map(item => (
              <ResultCard
                key={item.id}
                id={item.id}
                thumbnail={item.thumbnail}
                title={item.title}
                confidence={item.confidence}
                timestamp={item.timestamp}
                loaded={true} // Assume loaded since they were already displayed
                onLoad={() => {}} // No-op needed
                onClick={() => onResultClick(item)}
                // Re-purpose Ctrl+Right-Click to mean "remove from this list"
                onDislike={() => onUndislike(item)}
                onSimilaritySearch={onSimilaritySearch}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DislikePanel;