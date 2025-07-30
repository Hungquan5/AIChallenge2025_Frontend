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
  // Combine the base class with either the active or inactive class.
  const wrapperClasses = `
    ${styles.slideContentWrapperClass}
    ${isActive ? styles.activeSlideClass : styles.inactiveSlideClass}
  `;

  return (
    <div className={wrapperClasses}>
      <div className={styles.imageContainerClass}>
        {/* NEW: Conditionally render the glow effect only for the active slide */}
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
      
      {/* 
        This info panel will now animate automatically because the active slide's
        wrapper will always have `group-hover` styles effectively applied, 
        and the inactive slides will reveal it on manual hover.
      */}
      <div className={`${styles.infoPanelClass} ${isActive && 'opacity-100 translate-y-0'}`}>
        <div className={styles.infoContentClass}>
          <div className={styles.infoSectionClass}>
            <span className={styles.infoLabelClass}>Time:</span>
            <span className={styles.infoValueClass}>{frame.timestamp}</span>
          </div>
          <div className={styles.infoSectionClass}>
            <span className={styles.infoLabelClass}>Conf:</span>
            <span className={styles.infoValueClass}>{frame.confidence.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrameItemSlide;