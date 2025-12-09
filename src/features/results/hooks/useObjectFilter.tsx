// src/features/results/hooks/useObjectFilter.ts (HIGHLY OPTIMIZED)

import { useState, useCallback, useRef } from 'react';
import type { ResultItem } from '../types';

interface ReverseBackendObjectFilterResponse {
  objects_to_frame_keys: { [objectName: string]: string[] };
  global_object_counts: { [key: string]: number };
}

const toBackendFormat = (item: ResultItem) => ({
  id: item.id,
  videoId: item.videoId,
  confidence: item.confidence,
  timestamp: item.timestamp
});

// ✅ OPTIMIZATION: Faster hash using minimal data
const createResultsHash = (results: ResultItem[]): string => {
  if (results.length === 0) return '';
  const first = results[0];
  const last = results[results.length - 1];
  return `${first.videoId}-${first.timestamp}|${last.videoId}-${last.timestamp}|${results.length}`;
};

export const useObjectFilter = () => {
  const [selectedObjects, setSelectedObjects] = useState<Set<string>>(new Set());
  const [objectsToFrameKeys, setObjectsToFrameKeys] = useState<
    ReverseBackendObjectFilterResponse['objects_to_frame_keys']
  >({});
  const [globalObjectCounts, setGlobalObjectCounts] = useState<{ [key: string]: number }>({});
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  
  const lastFetchedHashRef = useRef<string>('');
  const frameKeySetRef = useRef<Map<string, Set<string>>>(new Map());
  
  // ✅ NEW: Abort controller for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // ✅ NEW: Track if a fetch is already in progress
  const isFetchingRef = useRef(false);

  // ✅ OPTIMIZATION: Return a promise so it can be awaited if needed
  const fetchObjectMetadata = useCallback(async (results: ResultItem[]): Promise<void> => {
    const currentHash = createResultsHash(results);
    
    // Skip if same results or already fetching
    if (currentHash === lastFetchedHashRef.current && currentHash !== '') {
      return;
    }
    
    if (isFetchingRef.current) {
      // Cancel previous request
      abortControllerRef.current?.abort();
    }

    if (results.length === 0) {
      setObjectsToFrameKeys({});
      setGlobalObjectCounts({});
      setSelectedObjects(new Set());
      lastFetchedHashRef.current = '';
      frameKeySetRef.current.clear();
      return;
    }

    isFetchingRef.current = true;
    setIsLoadingMetadata(true);
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const backendPayload = results.map(toBackendFormat);
      
      const response = await fetch(
        'http://localhost:5731/embeddings/objects/filter_reverse_lookup',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(backendPayload),
          signal // Pass abort signal
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch object metadata');
      
      const data: ReverseBackendObjectFilterResponse = await response.json();

      // Check if request was aborted
      if (signal.aborted) return;

      // ✅ OPTIMIZATION: Build the frame key map once
      const newFrameKeyMap = new Map<string, Set<string>>();
      Object.entries(data.objects_to_frame_keys).forEach(([objName, keys]) => {
        newFrameKeyMap.set(objName, new Set(keys));
      });
      
      // Batch state updates
      setGlobalObjectCounts(data.global_object_counts);
      setObjectsToFrameKeys(data.objects_to_frame_keys);
      frameKeySetRef.current = newFrameKeyMap;
      objectsToFrameKeys
      lastFetchedHashRef.current = currentHash;

    } catch (error) {
      console.error('Error fetching object metadata:', error);
      setGlobalObjectCounts({});
      setObjectsToFrameKeys({});
      frameKeySetRef.current.clear();
    } finally {
      if (!signal.aborted) {
        setIsLoadingMetadata(false);
        isFetchingRef.current = false;
      }
    }
  }, []);

  // ✅ OPTIMIZATION: Highly optimized filter with early exits and Set operations
  const filterResults = useCallback(
    (results: ResultItem[]): ResultItem[] => {
      if (selectedObjects.size === 0) {
        return results;
      }

      // Early exit if no metadata loaded yet
      if (frameKeySetRef.current.size === 0) {
        return [];
      }

      const selectedArray = Array.from(selectedObjects);
      
      // ✅ OPTIMIZATION: Find the smallest set first for faster intersection
      let smallestSet: Set<string> | null = null;
      let smallestSize = Infinity;
      
      for (const objName of selectedArray) {
        const framesForThisObject = frameKeySetRef.current.get(objName);
        
        if (!framesForThisObject || framesForThisObject.size === 0) {
          return []; // Early exit if any object has no frames
        }
        
        if (framesForThisObject.size < smallestSize) {
          smallestSize = framesForThisObject.size;
          smallestSet = framesForThisObject;
        }
      }

      if (!smallestSet) return [];

      // ✅ OPTIMIZATION: Start with the smallest set and intersect with others
      let commonFrameKeys = new Set(smallestSet);
      
      for (const objName of selectedArray) {
        const framesForThisObject = frameKeySetRef.current.get(objName);
        
        // Skip the set we already started with
        if (framesForThisObject === smallestSet) continue;
        
        if (!framesForThisObject) return [];
        
        // In-place intersection
        for (const key of commonFrameKeys) {
          if (!framesForThisObject.has(key)) {
            commonFrameKeys.delete(key);
          }
        }
        
        // Early exit if intersection is empty
        if (commonFrameKeys.size === 0) {
          return [];
        }
      }

      if (commonFrameKeys.size === 0) {
        return [];
      }

      // ✅ OPTIMIZATION: Filter with O(1) Set lookup
      return results.filter((item) => {
        const representativeFrameId = item.timestamp.split('|')[0];
        const frameKey = `${item.videoId}-${representativeFrameId}`;
        return commonFrameKeys.has(frameKey);
      });
    },
    [selectedObjects]
  );

  const handleFilterChange = useCallback((newSelectedObjects: Set<string>) => {
    setSelectedObjects(newSelectedObjects);
  }, []);

  const clearFilter = useCallback(() => {
    setSelectedObjects(new Set());
  }, []);

  // ✅ NEW: Cleanup function to cancel pending requests
  const cleanup = useCallback(() => {
    abortControllerRef.current?.abort();
    isFetchingRef.current = false;
  }, []);

  return {
    selectedObjects,
    handleFilterChange,
    clearFilter,
    filterResults,
    fetchObjectMetadata,
    isLoadingMetadata,
    globalObjectCounts,
    cleanup, // Export cleanup for component unmount
  };
};  