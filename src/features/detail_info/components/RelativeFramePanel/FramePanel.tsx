// src/features/frame-carousel/components/FramesPanel.tsx
import React from 'react';
import type { ResultItem } from '../../../search/types';
import ResultCard from '../../../results/components/ResultsPanel/ResultCard';
import { getImageUrl } from '../../../../utils/getImageURL';
import { fullSubmissionFlow } from '../../../submit/components/SubmitAPI';

// Reusing styles for the modal overlay, panel, close button, and grid layout

// Import all the new styles from the dedicated file
import * as styles from './styles';
interface FramesPanelProps {
  frames: ResultItem[];
  videoTitle: string;
  isLoading: boolean;
  activeFrameId: string | number | null; // ✅ Add prop to receive the active ID

  onClose: () => void;
  onFrameClick: (item: ResultItem) => void;
  onSimilaritySearch: (imageSrc: string, cardId: string) => void;
  onRightClick: (item: ResultItem, event: React.MouseEvent) => void;
  currentUser: string;
  sendMessage: (message: string) => void;
}

const FramesPanel: React.FC<FramesPanelProps> = ({
  frames,
  videoTitle,
  isLoading,
  onClose,
  onFrameClick,
  onSimilaritySearch,
  activeFrameId, // Destructure the new prop

  onRightClick,
  currentUser,
  sendMessage,
}) => {

  const handleSending = (item: ResultItem) => {
    const message = {
      type: 'broadcast_image',
      payload: { ...item, submittedBy: currentUser },
    };
    sendMessage(JSON.stringify(message));
  };

  // Enhance the base modal style for this specific panel
  const modalClass = `${styles.modalClass} w-11/12 max-w-7xl h-[85vh] flex flex-col bg-white/90 backdrop-blur-lg`;
  return (
    // The main overlay that covers the screen
    <div className={styles.overlayClass} onClick={onClose}>
      {/* The panel itself, stopping click propagation to prevent closing */}
      <div className={modalClass} onClick={(e) => e.stopPropagation()}>
        {/* Panel Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 flex-shrink-0">
            <h2 className="text-xl font-bold text-slate-800 truncate pr-4">Frames from: {videoTitle}</h2>
            <button onClick={onClose} className={styles.closeButtonClass} aria-label="Close frames view">
                ×
            </button>
        </div>

        {/* Panel Body */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300">
             {frames.length > 0 ? (
              <div className={styles.gridClass}>
                {frames.map(frame => {
                  // ✅ Check if the current frame is the active one
                  const isActive = frame.timestamp === activeFrameId?.toString();

                  return (
                    <ResultCard
                      key={frame.id}
                      id={frame.id}
                      thumbnail={getImageUrl(frame.videoId, frame.thumbnail)}
                      title={`Time: ${frame.timestamp}`}
                      confidence={frame.confidence}
                      timestamp={frame.timestamp}
                      loaded={true}
                      onLoad={() => {}}
                      onClick={() => onFrameClick(frame)}
                      onContextMenu={(event) => onRightClick(frame, event)}
                      onSimilaritySearch={onSimilaritySearch}
                      onSubmit={() => fullSubmissionFlow(frame)}
                      onSending={() => { /* ... */ }}
                      showConfidence
                      showTimestamp
                      isSelected={isActive} // ✅ Use the isSelected prop to apply the highlight
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center text-slate-500">
                  <p className="font-semibold text-lg">No frames were found for this video.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FramesPanel;