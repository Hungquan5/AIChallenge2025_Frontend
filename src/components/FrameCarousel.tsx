import { useEffect, useRef, useState, useCallback } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard, Mousewheel } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

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
  onFrameChange?: (frameId: string | number) => void; // New callback for frame changes
  isLoading?: boolean;
}

export default function FrameCarousel({ 
  frames, 
  activeFrameId, 
  onClose, 
  onNext, 
  onPrev, 
  onFrameChange,
  isLoading = false 
}: FrameCarouselProps) {
  const swiperRef = useRef<any>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [localActiveFrameId, setLocalActiveFrameId] = useState(activeFrameId); // Track local active frame
  const [isNavigating, setIsNavigating] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Find initial index and ensure it's valid
  const initialIndex = Math.max(0, frames.findIndex(f => String(f.timestamp) === String(activeFrameId)));

  // Update local active frame when external activeFrameId changes
  useEffect(() => {
    setLocalActiveFrameId(activeFrameId);
  }, [activeFrameId]);

  // Update current slide index when frames or activeFrameId change
  useEffect(() => {
    const newIndex = frames.findIndex(f => String(f.timestamp) === String(localActiveFrameId));
    if (newIndex >= 0 && newIndex !== currentSlideIndex) {
      setCurrentSlideIndex(newIndex);
      if (swiperRef.current) {
        swiperRef.current.slideTo(newIndex, 300);
      }
    }
  }, [localActiveFrameId, frames]);

  // Focus container for keyboard navigation
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  // Handle image load errors
  const handleImageError = useCallback((frameId: string) => {
    setImageErrors(prev => new Set(prev).add(frameId));
  }, []);

  // Update active frame when slide changes
  const updateActiveFrame = useCallback((index: number) => {
    if (frames[index]) {
      const newFrameId = frames[index].timestamp;
      setLocalActiveFrameId(newFrameId);
      // Notify parent component of the frame change
      onFrameChange?.(newFrameId);
    }
  }, [frames, onFrameChange]);

  // Enhanced slide change handler
  const handleSlideChange = useCallback(async (swiper: any) => {
    if (isNavigating) return;
    
    const newIndex = swiper.activeIndex;
    setCurrentSlideIndex(newIndex);
    
    // Update active frame immediately
    updateActiveFrame(newIndex);
    
    const totalSlides = frames.length;
    
    // Check if we need to load more frames
    if (newIndex >= totalSlides - 2 && onNext && !isLoading) {
      setIsNavigating(true);
      try {
        await onNext();
      } finally {
        setTimeout(() => setIsNavigating(false), 500);
      }
    } else if (newIndex <= 1 && onPrev && !isLoading) {
      setIsNavigating(true);
      try {
        await onPrev();
      } finally {
        setTimeout(() => setIsNavigating(false), 500);
      }
    }
  }, [frames.length, onNext, onPrev, isLoading, isNavigating, updateActiveFrame]);

  // Enhanced keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isNavigating) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (swiperRef.current && currentSlideIndex > 0) {
          swiperRef.current.slidePrev();
        } else if (onPrev && !isLoading) {
          onPrev();
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (swiperRef.current && currentSlideIndex < frames.length - 1) {
          swiperRef.current.slideNext();
        } else if (onNext && !isLoading) {
          onNext();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose?.();
        break;
      case 'Home':
        e.preventDefault();
        if (swiperRef.current) {
          swiperRef.current.slideTo(0);
        }
        break;
      case 'End':
        e.preventDefault();
        if (swiperRef.current) {
          swiperRef.current.slideTo(frames.length - 1);
        }
        break;
    }
  }, [currentSlideIndex, frames.length, onNext, onPrev, onClose, isLoading, isNavigating]);

  // Handle backdrop click to close
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  }, [onClose]);

  // Handle frame click to navigate directly
  const handleFrameClick = useCallback((frameIndex: number) => {
    if (swiperRef.current && !isLoading && !isNavigating) {
      swiperRef.current.slideTo(frameIndex);
    }
  }, [isLoading, isNavigating]);

  // Get image URL with error handling
  const getImageUrl = (frame: FrameItem) => {
    return `${LOCAL_DATASET_URL}/dataset/full_batch1/${frame.videoId}/keyframes/${frame.thumbnail}`;
  };

  // Render frame image with error handling
  const renderFrameImage = (frame: FrameItem, isActive: boolean, frameIndex: number) => {
    const hasError = imageErrors.has(frame.id);
    
    const containerStyle = {
      position: 'relative' as const,
      cursor: 'pointer',
      transform: isActive ? 'scale(1.05)' : 'scale(1)',
      transition: 'transform 0.2s ease'
    };

    const imageStyle = {
      border: isActive ? '3px solid #1976d2' : '1px solid #ccc',
      borderRadius: 8,
      width: 180,
      height: 120,
      objectFit: 'cover' as const,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      opacity: isLoading && isActive ? 0.7 : 1
    };
    
    if (hasError) {
      return (
        <div style={containerStyle} onClick={() => handleFrameClick(frameIndex)}>
          <div
            style={{
              ...imageStyle,
              backgroundColor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: '#666'
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 4 }}>📷</div>
            <div style={{ fontSize: 12 }}>Image not available</div>
          </div>
        </div>
      );
    }

    return (
      <div style={containerStyle} onClick={() => handleFrameClick(frameIndex)}>
        <img
          src={getImageUrl(frame)}
          alt={frame.title}
          style={imageStyle}
          onError={() => handleImageError(frame.id)}
          loading="lazy"
        />
      </div>
    );
  };

  if (frames.length === 0) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        background: 'rgba(0,0,0,0.8)', 
        zIndex: 1000, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backdropFilter: 'blur(4px)'
      }}
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
      aria-label="Frame carousel"
    >
      <div style={{ 
        background: '#fff', 
        borderRadius: 16, 
        padding: 32, 
        minWidth: 600, 
        maxWidth: 900,
        maxHeight: '90vh',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: '1px solid #eee'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
              Frame Navigation
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#666' }}>
              Video: {frames[currentSlideIndex]?.videoId}
            </p>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: '#f5f5f5',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              cursor: 'pointer',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e0e0e0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f5f5f5';
            }}
            aria-label="Close carousel"
          >
            ×
          </button>
        </div>

        {/* Loading overlay */}
        {(isLoading || isNavigating) && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255,255,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            borderRadius: 16
          }}>
            <div style={{
              background: 'white',
              padding: '16px 24px',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{
                width: 20,
                height: 20,
                border: '2px solid #f3f3f3',
                borderTop: '2px solid #1976d2',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <span>Loading frames...</span>
            </div>
          </div>
        )}

        {/* Carousel */}
        <div style={{ position: 'relative' }}>
          <Swiper
            modules={[Navigation, Pagination, Keyboard, Mousewheel]}
            onSwiper={swiper => (swiperRef.current = swiper)}
            onSlideChange={handleSlideChange}
            initialSlide={initialIndex}
            slidesPerView={3}
            centeredSlides
            spaceBetween={16}
            navigation={{
              prevEl: '.custom-prev',
              nextEl: '.custom-next',
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
              dynamicMainBullets: 3
            }}
            keyboard={{
              enabled: true,
              onlyInViewport: false
            }}
            mousewheel={{
              enabled: true,
              forceToAxis: true
            }}
            breakpoints={{
              320: {
                slidesPerView: 1,
                spaceBetween: 10
              },
              640: {
                slidesPerView: 2,
                spaceBetween: 12
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 16
              }
            }}
            style={{ 
              width: '100%', 
              height: 200,
              '--swiper-navigation-color': '#1976d2',
              '--swiper-pagination-color': '#1976d2'
            } as any}
          >
            {frames.map((frame, idx) => {
              const isActive = String(frame.timestamp) === String(localActiveFrameId);
              return (
                <SwiperSlide key={frame.id}>
                  <div>
                    {renderFrameImage(frame, isActive, idx)}
                    
                    {/* Frame info */}
                    <div style={{ 
                      textAlign: 'center', 
                      marginTop: 8,
                      fontSize: 12,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#1976d2' : '#666'
                    }}>
                      Frame {frame.timestamp}
                    </div>
                    
                    {/* Confidence badge */}
                    {frame.confidence < 1.0 && (
                      <div style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: 10
                      }}>
                        {Math.round(frame.confidence * 100)}%
                      </div>
                    )}
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* Custom navigation buttons */}
          <button
            className="custom-prev"
            disabled={isLoading || isNavigating}
            style={{
              position: 'absolute',
              left: -16,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: 44,
              height: 44,
              cursor: (isLoading || isNavigating) ? 'not-allowed' : 'pointer',
              fontSize: 20,
              zIndex: 10,
              opacity: (isLoading || isNavigating) ? 0.5 : 1,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ‹
          </button>

          <button
            className="custom-next"
            disabled={isLoading || isNavigating}
            style={{
              position: 'absolute',
              right: -16,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: 44,
              height: 44,
              cursor: (isLoading || isNavigating) ? 'not-allowed' : 'pointer',
              fontSize: 20,
              zIndex: 10,
              opacity: (isLoading || isNavigating) ? 0.5 : 1,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ›
          </button>
        </div>

        {/* Footer with frame counter and instructions */}
        <div style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: 14,
            color: '#666',
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}>
            <span>
              {currentSlideIndex + 1} of {frames.length} frames
            </span>
            {frames.length >= 5 && (
              <span style={{ fontSize: 12, color: '#999' }}>
                Navigate to load more frames
              </span>
            )}
          </div>
          
          <div style={{
            fontSize: 12,
            color: '#999'
          }}>
            ← → Navigate • ESC Close • Mouse wheel scroll • Click frames
          </div>
        </div>

        {/* CSS animations */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}