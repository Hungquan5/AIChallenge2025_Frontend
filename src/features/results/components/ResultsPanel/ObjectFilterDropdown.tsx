// src/features/results/components/ResultsPanel/ObjectFilterDropdown.tsx (MODIFIED - Minimal changes, mostly for clarity)

import React, { useState, useEffect, useCallback } from 'react';
import { Filter, ChevronDown, X, Loader2 } from 'lucide-react';
import type { ResultItem } from '../../types';

interface ObjectFilterDropdownProps {
  // 'results' prop is no longer strictly needed for fetching objects in this component,
  // but it's passed to the useObjectFilter hook in App.tsx.
  results: ResultItem[]; // Still received, but not used for API fetch within THIS component anymore
  selectedObjects: Set<string>;
  onFilterChange: (selectedObjects: Set<string>) => void;
  globalObjectCounts: { [key: string]: number }; // Passed from useObjectFilter hook
  isLoading: boolean; // Passed from useObjectFilter hook
}

const ObjectFilterDropdown: React.FC<ObjectFilterDropdownProps> = ({
  results, // Not used directly in this component's logic for filtering/displaying objects
  selectedObjects,
  onFilterChange,
  globalObjectCounts, // 🆕 Used directly here
  isLoading, // 🆕 Used directly here
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggleObject = useCallback((objectName: string) => {
    const newSelected = new Set(selectedObjects);
    if (newSelected.has(objectName)) {
      newSelected.delete(objectName);
    } else {
      newSelected.add(objectName);
    }
    onFilterChange(newSelected);
  }, [selectedObjects, onFilterChange]);

  const handleClearAll = useCallback(() => {
    onFilterChange(new Set());
  }, [onFilterChange]);

  const handleSelectAll = useCallback(() => {
    // Select all objects that are currently available in globalObjectCounts
    // This correctly uses the prop directly
    onFilterChange(new Set(Object.keys(globalObjectCounts)));
  }, [globalObjectCounts, onFilterChange]);

  // Filter objects based on search term from the global counts prop
  const filteredObjects = Object.entries(globalObjectCounts).filter(([name]) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const objectCount = Object.keys(globalObjectCounts).length;
  const selectedCount = selectedObjects.size;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
          selectedCount > 0
            ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600'
            : 'text-slate-600 bg-slate-100/80 hover:bg-white/90 hover:shadow-md'
        }`}
        disabled={isLoading || objectCount === 0}
      >
        <Filter className="w-4 h-4" />
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <span>Objects</span>
            {selectedCount > 0 && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
                {selectedCount}
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Panel */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-700">Filter by Objects</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Input */}
              <input
                type="text"
                placeholder="Search objects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Action Buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSelectAll}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
                  disabled={selectedCount === 0}
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Object List */}
            <div className="max-h-96 overflow-y-auto p-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading objects...
                </div>
              ) : filteredObjects.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  {objectCount === 0
                    ? 'No objects found in results'
                    : 'No objects match your search'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredObjects.map(([objectName, count]) => {
                    const isSelected = selectedObjects.has(objectName);
                    return (
                      <label
                        key={objectName}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50 hover:bg-blue-100'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleObject(objectName)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span
                            className={`text-sm truncate ${
                              isSelected
                                ? 'font-medium text-blue-700'
                                : 'text-slate-700'
                            }`}
                          >
                            {objectName}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium ml-2">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(ObjectFilterDropdown);