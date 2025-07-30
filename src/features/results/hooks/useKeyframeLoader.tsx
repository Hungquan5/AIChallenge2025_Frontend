// src/features/results/hooks/useKeyframeLoader.ts
import { useState, useCallback } from 'react';
import type { ResultItem } from '../types';
interface Keyframe {
  video_id: string;
  frame_index: number;
  filename: string;
}

export interface FrameItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  confidence: number;
  timestamp: string;
}

const BATCH_SIZE = 10;

export const useKeyframeLoader = () => {
  const [carouselFrames, setCarouselFrames] = useState<FrameItem[] | null>(null);
  const [activeFrameId, setActiveFrameId] = useState<string | number | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBatch, setIsLoadingBatch] = useState(false);
  const [frameCache, setFrameCache] = useState<Map<string, FrameItem>>(new Map());
  const [hasMoreNext, setHasMoreNext] = useState(true);
  const [hasMorePrev, setHasMorePrev] = useState(true);
  const [minFrameIndex, setMinFrameIndex] = useState<number | null>(null);
  const [maxFrameIndex, setMaxFrameIndex] = useState<number | null>(null);

  const createFrameItem = useCallback((kf: Keyframe): FrameItem => ({
    id: `${kf.video_id}_${kf.frame_index}`,
    videoId: kf.video_id,
    title: `Frame ${kf.frame_index}`,
    thumbnail: kf.filename,
    confidence: 1.0,
    timestamp: kf.frame_index.toString(),
  }), []);

  const fetchFramesBatch = useCallback(async (
    videoId: string,
    startIndex: number,
    direction: 'next' | 'prev',
    batchSize = BATCH_SIZE
  ): Promise<FrameItem[]> => {
    try {
      setIsLoadingBatch(true);
      const endpoint = direction === 'next'
        ? `http://localhost:9991/keyframes/batch-next`
        : `http://localhost:9991/keyframes/batch-prev`;
      const response = await fetch(`${endpoint}?video_id=${videoId}&frame_index=${startIndex}&batch_size=${batchSize}`);
      if (!response.ok) {
        if (response.status === 404) {
          direction === 'next' ? setHasMoreNext(false) : setHasMorePrev(false);
          return [];
        }
        throw new Error(`HTTP error ${response.status}`);
      }
      const keyframes: Keyframe[] = await response.json();
      const frameItems = keyframes.map(createFrameItem);
      frameItems.forEach(f => setFrameCache(prev => new Map(prev).set(f.id, f)));

      const indices = frameItems.map(f => parseInt(f.timestamp));
      if (indices.length > 0) {
        setMinFrameIndex(prev => prev === null ? Math.min(...indices) : Math.min(prev, ...indices));
        setMaxFrameIndex(prev => prev === null ? Math.max(...indices) : Math.max(prev, ...indices));
      }

      if (keyframes.length < batchSize) direction === 'next' ? setHasMoreNext(false) : setHasMorePrev(false);
      return frameItems;
    } catch (err) {
      console.error(`Error loading ${direction} batch`, err);
      return [];
    } finally {
      setIsLoadingBatch(false);
    }
  }, [createFrameItem]);

  const handleResultClick = useCallback(async (item: ResultItem) => {
    setIsLoading(true);
    const idx = typeof item.timestamp === 'number' ? item.timestamp : parseInt(item.timestamp, 10);
    
    // The frame that was actually clicked
    const currentFrame: FrameItem = {
      id: `${item.videoId}_${idx}`,
      videoId: item.videoId,
      title: `Frame ${idx}`,
      thumbnail: item.filename || `keyframe_${idx}.webp`,
      confidence: item.confidence || 1.0,
      timestamp: idx.toString()
    };
    // Reset state for the new video
    setCurrentVideoId(item.videoId);
    setHasMoreNext(true);
    setHasMorePrev(true);
    setMinFrameIndex(idx);
    setMaxFrameIndex(idx);
    setActiveFrameId(idx);
    setCarouselFrames([currentFrame]); // Set the initial frame immediately for responsiveness
    setFrameCache(new Map([[currentFrame.id, currentFrame]]));

    const [next, prev] = await Promise.all([
      fetchFramesBatch(item.videoId, idx, 'next'),
      fetchFramesBatch(item.videoId, idx, 'prev')
    ]);

    const all = [...prev, currentFrame, ...next].filter((f, i, arr) =>
      arr.findIndex(x => x.id === f.id) === i
    ).sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));

    setCarouselFrames(all);
    setIsLoading(false);
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
    setFrameCache(new Map());
  }, []);

  const handleFrameChange = useCallback((newId: string | number) => setActiveFrameId(newId), []);

  const loadMoreFrames = useCallback(async (dir: 'next' | 'prev') => {
    if (!currentVideoId || !carouselFrames || isLoadingBatch) return;
    const hasMore = dir === 'next' ? hasMoreNext : hasMorePrev;
    if (!hasMore) return;

    const startIdx = dir === 'next' ? maxFrameIndex ?? 0 : minFrameIndex ?? 0;
    const newBatch = await fetchFramesBatch(currentVideoId, startIdx, dir);

    if (newBatch.length > 0) {
      setCarouselFrames(prev => {
        if (!prev) return newBatch;
        const existingIds = new Set(prev.map(f => f.id));
        const unique = newBatch.filter(f => !existingIds.has(f.id));
        return dir === 'next' ? [...prev, ...unique] : [...unique, ...prev];
      });
    }
  }, [carouselFrames, currentVideoId, fetchFramesBatch, hasMoreNext, hasMorePrev, isLoadingBatch, maxFrameIndex, minFrameIndex]);

  return {
    carouselFrames,
    activeFrameId,
    currentVideoId,
    isLoading,
    isLoadingBatch,
    frameCache,
    handleResultClick,
    handleCarouselClose,
    handleFrameChange,
    setCarouselFrames,
    setActiveFrameId,
    loadMoreFrames,
    hasMoreNext,
    hasMorePrev,
  };
};