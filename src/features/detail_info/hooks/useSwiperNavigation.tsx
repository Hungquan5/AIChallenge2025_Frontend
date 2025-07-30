// features/frame-carousel/hooks/useSwiperNavigation.ts
import { useRef, useCallback } from 'react';
import { Swiper as SwiperType } from 'swiper';
import type { FrameItem } from '../types';

interface Props {
  frames: FrameItem[];
  activeFrameId: string | number;
  onFrameChange?: (frameId: string | number) => void;
  onNext?: () => Promise<void>;
  onPrev?: () => Promise<void>;
}

const useSwiperNavigation = ({
  frames,
  activeFrameId,
  onFrameChange,
  onNext,
  onPrev,
}: Props) => {
  const swiperRef = useRef<SwiperType>();

  const onSlideChange = useCallback(() => {
    const swiper = swiperRef.current;
    if (!swiper) return;

    const current = frames[swiper.activeIndex];
    if (current) {
      onFrameChange?.(current.timestamp);
    }
  }, [frames, onFrameChange]);

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        await onNext?.();
      } else if (e.key === 'ArrowLeft') {
        await onPrev?.();
      }
    },
    [onNext, onPrev]
  );

  return {
    swiperRef,
    onSlideChange,
    handleKeyDown,
  };
};

export default useSwiperNavigation;
