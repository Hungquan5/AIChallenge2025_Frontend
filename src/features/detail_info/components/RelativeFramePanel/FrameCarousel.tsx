// features/frame-carousel/components/FrameCarousel.tsx
import React, { useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper';
import { Navigation, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

import type { ResultItem } from '../../../search/types';
import FrameItemSlide from './FrameItemSlide';
import useSwiperNavigation from '../../hooks/useSwiperNavigation';
import * as styles from './styles';

export const getImageUrl = (videoId: string, thumbnail: string) =>
  `http://localhost:1406/dataset/full_batch1/${videoId}/keyframes/${thumbnail}`;

interface FrameCarouselProps {
  frames: ResultItem[];
  activeFrameId: string | number;
  onClose?: () => void;
  onNext?: () => Promise<void>;
  onPrev?: () => Promise<void>;
  onFrameChange?: (frameId: string | number) => void;
  isLoading?: boolean;
  onResultClick: (item: ResultItem) => void;
  onSimilaritySearch: (imageSrc: string, cardId: string) => void;
  onRightClick?: (item: ResultItem) => void; // Ensure this prop is define
  currentUser: string; 
  sendMessage: (message: string) => void; // WebSocket send function
}

const FrameCarousel: React.FC<FrameCarouselProps> = ({
  frames,
  activeFrameId,
  onClose,
  onNext,
  onPrev,
  onFrameChange,
  onRightClick,
  isLoading,
  onResultClick,

  onSimilaritySearch,
  // ✅ Destructure the new props
  sendMessage,
  currentUser
}) => {
  const { swiperRef, onSlideChange, handleKeyDown } = useSwiperNavigation({
    frames,
    activeFrameId,
    onFrameChange,
    onNext,
    onPrev,
  });
  
  // Effect to handle reaching the beginning or end for infinite loading
  useEffect(() => {
    const swiperInstance = swiperRef.current;
    if (swiperInstance) {
      // Handler for reaching the end
      const handleReachEnd = () => {
        console.log('[Carousel] Reached END, calling onNext.');
        onNext?.();
      };

      // Handler for reaching the beginning
      const handleReachBeginning = () => {
        console.log('[Carousel] Reached BEGINNING, calling onPrev.');
        onPrev?.();
      };

      swiperInstance.on('reachEnd', handleReachEnd);
      swiperInstance.on('reachBeginning', handleReachBeginning);

      // Cleanup function to remove BOTH listeners
      return () => {
        if (swiperInstance && !swiperInstance.destroyed) {
            swiperInstance.off('reachEnd', handleReachEnd);
            swiperInstance.off('reachBeginning', handleReachBeginning);
        }
      };
    }
  }, [onNext, onPrev, swiperRef]);

  useEffect(() => {
    const swiper = swiperRef.current;
    // When frames are prepended, find the new index of the active slide
    const newIndex = frames.findIndex(f => f.timestamp === activeFrameId.toString());
    
    // If the swiper instance exists and the active slide is found in the new array
    if (swiper && newIndex !== -1) {
      // Teleport to that slide without an animation. This prevents the "jump".
      swiper.slideTo(newIndex, 0); 
    }
  }, [frames, activeFrameId, swiperRef]);

  const initialSlideIndex = frames.findIndex(f => f.timestamp === activeFrameId.toString());

  return (
    // Compact container with reduced height
    <div
      className="absolute inset-x-0 bottom-0 h-[20vh] bg-slate-900/80 backdrop-blur-lg border-t border-white/10 shadow-xl"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <button onClick={onClose} className={styles.closeButtonClass}>
        ✕
      </button>

      {/* Loading overlay */}
      {isLoading && (
        <div className={styles.loadingOverlayClass}>
          <div className={styles.loadingSpinnerClass}></div>
        </div>
      )}

      <Swiper
        onSwiper={(swiper) => { (swiperRef as React.MutableRefObject<SwiperType | undefined>).current = swiper; }}
        modules={[Navigation, Keyboard]}
        navigation
        keyboard={{ enabled: true }}
        initialSlide={initialSlideIndex}
        onSlideChange={onSlideChange}
        className="w-full h-full"
        wrapperClass={styles.swiperWrapperClass}
        slidesPerView={'auto'}
        spaceBetween={12}
        centeredSlides={true}
      >
        {frames.map((frame) => {
          // Determine if this specific slide is the active one
          const isActive = frame.timestamp === activeFrameId.toString();

          return (
            <SwiperSlide key={frame.timestamp} className="!w-auto">
              {/* Pass the isActive prop down to the slide component */}
             <FrameItemSlide
                frame={frame}
                isActive={isActive}
                // Pass the handler down to the slide
                onSimilaritySearch={onSimilaritySearch}
                onRightClick= {onRightClick}
                onClick={onResultClick}
                currentUser={currentUser} 
                sendMessage={sendMessage}             
              />
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
};

export default FrameCarousel;