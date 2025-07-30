import React, { useRef, useEffect, useState, useCallback } from 'react';
import SortedByConfidenceView from './SortByConfView';
import GroupedByVideoView from './GroupByVideoView';
import type { ResultItem, GroupedResult, ViewMode } from '../../types';
import { containerClass } from './styles';
import { useShortcuts } from '../../../../utils/shortcuts';
import FrameCarousel from '../../../../components/FrameCarousel';

// Define the Keyframe interface to match your FastAPI model
interface Keyframe {
  video_id: string;
  frame_index: number;
  filename: string;
}

interface FrameItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  confidence: number;
  timestamp: string;
}

interface ResultsPanelProps {
  viewMode: ViewMode;
  results: ResultItem[];
  groupedResults?: GroupedResult[];
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ viewMode, results, groupedResults = [] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [carouselFrames, setCarouselFrames] = useState<FrameItem[] | null>(null);
  const [activeFrameId, setActiveFrameId] = useState<string | number | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [frameCache, setFrameCache] = useState<Map<string, FrameItem>>(new Map());
  
  // State for infinite scrolling
  const [hasMoreNext, setHasMoreNext] = useState<boolean>(true);
  const [hasMorePrev, setHasMorePrev] = useState<boolean>(true);
  const [isLoadingBatch, setIsLoadingBatch] = useState<boolean>(false);
  const [minFrameIndex, setMinFrameIndex] = useState<number | null>(null);
  const [maxFrameIndex, setMaxFrameIndex] = useState<number | null>(null);

  // Configuration for batch loading
  const BATCH_SIZE = 10;
  const PRELOAD_THRESHOLD = 3; // Start loading when 3 items from the end

  // Helper to create frame item from keyframe
  const createFrameItem = useCallback((keyframe: Keyframe): FrameItem => ({
    id: `${keyframe.video_id}_${keyframe.frame_index}`,
    videoId: keyframe.video_id,
    title: `Frame ${keyframe.frame_index}`,
    thumbnail: keyframe.filename,
    confidence: 1.0,
    timestamp: keyframe.frame_index.toString()
  }), []);

  // Batch fetch frames in a direction
  const fetchFramesBatch = useCallback(async (
    videoId: string, 
    startFrameIndex: number, 
    direction: 'next' | 'prev',
    batchSize: number = BATCH_SIZE
  ): Promise<FrameItem[]> => {
    try {
      setIsLoadingBatch(true);
      
      const endpoint = direction === 'next' 
        ? `http://localhost:9991/keyframes/batch-next`
        : `http://localhost:9991/keyframes/batch-prev`;
      
      const response = await fetch(
        `${endpoint}?video_id=${encodeURIComponent(videoId)}&frame_index=${startFrameIndex}&batch_size=${batchSize}`,
        {
          signal: AbortSignal.timeout(10000) // 10 second timeout for batch requests
        }
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          // No more frames in this direction
          if (direction === 'next') {
            setHasMoreNext(false);
          } else {
            setHasMorePrev(false);
          }
          return [];
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const frames: Keyframe[] = await response.json();
      const frameItems = frames.map(createFrameItem);
      
      // Cache all fetched frames
      frameItems.forEach(frameItem => {
        setFrameCache(prev => new Map(prev).set(frameItem.id, frameItem));
      });
      
      // Update min/max frame indices
      if (frameItems.length > 0) {
        const frameIndices = frameItems.map(f => parseInt(f.timestamp));
        const newMin = Math.min(...frameIndices);
        const newMax = Math.max(...frameIndices);
        
        setMinFrameIndex(prev => prev === null ? newMin : Math.min(prev, newMin));
        setMaxFrameIndex(prev => prev === null ? newMax : Math.max(prev, newMax));
      }
      
      // If we got fewer frames than requested, we've reached the end
      if (frames.length < batchSize) {
        if (direction === 'next') {
          setHasMoreNext(false);
        } else {
          setHasMorePrev(false);
        }
      }
      
      return frameItems;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Batch request timed out');
      } else {
        console.error(`Error fetching ${direction} batch:`, error);
      }
      return [];
    } finally {
      setIsLoadingBatch(false);
    }
  }, [createFrameItem]);

  // Load more frames when approaching the end
  const loadMoreFrames = useCallback(async (direction: 'next' | 'prev') => {
    if (!currentVideoId || !carouselFrames || isLoadingBatch) return;
    
    const hasMore = direction === 'next' ? hasMoreNext : hasMorePrev;
    if (!hasMore) return;
    
    const startIndex = direction === 'next' 
      ? maxFrameIndex !== null ? maxFrameIndex : 0
      : minFrameIndex !== null ? minFrameIndex : 0;
    
    const newFrames = await fetchFramesBatch(currentVideoId, startIndex, direction);
    
    if (newFrames.length > 0) {
      setCarouselFrames(prevFrames => {
        if (!prevFrames) return newFrames;
        
        if (direction === 'next') {
          // Add to end, remove duplicates
          const existingIds = new Set(prevFrames.map(f => f.id));
          const uniqueNewFrames = newFrames.filter(f => !existingIds.has(f.id));
          return [...prevFrames, ...uniqueNewFrames];
        } else {
          // Add to beginning, remove duplicates
          const existingIds = new Set(prevFrames.map(f => f.id));
          const uniqueNewFrames = newFrames.filter(f => !existingIds.has(f.id));
          return [...uniqueNewFrames, ...prevFrames];
        }
      });
    }
  }, [currentVideoId, carouselFrames, isLoadingBatch, hasMoreNext, hasMorePrev, maxFrameIndex, minFrameIndex, fetchFramesBatch]);

  // Navigate to next frame using cached data or trigger batch load
  const navigateToNextFrame = useCallback(async () => {
    if (!currentVideoId || activeFrameId === null || !carouselFrames) return;
    
    const currentFrameIndex = typeof activeFrameId === 'number' ? activeFrameId : parseInt(activeFrameId.toString());
    const currentIndex = carouselFrames.findIndex(f => parseInt(f.timestamp) === currentFrameIndex);
    
    // Check if we have the next frame in our current frames
    if (currentIndex < carouselFrames.length - 1) {
      // Next frame is already loaded
      const nextFrame = carouselFrames[currentIndex + 1];
      setActiveFrameId(parseInt(nextFrame.timestamp));
      
      // Check if we need to preload more frames
      const isNearEnd = currentIndex >= carouselFrames.length - PRELOAD_THRESHOLD;
      if (isNearEnd && hasMoreNext && !isLoadingBatch) {
        loadMoreFrames('next');
      }
    } else if (hasMoreNext && !isLoadingBatch) {
      // Need to load more frames
      setIsLoading(true);
      
      // Store current frame info before loading
      const currentFrameInfo = {
        frameIndex: currentFrameIndex,
        arrayIndex: currentIndex
      };
      
      await loadMoreFrames('next');
      setIsLoading(false);
      
      // After loading, find the next frame based on frame index, not array position
      setCarouselFrames(updatedFrames => {
        if (updatedFrames) {
          // Find the current frame in the updated array
          const newCurrentIndex = updatedFrames.findIndex(f => parseInt(f.timestamp) === currentFrameInfo.frameIndex);
          
          if (newCurrentIndex >= 0 && newCurrentIndex < updatedFrames.length - 1) {
            // Navigate to the actual next frame (next in sequence, not next in original array)
            const nextFrame = updatedFrames[newCurrentIndex + 1];
            setActiveFrameId(parseInt(nextFrame.timestamp));
          } else {
            // Find the frame with the next frame index (chronologically next)
            const nextFrameIndex = currentFrameInfo.frameIndex + 1;
            const nextFrame = updatedFrames.find(f => parseInt(f.timestamp) === nextFrameIndex);
            if (nextFrame) {
              setActiveFrameId(parseInt(nextFrame.timestamp));
            } else {
              // If no exact next frame, find the first frame with higher index
              const higherFrames = updatedFrames
                .filter(f => parseInt(f.timestamp) > currentFrameInfo.frameIndex)
                .sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
              
              if (higherFrames.length > 0) {
                setActiveFrameId(parseInt(higherFrames[0].timestamp));
              }
            }
          }
        }
        return updatedFrames;
      });
    }
  }, [currentVideoId, activeFrameId, carouselFrames, hasMoreNext, isLoadingBatch, loadMoreFrames]);

  // Navigate to previous frame using cached data or trigger batch load
  const navigateToPrevFrame = useCallback(async () => {
    if (!currentVideoId || activeFrameId === null || !carouselFrames) return;
    
    const currentFrameIndex = typeof activeFrameId === 'number' ? activeFrameId : parseInt(activeFrameId.toString());
    const currentIndex = carouselFrames.findIndex(f => parseInt(f.timestamp) === currentFrameIndex);
    
    // Check if we have the previous frame in our current frames
    if (currentIndex > 0) {
      // Previous frame is already loaded
      const prevFrame = carouselFrames[currentIndex - 1];
      setActiveFrameId(parseInt(prevFrame.timestamp));
      
      // Check if we need to preload more frames
      const isNearStart = currentIndex <= PRELOAD_THRESHOLD;
      if (isNearStart && hasMorePrev && !isLoadingBatch) {
        loadMoreFrames('prev');
      }
    } else if (hasMorePrev && !isLoadingBatch) {
      // Need to load more frames
      setIsLoading(true);
      
      // Store current frame info before loading
      const currentFrameInfo = {
        frameIndex: currentFrameIndex,
        arrayIndex: currentIndex
      };
      
      await loadMoreFrames('prev');
      setIsLoading(false);
      
      // After loading, find the previous frame based on frame index, not array position
      setCarouselFrames(updatedFrames => {
        if (updatedFrames) {
          // Find the current frame in the updated array
          const newCurrentIndex = updatedFrames.findIndex(f => parseInt(f.timestamp) === currentFrameInfo.frameIndex);
          
          if (newCurrentIndex > 0) {
            // Navigate to the actual previous frame
            const prevFrame = updatedFrames[newCurrentIndex - 1];
            setActiveFrameId(parseInt(prevFrame.timestamp));
          } else {
            // Find the frame with the previous frame index (chronologically previous)
            const prevFrameIndex = currentFrameInfo.frameIndex - 1;
            const prevFrame = updatedFrames.find(f => parseInt(f.timestamp) === prevFrameIndex);
            if (prevFrame) {
              setActiveFrameId(parseInt(prevFrame.timestamp));
            } else {
              // If no exact previous frame, find the last frame with lower index
              const lowerFrames = updatedFrames
                .filter(f => parseInt(f.timestamp) < currentFrameInfo.frameIndex)
                .sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
              
              if (lowerFrames.length > 0) {
                setActiveFrameId(parseInt(lowerFrames[0].timestamp));
              }
            }
          }
        }
        return updatedFrames;
      });
    }
  }, [currentVideoId, activeFrameId, carouselFrames, hasMorePrev, isLoadingBatch, loadMoreFrames]);

  // Handle frame change from carousel (when user navigates directly)
  const handleFrameChange = useCallback((newFrameId: string | number) => {
    setActiveFrameId(newFrameId);
  }, []);

  // Enhanced result click handler with initial batch loading
  const handleResultClick = useCallback(async (item: ResultItem) => {
    try {
      setIsLoading(true);
      const currentFrameIndex = typeof item.timestamp === 'number' ? item.timestamp : parseInt(item.timestamp);
      
      // Reset states for new video
      setCurrentVideoId(item.videoId);
      setHasMoreNext(true);
      setHasMorePrev(true);
      setMinFrameIndex(currentFrameIndex);
      setMaxFrameIndex(currentFrameIndex);
      
      // Create initial frame from the clicked item
      const currentFrame: FrameItem = {
        id: `${item.videoId}_${currentFrameIndex}`,
        videoId: item.videoId,
        title: `Frame ${currentFrameIndex}`,
        thumbnail: item.filename || `keyframe_${currentFrameIndex}.webp`, // Fallback if filename is not provided
        confidence: item.confidence || 1.0,
        timestamp: currentFrameIndex.toString()
      };
      
      // Set active frame immediately for responsiveness
      setActiveFrameId(currentFrameIndex);
      setCarouselFrames([currentFrame]);
      
      // Clear old cache to prevent memory issues
      setFrameCache(new Map([[currentFrame.id, currentFrame]]));
      
      // Load initial batches in both directions
      const [nextBatch, prevBatch] = await Promise.all([
        fetchFramesBatch(item.videoId, currentFrameIndex, 'next', BATCH_SIZE),
        fetchFramesBatch(item.videoId, currentFrameIndex, 'prev', BATCH_SIZE)
      ]);
      
      // Combine all frames and sort by frame index
      const allFrames = [...prevBatch, currentFrame, ...nextBatch]
        .filter((frame, index, array) => 
          array.findIndex(f => f.id === frame.id) === index // Remove duplicates
        )
        .sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
      
      setCarouselFrames(allFrames);
      
    } catch (error) {
      console.error('Error opening frame carousel:', error);
      setCarouselFrames(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFramesBatch]);

  const handleCarouselClose = useCallback(() => {
    setCarouselFrames(null);
    setActiveFrameId(null);
    setCurrentVideoId(null);
    setHasMoreNext(true);
    setHasMorePrev(true);
    setMinFrameIndex(null);
    setMaxFrameIndex(null);
    setIsLoadingBatch(false);
    
    // Clear cache to free memory
    setFrameCache(new Map());
  }, []);

  // Enhanced keyboard navigation for results
  const focusNextResult = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const items = container.querySelectorAll('.result-item');
    const currentFocus = document.activeElement;
    const currentIndex = Array.from(items).indexOf(currentFocus as Element);
    
    if (currentIndex === -1 && items.length > 0) {
      (items[0] as HTMLElement).focus();
    } else if (currentIndex < items.length - 1) {
      (items[currentIndex + 1] as HTMLElement).focus();
    }
  }, []);

  const focusPrevResult = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const items = container.querySelectorAll('.result-item');
    const currentFocus = document.activeElement;
    const currentIndex = Array.from(items).indexOf(currentFocus as Element);
    
    if (currentIndex === -1 && items.length > 0) {
      (items[items.length - 1] as HTMLElement).focus();
    } else if (currentIndex > 0) {
      (items[currentIndex - 1] as HTMLElement).focus();
    }
  }, []);

  useShortcuts({
    NEXT_RESULT: focusNextResult,
    PREV_RESULT: focusPrevResult,
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setFrameCache(new Map());
    };
  }, []);

  return (
    <div className={containerClass} ref={containerRef}>
      {viewMode === 'sortByConfidence' ? (
        <SortedByConfidenceView results={results} onResultClick={handleResultClick} />
      ) : (
        <GroupedByVideoView groupedResults={groupedResults} onResultClick={handleResultClick} />
      )}
      {carouselFrames && activeFrameId !== null && (
        <FrameCarousel
          frames={carouselFrames}
          activeFrameId={activeFrameId}
          onClose={handleCarouselClose}
          onNext={navigateToNextFrame}
          onPrev={navigateToPrevFrame}
          onFrameChange={handleFrameChange}
          isLoading={isLoading || isLoadingBatch}
        />
      )}
    </div>
  );
};

export default ResultsPanel;