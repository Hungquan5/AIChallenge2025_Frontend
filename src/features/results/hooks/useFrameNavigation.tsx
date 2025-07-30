// src/features/results/hooks/useFrameNavigation.ts
import { useCallback } from 'react';
import type { FrameItem } from './useKeyframeLoader';

export const useFrameNavigation = ({
  currentVideoId,
  activeFrameId,
  carouselFrames,
  setActiveFrameId,
  loadMoreFrames,
  hasMoreNext,
  hasMorePrev,
  isLoadingBatch,
}: {
  currentVideoId: string | null;
  activeFrameId: string | number | null;
  carouselFrames: FrameItem[] | null;
  setActiveFrameId: (id: string | number) => void;
  loadMoreFrames: (direction: 'next' | 'prev') => void;
  hasMoreNext: boolean;
  hasMorePrev: boolean;
  isLoadingBatch: boolean;
}) => {
  const navigateToNextFrame = useCallback(async () => {
    if (!currentVideoId || activeFrameId === null || !carouselFrames) return;
    const currentFrameIndex = +activeFrameId;
    const currentIndex = carouselFrames.findIndex(f => +f.timestamp === currentFrameIndex);

    if (currentIndex < carouselFrames.length - 1) {
      const nextFrame = carouselFrames[currentIndex + 1];
      setActiveFrameId(+nextFrame.timestamp);

      if (currentIndex >= carouselFrames.length - 3 && hasMoreNext && !isLoadingBatch) {
        loadMoreFrames('next');
      }
    } else if (hasMoreNext && !isLoadingBatch) {
      await loadMoreFrames('next');
      const updatedIndex = carouselFrames.findIndex(f => +f.timestamp === currentFrameIndex);
      if (updatedIndex >= 0 && updatedIndex < carouselFrames.length - 1) {
        setActiveFrameId(+carouselFrames[updatedIndex + 1].timestamp);
      }
    }
  }, [activeFrameId, carouselFrames, currentVideoId, hasMoreNext, isLoadingBatch, loadMoreFrames, setActiveFrameId]);

  const navigateToPrevFrame = useCallback(async () => {
    if (!currentVideoId || activeFrameId === null || !carouselFrames) return;
    const currentFrameIndex = +activeFrameId;
    const currentIndex = carouselFrames.findIndex(f => +f.timestamp === currentFrameIndex);

    if (currentIndex > 0) {
      const prevFrame = carouselFrames[currentIndex - 1];
      setActiveFrameId(+prevFrame.timestamp);

      if (currentIndex <= 3 && hasMorePrev && !isLoadingBatch) {
        loadMoreFrames('prev');
      }
    } else if (hasMorePrev && !isLoadingBatch) {
      await loadMoreFrames('prev');
      const updatedIndex = carouselFrames.findIndex(f => +f.timestamp === currentFrameIndex);
      if (updatedIndex > 0) {
        setActiveFrameId(+carouselFrames[updatedIndex - 1].timestamp);
      }
    }
  }, [activeFrameId, carouselFrames, currentVideoId, hasMorePrev, isLoadingBatch, loadMoreFrames, setActiveFrameId]);

  return {
    navigateToNextFrame,
    navigateToPrevFrame,
  };
};
