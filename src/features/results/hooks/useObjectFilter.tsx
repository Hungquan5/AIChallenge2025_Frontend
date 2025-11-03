// src/features/results/hooks/useObjectFilter.ts (FIXED - Returns Complete ResultItem Format)

import { useState, useCallback } from 'react';
import type { ResultItem } from '../types';

interface ReverseBackendObjectFilterResponse {
  objects_to_frame_keys: { [objectName: string]: string[] };
  global_object_counts: { [key: string]: number };
}

// ✅ Helper to extract just the fields needed for backend API
const toBackendFormat = (item: ResultItem) => ({
  id: item.id,
  videoId: item.videoId,
  confidence: item.confidence,
  timestamp: item.timestamp
});

export const useObjectFilter = () => {
  const [selectedObjects, setSelectedObjects] = useState<Set<string>>(new Set());
  const [objectsToFrameKeys, setObjectsToFrameKeys] = useState<ReverseBackendObjectFilterResponse['objects_to_frame_keys']>({});
  const [globalObjectCounts, setGlobalObjectCounts] = useState<{ [key: string]: number }>({});
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  const fetchObjectMetadata = useCallback(async (results: ResultItem[]) => {
    if (results.length === 0) {
      setObjectsToFrameKeys({});
      setGlobalObjectCounts({});
      setSelectedObjects(new Set());
      return;
    }

    setIsLoadingMetadata(true);
    try {
      // ✅ Send only the required backend fields
      const backendPayload = results.map(toBackendFormat);
      

      const response = await fetch('http://localhost:5731/embeddings/objects/filter_reverse_lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendPayload),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch object metadata');
      }

      const data: ReverseBackendObjectFilterResponse = await response.json();

      
      setGlobalObjectCounts(data.global_object_counts);
      setObjectsToFrameKeys(data.objects_to_frame_keys);

    } catch (error) {
      console.error('Error fetching object metadata:', error);
      setGlobalObjectCounts({});
      setObjectsToFrameKeys({});
    } finally {
      setIsLoadingMetadata(false);
    }
  }, []);

  // ✅ FIXED: Returns complete ResultItem objects with all fields (title, thumbnail, etc.)
  const filterResults = useCallback(
    (results: ResultItem[]): ResultItem[] => {
      if (selectedObjects.size === 0) {
        // Return all results with complete format when no filter is active
        return results;
      }


      // Find intersection of frame keys across all selected objects
      let commonFrameKeys: Set<string> | null = null;

      Array.from(selectedObjects).forEach((objName) => {
        const framesForThisObject = new Set(objectsToFrameKeys[objName] || []);

        if (commonFrameKeys === null) {
          commonFrameKeys = framesForThisObject;
        } else {
          const beforeSize = commonFrameKeys.size;
          commonFrameKeys = new Set(
            [...commonFrameKeys].filter(key => framesForThisObject.has(key))
          );
        }
      });

      if (!commonFrameKeys || commonFrameKeys.size === 0) {
        return []; // Return empty array (still ResultItem[] type)
      }


      // ✅ Filter and return complete ResultItem objects
      const filteredResults = results.filter((item) => {
        // Extract representative frame_id: take the part before '|' if it exists
        const representativeFrameId = item.timestamp.split('|')[0];
        
        // Build frame key exactly as backend does: "videoId-frameId"
        const frameKey = `${item.videoId}-${representativeFrameId}`;
        const isMatch = commonFrameKeys!.has(frameKey);
        
        if (isMatch) {
        }
        
        return isMatch;
      });
      
      
      // ✅ Returns complete ResultItem[] with all fields intact
      // Each item will have: id, videoId, confidence, timestamp, title, thumbnail
      return filteredResults;
    },
    [selectedObjects, objectsToFrameKeys]
  );

  const handleFilterChange = useCallback((newSelectedObjects: Set<string>) => {
    setSelectedObjects(newSelectedObjects);
  }, []);

  const clearFilter = useCallback(() => {
    setSelectedObjects(new Set());
  }, []);

  return {
    selectedObjects,
    handleFilterChange,
    clearFilter,
    filterResults,
    fetchObjectMetadata,
    isLoadingMetadata,
    globalObjectCounts,
  };
};