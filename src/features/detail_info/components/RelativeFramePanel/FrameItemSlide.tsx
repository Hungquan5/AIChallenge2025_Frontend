// features/frame-carousel/components/FrameItemSlide.tsx
import React from 'react';
import type { FrameItem } from '../../types';
import * as styles from './styles';

export const getImageUrl = (videoId: string, thumbnail: string) =>
  `http://localhost:1406/dataset/full_batch1/${videoId}/keyframes/${thumbnail}`;

interface FrameItemSlideProps {
  frame: FrameItem;
  isActive: boolean;
}

const FrameItemSlide: React.FC<FrameItemSlideProps> = ({ frame, isActive }) => {
  // Combine the base class with either the active or inactive class
  const wrapperClasses = `
    ${styles.slideContentWrapperClass}
    ${isActive ? styles.activeSlideClass : styles.inactiveSlideClass}
  `;

  return (
    <div className={wrapperClasses}>
      <div className={styles.imageContainerClass}>
        {/* Conditionally render the glow effect only for the active slide */}
        {isActive && <div className={styles.activeImageGlowClass}></div>}
        
        <img
          src={getImageUrl(frame.videoId, frame.thumbnail)}
          alt={`Frame ${frame.timestamp}`}
          className={styles.imageClass}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/fallback.jpg';
          }}
        />
      </div>
    </div>
  );
};

export default FrameItemSlide;