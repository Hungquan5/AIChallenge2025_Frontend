import { useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
const LOCAL_DATASET_URL = 'http://localhost:1406';

export interface FrameItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  confidence: number;
  timestamp: string;
}

interface FrameCarouselProps {
  frames: FrameItem[];
  activeFrameId: string | number;
  onClose?: () => void;
  onNext?: () => Promise<void>;
  onPrev?: () => Promise<void>;
  isLoading?: boolean;
}

export default function FrameCarousel({ 
  frames, 
  activeFrameId, 
  onClose, 
  onNext, 
  onPrev, 
  isLoading = false 
}: FrameCarouselProps) {
  const initialIndex = frames.findIndex(f => String(f.timestamp) === String(activeFrameId));
  const swiperRef = useRef<any>(null);

  useEffect(() => {
    if (swiperRef.current && initialIndex >= 0) {
      swiperRef.current.slideTo(initialIndex, 0);
    }
  }, [initialIndex]);

  // Handle slide change events
  const handleSlideChange = async (swiper: any) => {
    const currentIndex = swiper.activeIndex;
    const totalSlides = frames.length;
    
    // If we're at the last slide and moving forward, fetch next frame
    if (currentIndex === totalSlides - 1 && onNext && !isLoading) {
      await onNext();
    }
    // If we're at the first slide and moving backward, fetch previous frame
    else if (currentIndex === 0 && onPrev && !isLoading) {
      await onPrev();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && onPrev && !isLoading) {
      e.preventDefault();
      onPrev();
    } else if (e.key === 'ArrowRight' && onNext && !isLoading) {
      e.preventDefault();
      onNext();
    } else if (e.key === 'Escape' && onClose) {
      e.preventDefault();
      onClose();
    }
  };

  // Handle manual navigation buttons
  const handlePrevClick = async () => {
    if (onPrev && !isLoading) {
      await onPrev();
    }
  };

  const handleNextClick = async () => {
    if (onNext && !isLoading) {
      await onNext();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        background: 'rgba(0,0,0,0.7)', 
        zIndex: 1000, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div style={{ 
        background: '#fff', 
        borderRadius: 12, 
        padding: 24, 
        minWidth: 500, 
        maxWidth: 800,
        position: 'relative'
      }}>
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute',
            top: 10,
            right: 15,
            fontSize: 24, 
            border: 'none', 
            background: 'none', 
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          ×
        </button>

        {/* Loading indicator */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255,255,255,0.9)',
            padding: '10px 20px',
            borderRadius: 8,
            zIndex: 20
          }}>
            Loading...
          </div>
        )}

        {/* Navigation buttons */}
        <button
          onClick={handlePrevClick}
          disabled={isLoading}
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.5)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: 40,
            height: 40,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: 18,
            zIndex: 10,
            opacity: isLoading ? 0.5 : 1
          }}
        >
          ‹
        </button>

        <button
          onClick={handleNextClick}
          disabled={isLoading}
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.5)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: 40,
            height: 40,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: 18,
            zIndex: 10,
            opacity: isLoading ? 0.5 : 1
          }}
        >
          ›
        </button>

        <Swiper
          onSwiper={swiper => (swiperRef.current = swiper)}
          onSlideChange={handleSlideChange}
          initialSlide={initialIndex}
          slidesPerView={3}
          centeredSlides
          spaceBetween={10}
          style={{ 
            width: 600, 
            height: 200,
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {frames.map((frame, idx) => (
            <SwiperSlide key={frame.id}>
              <div style={{ position: 'relative' }}>
                <img
                  src={LOCAL_DATASET_URL+"/dataset/full_batch1/"+frame.videoId+"/keyframes/"+frame.thumbnail}
                  alt={frame.title}
                  style={{
                    border: String(frame.timestamp) === String(activeFrameId) 
                      ? '3px solid #1976d2' 
                      : '1px solid #ccc',
                    borderRadius: 8,
                    width: 180,
                    height: 120,
                    objectFit: 'cover',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    // Optional: Allow clicking on frames to navigate to them
                    if (swiperRef.current) {
                      swiperRef.current.slideTo(idx);
                    }
                  }}
                />
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: 4,
                  fontSize: 12,
                  color: String(frame.timestamp) === String(activeFrameId) 
                    ? '#1976d2' 
                    : '#666'
                }}>
                  Frame {frame.timestamp}
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Instructions */}
        <div style={{
          textAlign: 'center',
          marginTop: 10,
          fontSize: 12,
          color: '#666'
        }}>
          Use arrow keys or click buttons to navigate • ESC to close
        </div>
      </div>
    </div>
  );
}