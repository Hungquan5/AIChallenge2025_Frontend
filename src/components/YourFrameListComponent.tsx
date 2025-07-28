import { useState } from 'react';
import FrameCarousel, { FrameItem } from './FrameCarousel';

interface YourFrameListComponentProps {
  frames: FrameItem[];
}

export default function YourFrameListComponent({ frames }: YourFrameListComponentProps) {
  const [carouselFrames, setCarouselFrames] = useState<FrameItem[] | null>(null);
  const [activeFrameId, setActiveFrameId] = useState<string | number | null>(null);

  const handleFrameClick = async (frame: FrameItem) => {
    const res = await fetch('/embeddings/nearby_frames', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_id: frame.videoId,
        frame_id: frame.timestamp,
        window_size: 5
      })
    });
    const data = await res.json();
    setCarouselFrames(data);
    setActiveFrameId(frame.timestamp);
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 8 }}>
        {frames.map(frame => (
          <img
            key={frame.id}
            src={frame.thumbnail}
            alt={frame.title}
            style={{ width: 120, height: 80, cursor: 'pointer' }}
            onClick={() => handleFrameClick(frame)}
          />
        ))}
      </div>
      {carouselFrames && activeFrameId && (
        <FrameCarousel
          frames={carouselFrames}
          activeFrameId={activeFrameId}
          onClose={() => setCarouselFrames(null)}
        />
      )}
    </>
  );
} 