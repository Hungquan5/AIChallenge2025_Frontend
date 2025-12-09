// src/features/search/components/HistoryPanel/HistoryPanel.tsx
import React, { useState, useEffect, useRef } from 'react';
import type { HistoryItem, Query } from '../../search/types';
import { 
  History, X, FileText, Image as ImageIcon, Clock, 
  Search, ArrowRight, Trash2, ChevronDown 
} from 'lucide-react';

interface HistoryPanelProps {
  isVisible: boolean;
  items: HistoryItem[] | null;
  onSelect: (item: HistoryItem) => void;
  onClose: () => void;
  onDelete?: (index: number) => void; // Optional delete functionality
}

// Enhanced query type indicator with better visuals
const QueryTypeIndicator: React.FC<{ query: Query }> = ({ query }) => {
  const isImage = query.imageFile || (query as any).image;
  
  if (isImage) {
    return (
      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-sm">
        <ImageIcon className="w-4 h-4 text-white" />
      </div>
    );
  }
  
  return (
    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-sm">
      <FileText className="w-4 h-4 text-white" />
    </div>
  );
};

// Preview component for query content
const QueryPreview: React.FC<{ queries: Query[] }> = ({ queries }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const firstQuery = queries[0];
  const hasMultipleQueries = queries.length > 1;
  
  const getPreviewText = (query: Query) => {
    return query.text || query.origin || query.asr || query.ocr || 'Image Query';
  };

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-medium text-slate-800 truncate">
          {getPreviewText(firstQuery)}
        </span>
        {hasMultipleQueries && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex-shrink-0 p-1 hover:bg-slate-200 rounded transition-colors"
          >
            <ChevronDown 
              className={`w-3 h-3 text-slate-500 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`} 
            />
          </button>
        )}
      </div>
      
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Clock className="w-3 h-3" />
        <span>
          {queries.length} quer{queries.length === 1 ? 'y' : 'ies'}
        </span>
        {queries.some(q => q.lang === 'eng') && (
          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
            Translated
          </span>
        )}
      </div>
      
      {isExpanded && hasMultipleQueries && (
        <div className="mt-2 space-y-1 pl-2 border-l-2 border-slate-200">
          {queries.slice(1).map((query, index) => (
            <div key={index} className="text-xs text-slate-600 truncate">
              {getPreviewText(query)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Enhanced history item component
const HistoryItem: React.FC<{
  item: HistoryItem;
  index: number;
  isSelected: boolean;
  onSelect: (item: HistoryItem) => void;
  onDelete?: (index: number) => void;
  onMouseEnter: () => void;
}> = ({ item, index, isSelected, onSelect, onDelete, onMouseEnter }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <li
      className={`
        group relative p-3 rounded-xl cursor-pointer transition-all duration-200
        border-2 ${
          isSelected 
            ? 'border-blue-500 bg-blue-50 shadow-md transform scale-[1.02]' 
            : 'border-transparent hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm'
        }
      `}
      onClick={() => onSelect(item)}
      onMouseEnter={() => {
        onMouseEnter();
        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        <QueryTypeIndicator query={item.queries[0]} />
        <QueryPreview queries={item.queries} />
        
        {/* Action buttons */}
        <div className={`flex items-center gap-1 transition-opacity duration-200 ${
          isHovered || isSelected ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
            className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
            title="Use this query"
          >
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </button>
          
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(index);
              }}
              className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
              title="Delete from history"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          )}
        </div>
      </div>
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
      )}
    </li>
  );
};

const HistoryPanel: React.FC<HistoryPanelProps> = ({ 
  isVisible, 
  items, 
  onSelect, 
  onClose, 
  onDelete 
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Filter items based on search
  const filteredItems = items?.filter(item =>
    item.queries.some(query =>
      (query.text?.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (query.origin?.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (query.asr?.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (query.ocr?.toLowerCase().includes(searchFilter.toLowerCase()))
    )
  ) || [];

  // Reset index when items change or filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [items, searchFilter]);

  // Focus search input when panel opens
  useEffect(() => {
    if (isVisible && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isVisible]);
  
  useEffect(() => {
    if (!isVisible || !filteredItems.length) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere if user is typing in search
      if (e.target === searchRef.current) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          searchRef.current?.blur();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            onSelect(filteredItems[selectedIndex]);
          }
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          onSelect(filteredItems[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, filteredItems, selectedIndex, onSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (isVisible && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex, isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Enhanced overlay with backdrop blur */}
      <div 
        className="fixed inset-0 z-30 bg-black/10 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      <div 
        className="absolute top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl max-h-[70vh] bg-white/95 backdrop-blur-xl flex flex-col rounded-2xl shadow-2xl border border-slate-200/70 overflow-hidden z-40 animate-in fade-in-50 slide-in-from-top-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Enhanced header */}
        <header className="flex-shrink-0 p-4 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                <History className="w-5 h-5 text-white" />
              </div>
              Query History
            </h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
              title="Close history (Esc)"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          
          {/* Search filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search history... (press / to focus)"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>
        </header>

        {/* Enhanced content area */}
        <div className="flex-1 overflow-hidden">
          {!items ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-500">
              <History className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">
                {searchFilter ? 'No matching history found.' : 'No history available yet.'}
              </p>
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="text-blue-500 text-xs mt-1 hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <ul ref={listRef} className="p-3 space-y-2 overflow-y-auto max-h-full">
              {filteredItems.map((item, index) => (
                <HistoryItem
                  key={index}
                  item={item}
                  index={index}
                  isSelected={index === selectedIndex}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onMouseEnter={() => setSelectedIndex(index)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Enhanced footer with shortcuts */}
        <footer className="flex-shrink-0 px-4 py-3 bg-slate-50/80 border-t border-slate-200/80 text-xs text-slate-500">
          <div className="flex items-center justify-between">
            <span>
              {filteredItems.length > 0 && `${filteredItems.length} item${filteredItems.length === 1 ? '' : 's'}`}
            </span>
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>Enter Select</span>
              <span>/ Search</span>
              <span>Esc Close</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HistoryPanel;