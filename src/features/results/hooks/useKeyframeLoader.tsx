import { useState, useCallback, useRef } from 'react';
import type { ResultItem } from '../types';

// Backend Keyframe structure
interface Keyframe {
  video_id: string;
  frame_index: number;
  filename: string;
}

// Reduced batch size for better UX - smaller chunks load faster
const FETCH_ALL_BATCH_SIZE = 15;

export const useKeyframeLoader = () => {
  const [carouselFrames, setCarouselFrames] = useState<ResultItem[] | null>(null);
  const [activeFrameId, setActiveFrameId] = useState<string | number | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Split loading states for better UX feedback
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [isFetchingPrev, setIsFetchingPrev] = useState(false);
  
  // Track if more frames exist
  const [hasMoreNext, setHasMoreNext] = useState(true);
  const [hasMorePrev, setHasMorePrev] = useState(true);
  
  // Debounce mechanism to prevent rapid API calls
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const lastRequestTimeRef = useRef<{ [key: string]: number }>({});

  const createFrameItem = useCallback((kf: Keyframe): ResultItem => ({
    id: `${kf.video_id}_${kf.frame_index}`,
    videoId: kf.video_id,
    title: `${kf.video_id}/${kf.frame_index}`,
    thumbnail: kf.filename,
    confidence: 1.0,
    timestamp: kf.frame_index.toString(),
  }), []);

  const fetchFramesBatch = useCallback(async (
    videoId: string,
    startIndex: number,
    direction: 'next' | 'prev'
  ): Promise<ResultItem[]> => {
    // Debounce mechanism - prevent calls within 500ms of each other for same direction
    const requestKey = `${videoId}-${direction}`;
    const now = Date.now();
    const lastRequest = lastRequestTimeRef.current[requestKey] || 0;
    
    if (now - lastRequest < 500) {
      console.log(`Debouncing ${direction} request for ${videoId}`);
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
          console.log(`No more ${direction} frames for ${videoId}`);
          return [];
        }
        throw new Error(`HTTP error ${response.status}`);
      }

      const keyframes: Keyframe[] = await response.json();
      console.log(`Fetched ${keyframes.length} ${direction} frames for ${videoId}`);
      return keyframes.map(createFrameItem);
    } catch (err) {
      console.error(`Error loading ${direction} batch for video ${videoId}:`, err);
      return [];
    }
  }, [createFrameItem]);

  /**
   * Initial load when clicking a result item
   */
  const handleResultClick = useCallback(async (item: ResultItem) => {
    setIsLoading(true);
    setCurrentVideoId(item.videoId);
    setActiveFrameId(item.timestamp);
    setCarouselFrames([]); // Clear previous results
    
    // Reset pagination state
    setHasMoreNext(true);
    setHasMorePrev(true);
    setIsFetchingNext(false);
    setIsFetchingPrev(false);

    const clickedFrameIndex = parseInt(item.timestamp, 10);
    const currentFrame: ResultItem = { ...item, id: `${item.videoId}_${clickedFrameIndex}` };

    try {
      // Load initial batches in parallel
      const [prevFrames, nextFrames] = await Promise.all([
        fetchFramesBatch(item.videoId, clickedFrameIndex, 'prev'),
        fetchFramesBatch(item.videoId, clickedFrameIndex, 'next')
      ]);

      // Combine and deduplicate frames
      const combinedFrames = [...prevFrames, currentFrame, ...nextFrames];
      const uniqueFrames = Array.from(
        new Map(combinedFrames.map(f => [f.id, f])).values()
      );

      // Sort by frame index
      uniqueFrames.sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));

      // Update state based on what we received
      setHasMoreNext(nextFrames.length >= FETCH_ALL_BATCH_SIZE);
      setHasMorePrev(prevFrames.length >= FETCH_ALL_BATCH_SIZE);

      setCarouselFrames(uniqueFrames);
    } catch (error) {
      console.error('Error in initial frame load:', error);
      setCarouselFrames([currentFrame]); // At least show the clicked frame
      setHasMoreNext(false);
      setHasMorePrev(false);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFramesBatch]);

  const handleCarouselClose = useCallback(() => {
    // Clear debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
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
    // Comprehensive guard clauses
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
        setCarouselFrames(currentFrames => {
          if (!currentFrames) return currentFrames;
          
          // Deduplicate based on frame ID
          const existingIds = new Set(currentFrames.map(f => f.id));
          const newFrames = nextFrames.filter(f => !existingIds.has(f.id));
          
          return [...currentFrames, ...newFrames];
        });
      }
      
      // Update hasMoreNext based on batch size
      setHasMoreNext(nextFrames.length >= FETCH_ALL_BATCH_SIZE);
      
    } catch (error) {
      console.error('Error loading next frames:', error);
      setHasMoreNext(false);
    } finally {
      setIsFetchingNext(false);
    }
  }, [isFetchingNext, hasMoreNext, currentVideoId, carouselFrames, isLoading, fetchFramesBatch]);

  const loadPreviousFrames = useCallback(async () => {
    // Comprehensive guard clauses
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
        setCarouselFrames(currentFrames => {
          if (!currentFrames) return currentFrames;
          
          // Deduplicate based on frame ID
          const existingIds = new Set(currentFrames.map(f => f.id));
          const newFrames = prevFrames.filter(f => !existingIds.has(f.id));
          
          return [...newFrames, ...currentFrames];
        });
      }
      
      // Update hasMorePrev based on batch size
      setHasMorePrev(prevFrames.length >= FETCH_ALL_BATCH_SIZE);
      
    } catch (error) {
      console.error('Error loading previous frames:', error);
      setHasMorePrev(false);
    } finally {
      setIsFetchingPrev(false);
    }
  }, [isFetchingPrev, hasMorePrev, currentVideoId, carouselFrames, isLoading, fetchFramesBatch]);

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