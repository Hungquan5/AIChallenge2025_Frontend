import { useState, useCallback } from 'react';
import type { ResultItem } from '../types';

// Backend Keyframe structure
interface Keyframe {
  video_id: string;
  frame_index: number;
  filename: string;
}

// A very large number to act as "infinity" for fetching all frames.
// This is the main assumption: no video will have more than 10,000 keyframes
// in one direction from the clicked point. Adjust if necessary.
const FETCH_ALL_BATCH_SIZE = 10;

export const useKeyframeLoader = () => {
  const [carouselFrames, setCarouselFrames] = useState<ResultItem[] | null>(null);
  const [activeFrameId, setActiveFrameId] = useState<string | number | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const createFrameItem = useCallback((kf: Keyframe): ResultItem => ({
    id: `${kf.video_id}_${kf.frame_index}`,
    videoId: kf.video_id,
    title: `${kf.video_id}/${kf.frame_index}`,
    thumbnail: kf.filename,
    confidence: 1.0,
    timestamp: kf.frame_index.toString(),
  }), []);

  // This function is now reused to fetch a large batch of frames.
  const fetchFramesBatch = useCallback(async (
    videoId: string,
    startIndex: number,
    direction: 'next' | 'prev'
  ): Promise<ResultItem[]> => {
    try {
      const endpoint = direction === 'next'
        ? `http://localhost:9991/keyframes/batch-next`
        : `http://localhost:9991/keyframes/batch-prev`;
      // We use our large batch size here to get all frames in one go.
      const response = await fetch(`${endpoint}?video_id=${videoId}&frame_index=${startIndex}&batch_size=${FETCH_ALL_BATCH_SIZE}`);
      if (!response.ok) {
        // A 404 is not a critical error; it just means there are no more frames.
        if (response.status === 404) return [];
        throw new Error(`HTTP error ${response.status}`);
      }

      const keyframes: Keyframe[] = await response.json();
      return keyframes.map(createFrameItem);
    } catch (err) {
      console.error(`Error loading ${direction} batch for video ${videoId}:`, err);
      return []; // Return empty on error
    }
  }, [createFrameItem]);

  /**
   * This function now triggers two parallel API calls to get all frames
   * surrounding the clicked item.
   */
  const handleResultClick = useCallback(async (item: ResultItem) => {
    setIsLoading(true);
    setCurrentVideoId(item.videoId);
    setActiveFrameId(item.timestamp);
    setCarouselFrames([]); // Clear previous results

    const clickedFrameIndex = parseInt(item.timestamp, 10);
    // The original frame that was clicked. We'll add this to ensure it's included.
    const currentFrame: ResultItem = { ...item, id: `${item.videoId}_${clickedFrameIndex}` };

    // Use Promise.all to run both fetches at the same time for better performance.
    const [prevFrames, nextFrames] = await Promise.all([
      fetchFramesBatch(item.videoId, clickedFrameIndex, 'prev'),
      fetchFramesBatch(item.videoId, clickedFrameIndex, 'next')
    ]);

    // 1. Combine all the frames: previous, the clicked one, and next.
    const combinedFrames = [...prevFrames, currentFrame, ...nextFrames];
    // 2. Remove duplicates. The clicked frame might be returned by the API calls.
    // Using a Map is an efficient way to ensure uniqueness based on the 'id'.
    const uniqueFrames = Array.from(new Map(combinedFrames.map(f => [f.id, f])).values());

    // 3. Sort the final array by frame index (timestamp) to ensure correct order.
    uniqueFrames.sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));

    setCarouselFrames(uniqueFrames);
    setIsLoading(false);
  }, [fetchFramesBatch]);

  // Simplified close handler
  const handleCarouselClose = useCallback(() => {
    setCarouselFrames(null);
    setActiveFrameId(null);
    setCurrentVideoId(null);
  }, []);

  const handleFrameChange = useCallback((newId: string | number) => {
    setActiveFrameId(newId);
  }, []);

  const loadNextFrames = useCallback(async () => {
    if (isLoading || !currentVideoId || !carouselFrames || carouselFrames.length === 0) return;

    setIsLoading(true);
    const lastFrame = carouselFrames[carouselFrames.length - 1];
    const nextFrames = await fetchFramesBatch(currentVideoId, parseInt(lastFrame.timestamp, 10), 'next');

    if (nextFrames.length > 0) {
      // Append the new frames to the end of the existing list
      setCarouselFrames(currentFrames => [...(currentFrames || []), ...nextFrames]);
    }
    setIsLoading(false);
  }, [isLoading, currentVideoId, carouselFrames, fetchFramesBatch]);

  const loadPreviousFrames = useCallback(async () => {
    if (isLoading || !currentVideoId || !carouselFrames || carouselFrames.length === 0) return;

    setIsLoading(true);
    const firstFrame = carouselFrames[0];
    const prevFrames = await fetchFramesBatch(currentVideoId, parseInt(firstFrame.timestamp, 10), 'prev');

    if (prevFrames.length > 0) {
      // ✅ FIX: Prepend the new frames to the beginning of the existing list
      setCarouselFrames(currentFrames => [...prevFrames, ...(currentFrames || [])]);
    }
    setIsLoading(false);
  }, [isLoading, currentVideoId, carouselFrames, fetchFramesBatch]);

  return {
    carouselFrames,
    activeFrameId,
    currentVideoId,
    isLoading,
    handleResultClick,
    handleCarouselClose,
    handleFrameChange,
    setActiveFrameId,
    loadNextFrames,
    loadPreviousFrames,
  };
};