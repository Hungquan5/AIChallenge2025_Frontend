import { useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

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
}

export default function FrameCarousel({ frames, activeFrameId, onClose }: FrameCarouselProps) {
  const initialIndex = frames.findIndex(f => String(f.timestamp) === String(activeFrameId));
  const swiperRef = useRef<any>(null);

  useEffect(() => {
    if (swiperRef.current && initialIndex >= 0) {
      swiperRef.current.slideTo(initialIndex, 0);
    }
  }, [initialIndex]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 500, maxWidth: 800 }}>
        <button onClick={onClose} style={{ float: 'right', fontSize: 20, border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
        <Swiper
          onSwiper={swiper => (swiperRef.current = swiper)}
          initialSlide={initialIndex}
          slidesPerView={3}
          centeredSlides
          style={{ width: 600, height: 200 }}
        >
          {frames.map((frame, idx) => (
            <SwiperSlide key={frame.id}>
              <img
                src={frame.thumbnail}
                alt={frame.title}
                style={{
                  border: String(frame.timestamp) === String(activeFrameId) ? '3px solid #1976d2' : '1px solid #ccc',
                  borderRadius: 8,
                  width: 180,
                  height: 120,
                  objectFit: 'cover'
                }}
              />
              <div style={{ textAlign: 'center', marginTop: 4 }}>{frame.timestamp}</div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
} 