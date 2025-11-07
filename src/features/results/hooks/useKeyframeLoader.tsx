import { useState, useCallback, useRef } from 'react';
import type { ResultItem } from '../types';

// The structure of the objects inside our new JSON files
interface Keyframe {
  frame_index: number;
  filename: string;
}

// A new interface for the `createFrameItem` function to add video_id
interface KeyframeWithVideoId extends Keyframe {
  video_id: string;
}

const FETCH_ALL_BATCH_SIZE = 10;
// The base URL of your Python http.server
const API_BASE_URL = 'http://localhost:1406';

export const useKeyframeLoader = () => {
  const [carouselFrames, setCarouselFrames] = useState<ResultItem[] | null>(null);
  const [activeFrameId, setActiveFrameId] = useState<string | number | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [isFetchingPrev, setIsFetchingPrev] = useState(false);

  const [hasMoreNext, setHasMoreNext] = useState(true);
  const [hasMorePrev, setHasMorePrev] = useState(true);

  const videoFramesCacheRef = useRef<Map<string, Keyframe[]>>(new Map());
  const framesCacheRef = useRef<Map<string, ResultItem>>(new Map());

  const createFrameItem = useCallback((kf: KeyframeWithVideoId): ResultItem => {
    const frameId = `${kf.video_id}_${kf.frame_index}`;
    const cached = framesCacheRef.current.get(frameId);
    if (cached) return cached;

    const frameItem: ResultItem = {
      id: frameId,
      videoId: kf.video_id,
      title: `${kf.video_id}/${kf.frame_index}`,
      thumbnail: `${API_BASE_URL}/${kf.filename}`,
      confidence: 1.0,
      timestamp: kf.frame_index.toString(),
    };

    framesCacheRef.current.set(frameId, frameItem);
    return frameItem;
  }, []);

  const preloadImages = useCallback((frames: ResultItem[]) => {
    frames.forEach(frame => {
      const img = new Image();
      img.src = frame.thumbnail;
    });
  }, []);

  const handleResultClick = useCallback(async (item: ResultItem) => {
    setIsLoading(true);
    setCurrentVideoId(item.videoId);
    setActiveFrameId(item.timestamp);
    setCarouselFrames(null);

    try {
      let allVideoFrames = videoFramesCacheRef.current.get(item.videoId);

      if (!allVideoFrames) {
        const response = await fetch(`${API_BASE_URL}/keyframe_json_db/${item.videoId}.json`);
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: Could not load keyframe data.`);
        }
        allVideoFrames = await response.json();
        if (!allVideoFrames) {
        throw new Error(`Keyframe data for video ${item.videoId} could not be loaded.`);
      }
        videoFramesCacheRef.current.set(item.videoId, allVideoFrames);
      }

      // ✅ FIX: Add a guard clause here.
      // If allVideoFrames is still not an array after the fetch attempt,
      // something went wrong, and we must exit to the catch block.
      if (!allVideoFrames) {
        throw new Error(`Keyframe data for video ${item.videoId} could not be loaded.`);
      }

      const clickedFrameIndexInArray = allVideoFrames.findIndex(
        kf => kf.frame_index === parseInt(item.timestamp, 10)
      );

      if (clickedFrameIndexInArray === -1) {
        console.error("Clicked frame not found in the video's keyframe list.");
        const currentFrame = createFrameItem({
          video_id: item.videoId,
          frame_index: parseInt(item.timestamp, 10),
          filename: item.thumbnail.replace(`${API_BASE_URL}/`, '')
        });
        setCarouselFrames([currentFrame]);
        setHasMoreNext(false);
        setHasMorePrev(false);
        return;
      }

      const startIndex = Math.max(0, clickedFrameIndexInArray - FETCH_ALL_BATCH_SIZE);
      const endIndex = Math.min(allVideoFrames.length, clickedFrameIndexInArray + FETCH_ALL_BATCH_SIZE + 1);

      const initialBatch = allVideoFrames.slice(startIndex, endIndex);
      const initialFrames = initialBatch.map(kf => createFrameItem({ ...kf, video_id: item.videoId }));

      setCarouselFrames(initialFrames);
      preloadImages(initialFrames);

      setHasMorePrev(startIndex > 0);
      setHasMoreNext(endIndex < allVideoFrames.length);

    } catch (error) {
      console.error('Error in initial frame load:', error);
      const currentFrame = createFrameItem({
        video_id: item.videoId,
        frame_index: parseInt(item.timestamp, 10),
        filename: item.thumbnail.replace(`${API_BASE_URL}/`, '')
      });
      setCarouselFrames([currentFrame]); // Show a fallback frame
      setHasMoreNext(false);
      setHasMorePrev(false);
    } finally {
      setIsLoading(false);
    }
  }, [createFrameItem, preloadImages]);

  const handleCarouselClose = useCallback(() => {
    videoFramesCacheRef.current.clear();
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

  const loadNextFrames = useCallback(() => {
    if (!currentVideoId || !carouselFrames || carouselFrames.length === 0 || !hasMoreNext) return;

    // This function already has the correct guard clause.
    const allVideoFrames = videoFramesCacheRef.current.get(currentVideoId);
    if (!allVideoFrames) return;

    setIsFetchingNext(true);

    const lastFrameTimestamp = parseInt(carouselFrames[carouselFrames.length - 1].timestamp, 10);
    const lastFrameIndexInArray = allVideoFrames.findIndex(kf => kf.frame_index === lastFrameTimestamp);

    const startIndex = lastFrameIndexInArray + 1;
    const endIndex = Math.min(allVideoFrames.length, startIndex + FETCH_ALL_BATCH_SIZE);

    if (startIndex >= allVideoFrames.length) {
      setHasMoreNext(false);
      setIsFetchingNext(false);
      return;
    }

    const nextBatch = allVideoFrames.slice(startIndex, endIndex);
    const nextFrames = nextBatch.map(kf => createFrameItem({ ...kf, video_id: currentVideoId }));

    preloadImages(nextFrames);
    setCarouselFrames(current => [...(current || []), ...nextFrames]);
    setHasMoreNext(endIndex < allVideoFrames.length);
    setIsFetchingNext(false);

  }, [currentVideoId, carouselFrames, hasMoreNext, createFrameItem, preloadImages]);

  const loadPreviousFrames = useCallback(() => {
    if (!currentVideoId || !carouselFrames || carouselFrames.length === 0 || !hasMorePrev) return;
    
    // This function also has the correct guard clause.
    const allVideoFrames = videoFramesCacheRef.current.get(currentVideoId);
    if (!allVideoFrames) return;

    setIsFetchingPrev(true);

    const firstFrameTimestamp = parseInt(carouselFrames[0].timestamp, 10);
    const firstFrameIndexInArray = allVideoFrames.findIndex(kf => kf.frame_index === firstFrameTimestamp);

    const endIndex = firstFrameIndexInArray;
    const startIndex = Math.max(0, endIndex - FETCH_ALL_BATCH_SIZE);

    if (endIndex <= 0) {
      setHasMorePrev(false);
      setIsFetchingPrev(false);
      return;
    }

    const prevBatch = allVideoFrames.slice(startIndex, endIndex);
    const prevFrames = prevBatch.map(kf => createFrameItem({ ...kf, video_id: currentVideoId }));

    preloadImages(prevFrames);
    setCarouselFrames(current => [...prevFrames, ...(current || [])]);
    setHasMorePrev(startIndex > 0);
    setIsFetchingPrev(false);

  }, [currentVideoId, carouselFrames, hasMorePrev, createFrameItem, preloadImages]);

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