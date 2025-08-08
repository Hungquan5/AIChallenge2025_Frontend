// features/frame-carousel/components/FrameItemSlide.tsx
import React ,{useCallback}from 'react';
import type { ResultItem } from '../../../results/types'; 
import * as styles from './styles';
import ResultCard from '../../../results/components/ResultsPanel/ResultCard';
import { fullSubmissionFlow } from '../../../submit/components/SubmitAPI';  
export const getImageUrl = (videoId: string, thumbnail: string) =>
  `http://localhost:1406/dataset/full_batch1/${videoId}/keyframes/${thumbnail}`;

interface FrameItemSlideProps {
  frame: ResultItem;
  isActive: boolean;
  onSimilaritySearch: (imageSrc: string, cardId: string) => void;
  // ✅ Add the new handlers to the props interface
  onRightClick?: (item: ResultItem) => void;
  onClick?: (item:ResultItem) => void;
  currentUser: string; // The name of the current user for broadcasting
  sendMessage: (message: string) => void; // WebSocket send function
}
const FrameItemSlide: React.FC<FrameItemSlideProps> = ({
  frame,
  isActive,
  onSimilaritySearch,
  onRightClick,
  // ✅ Destructure the new props
  currentUser,
  sendMessage,
}) => {
  const handleSending = useCallback((item: ResultItem) => {
    // 2. Create and send the WebSocket message
    const message = {
      type: 'broadcast_image',
      payload: {
        id: item.id,
        thumbnail: item.thumbnail,
        title: item.title,
        submittedBy: currentUser,
      },
    };
    sendMessage(JSON.stringify(message));

  }, [currentUser, sendMessage]);
  // This handler prevents the default context menu and calls our custom function
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault(); // This is crucial
    onRightClick?.(frame);
  };
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
        
        <div className="swiper-no-swiping">
          <ResultCard
            id={frame.timestamp}
            thumbnail={imageUrl}
            title={`Time: ${frame.timestamp}`}
            timestamp={frame.timestamp}
            confidence={frame.confidence || 0}
            showTimestamp
            showConfidence
            loaded={true}
            onLoad={() => {}}
            isSelected={isActive}
            onSubmit={() => fullSubmissionFlow(frame)}
            onSending={() => handleSending(frame)}
            onContextMenu={handleContextMenu} // Wire it to the ResultCard
            // The onSimilaritySearch prop is now passed and will work correctly
            onSimilaritySearch={onSimilaritySearch}
            imageClassName={styles.imageClass}
          />
        </div>
      </div>
    </div>
  );
};

export default FrameItemSlide;