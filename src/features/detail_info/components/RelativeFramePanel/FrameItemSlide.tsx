// features/frame-carousel/components/FrameItemSlide.tsx
import React from 'react';
import type { FrameItem } from '../../types';
import * as styles from './styles';
import ResultCard from '../../../results/components/ResultsPanel/ResultCard';

export const getImageUrl = (videoId: string, thumbnail: string) =>
  `http://localhost:1406/dataset/full_batch1/${videoId}/keyframes/${thumbnail}`;

interface FrameItemSlideProps {
  frame: FrameItem;
  isActive: boolean;
  onSimilaritySearch: (imageSrc: string, cardId: string) => void;
}

const FrameItemSlide: React.FC<FrameItemSlideProps> = ({ frame, isActive,onSimilaritySearch }) => {
  // Combine the base class with either the active or inactive class
  const wrapperClasses = `
    ${styles.slideContentWrapperClass}
    ${isActive ? styles.activeSlideClass : styles.inactiveSlideClass}
  `;
  const imageUrl = getImageUrl(frame.videoId, frame.thumbnail); // Assuming keyframe_id from your types
  return (
    <div className={wrapperClasses}>
      <div className={styles.imageContainerClass}>
        {/* Conditionally render the glow effect only for the active slide */}
        {isActive && <div className={styles.activeImageGlowClass}></div>}
        
        <ResultCard
        id={frame.timestamp}
        thumbnail={imageUrl}
        title={`Time: ${frame.timestamp}`}
        timestamp={frame.timestamp}
        confidence={frame.confidence || 0}
        showTimestamp
        showConfidence
        loaded={true} // In the carousel, we can assume images are loaded
        onLoad={() => {}} // No action needed
        isSelected={isActive}
        // CRITICAL: Pass the similarity search handler down
        onSimilaritySearch={onSimilaritySearch}
        // NOTE: We DO NOT pass an `onClick` handler. Swiper handles the
        // click-to-navigate action on its own. Our ResultCard's handleClick
        // will now ONLY handle the Ctrl+Click case.
        imageClassName={styles.imageClass} // ✅ override here
      />
      </div>
    </div>
  );
};

export default FrameItemSlide;