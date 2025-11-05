import { useState, useCallback, useRef} from 'react';
import type { ResultItem } from '../types';

// Backend Keyframe structure
interface Keyframe {
  video_id: string;
  frame_index: number;
  filename: string;
}

const FETCH_ALL_BATCH_SIZE = 10;

export const useKeyframeLoader = () => {
  const [carouselFrames, setCarouselFrames] = useState<ResultItem[] | null>(null);
  const [activeFrameId, setActiveFrameId] = useState<string | number | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [isFetchingPrev, setIsFetchingPrev] = useState(false);
  
  const [hasMoreNext, setHasMoreNext] = useState(true);
  const [hasMorePrev, setHasMorePrev] = useState(true);
  
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRequestTimeRef = useRef<{ [key: string]: number }>({});
  
  // Cache for processed frames to avoid recomputation
  const framesCacheRef = useRef<Map<string, ResultItem>>(new Map());

  const createFrameItem = useCallback((kf: Keyframe): ResultItem => {
    const frameId = `${kf.video_id}_${kf.frame_index}`;
    
    // Check cache first
    const cached = framesCacheRef.current.get(frameId);
    if (cached) return cached;
    
    const frameItem: ResultItem = {
      id: frameId,
      videoId: kf.video_id,
      title: `${kf.video_id}/${kf.frame_index}`,
      thumbnail: kf.filename,
      confidence: 1.0,
      timestamp: kf.frame_index.toString(),
    };
    
    // Cache the result
    framesCacheRef.current.set(frameId, frameItem);
    return frameItem;
  }, []);

  // Optimized deduplication using Set for O(n) instead of O(n²)
  const deduplicateFrames = useCallback((frames: ResultItem[]): ResultItem[] => {
    const seen = new Set<string>();
    return frames.filter(frame => {
      if (seen.has(frame.id)) return false;
      seen.add(frame.id);
      return true;
    });
  }, []);

  // Memoized sorting function
  const sortFramesByTimestamp = useCallback((frames: ResultItem[]): ResultItem[] => {
    return [...frames].sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
  }, []);

  const fetchFramesBatch = useCallback(async (
    videoId: string,
    startIndex: number,
    direction: 'next' | 'prev'
  ): Promise<ResultItem[]> => {
    const requestKey = `${videoId}-${direction}`;
    const now = Date.now();
    const lastRequest = lastRequestTimeRef.current[requestKey] || 0;
    
    if (now - lastRequest < 500) {
      return [];
    }
    
    lastRequestTimeRef.current[requestKey] = now;

    try {
      const endpoint = direction === 'next'
        ? `http://localhost:9991/keyframes/batch-next`
        : `http://localhost:9991/keyframes/batch-prev`;
      
      const response = await fetch(
        `${endpoint}?video_id=${videoId}&frame_index=${startIndex}&batch_size=${FETCH_ALL_BATCH_SIZE}`
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`HTTP error ${response.status}`);
      }

      const keyframes: Keyframe[] = await response.json();
      return keyframes.map(createFrameItem);
    } catch (err) {
      console.error(`Error loading ${direction} batch for video ${videoId}:`, err);
      return [];
    }
  }, [createFrameItem]);

  // Image preloader function
  const preloadImages = useCallback((frames: ResultItem[]) => {
    frames.forEach(frame => {
      const img = new Image();
      img.src = frame.thumbnail;
      // Don't wait for load, just start the request
    });
  }, []);

  /**
   * OPTIMIZED: Initial load with immediate UI feedback
   */
  const handleResultClick = useCallback(async (item: ResultItem) => {
    const clickedFrameIndex = parseInt(item.timestamp, 10);
    const currentFrame: ResultItem = { ...item, id: `${item.videoId}_${clickedFrameIndex}` };

    // IMMEDIATE: Update UI state first for instant feedback
    setIsLoading(true);
    setCurrentVideoId(item.videoId);
    setActiveFrameId(item.timestamp);
    
    // Show the clicked frame immediately while loading others
    setCarouselFrames([currentFrame]);
    
    // Reset pagination state
    setHasMoreNext(true);
    setHasMorePrev(true);
    setIsFetchingNext(false);
    setIsFetchingPrev(false);

    // src/features/results/hooks/useKeyframeLoader.ts

// ... inside the handleResultClick function ...
try {
  // Start preloading the clicked frame image immediately
  preloadImages([currentFrame]);

  // Load batches with reduced blocking
  const batchPromises = [
    fetchFramesBatch(item.videoId, clickedFrameIndex, 'prev'),
    fetchFramesBatch(item.videoId, clickedFrameIndex, 'next')
  ];

  // Use Promise.allSettled to handle partial failures gracefully
  const [prevResult, nextResult] = await Promise.allSettled(batchPromises);
  
  const prevFrames = prevResult.status === 'fulfilled' ? prevResult.value : [];
  const nextFrames = nextResult.status === 'fulfilled' ? nextResult.value : [];

  // Combine frames efficiently
  const allFrames = [
    ...prevFrames,
    currentFrame,
    ...nextFrames
  ];

  // ✅ FIXED: REMOVE requestIdleCallback and process immediately
  const uniqueFrames = deduplicateFrames(allFrames);
  const sortedFrames = sortFramesByTimestamp(uniqueFrames);
    
  // Update state with optimized frames
  setCarouselFrames(sortedFrames);
    
  // Start preloading all images
  preloadImages(sortedFrames);
    
  // Update pagination flags
  setHasMoreNext(nextFrames.length >= FETCH_ALL_BATCH_SIZE);
  setHasMorePrev(prevFrames.length >= FETCH_ALL_BATCH_SIZE);

} catch (error) {
  console.error('Error in initial frame load:', error);
  setCarouselFrames([currentFrame]);
  setHasMoreNext(false);
  setHasMorePrev(false);
} finally {
  setIsLoading(false);
}
}, [fetchFramesBatch, deduplicateFrames, sortFramesByTimestamp, preloadImages]);

  const handleCarouselClose = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Clear cache on close to prevent memory leaks
    framesCacheRef.current.clear();
    
    setCarouselFrames(null);
    setActiveFrameId(null);
    setCurrentVideoId(null);
    setHasMoreNext(true);
    setHasMorePrev(true);
    setIsFetchingNext(false);
    setIsFetchingPrev(false);
  }, []);

  const handleFrameChange = useCallback((newId: string | number) => {
    setActiveFrameId(newId);
  }, []);

  const loadNextFrames = useCallback(async () => {
    if (
      isFetchingNext || 
      !hasMoreNext || 
      !currentVideoId || 
      !carouselFrames || 
      carouselFrames.length === 0 ||
      isLoading
    ) {
      return;
    }

    setIsFetchingNext(true);
    
    try {
      const lastFrame = carouselFrames[carouselFrames.length - 1];
      const nextFrames = await fetchFramesBatch(
        currentVideoId, 
        parseInt(lastFrame.timestamp, 10), 
        'next'
      );

      if (nextFrames.length > 0) {
        // Start preloading new images immediately
        preloadImages(nextFrames);
        
        setCarouselFrames(currentFrames => {
          if (!currentFrames) return currentFrames;
          
          // Optimized deduplication
          const existingIds = new Set(currentFrames.map(f => f.id));
          const newFrames = nextFrames.filter(f => !existingIds.has(f.id));
          
          return [...currentFrames, ...newFrames];
        });
      }
      
      setHasMoreNext(nextFrames.length >= FETCH_ALL_BATCH_SIZE);
      
    } catch (error) {
      console.error('Error loading next frames:', error);
      setHasMoreNext(false);
    } finally {
      setIsFetchingNext(false);
    }
  }, [isFetchingNext, hasMoreNext, currentVideoId, carouselFrames, isLoading, fetchFramesBatch, preloadImages]);

  const loadPreviousFrames = useCallback(async () => {
    if (
      isFetchingPrev || 
      !hasMorePrev || 
      !currentVideoId || 
      !carouselFrames || 
      carouselFrames.length === 0 ||
      isLoading
    ) {
      return;
    }

    setIsFetchingPrev(true);
    
    try {
      const firstFrame = carouselFrames[0];
      const prevFrames = await fetchFramesBatch(
        currentVideoId, 
        parseInt(firstFrame.timestamp, 10), 
        'prev'
      );

      if (prevFrames.length > 0) {
        // Start preloading new images immediately
        preloadImages(prevFrames);
        
        setCarouselFrames(currentFrames => {
          if (!currentFrames) return currentFrames;
          
          // Optimized deduplication
          const existingIds = new Set(currentFrames.map(f => f.id));
          const newFrames = prevFrames.filter(f => !existingIds.has(f.id));
          
          return [...newFrames, ...currentFrames];
        });
      }
      
      setHasMorePrev(prevFrames.length >= FETCH_ALL_BATCH_SIZE);
      
    } catch (error) {
      console.error('Error loading previous frames:', error);
      setHasMorePrev(false);
    } finally {
      setIsFetchingPrev(false);
    }
  }, [isFetchingPrev, hasMorePrev, currentVideoId, carouselFrames, isLoading, fetchFramesBatch, preloadImages]);

  return {
    carouselFrames,
    activeFrameId,
    currentVideoId,
    isLoading,
    isFetchingNext,
    isFetchingPrev,
    hasMoreNext,
    hasMorePrev,
    handleResultClick,
    handleCarouselClose,
    handleFrameChange,
    setActiveFrameId,
    loadNextFrames,
    loadPreviousFrames,
  };
};