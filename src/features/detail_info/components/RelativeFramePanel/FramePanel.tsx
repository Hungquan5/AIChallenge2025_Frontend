import React, { useCallback, useRef, useEffect, useState } from 'react';
import type { ResultItem } from '../../../search/types';
import ResultCard from '../../../results/components/ResultsPanel/ResultCard';
import { getImageUrl } from '../../../../utils/getImageURL';

import * as styles from './styles';

interface FramesPanelProps {
  frames: ResultItem[];
  videoTitle: string;
  isLoading: boolean;
  activeFrameId: string | number | null;
  onClose: () => void;
  onFrameClick: (item: ResultItem) => void;
  onSimilaritySearch: (imageSrc: string, cardId: string) => void;
  onRightClick: (item: ResultItem, event: React.MouseEvent) => void;
  currentUser: string;
  sendMessage: (message: string) => void;
  onSubmission: (item: ResultItem) => void;
  onResultDoubleClick: (item: ResultItem) => void;
  loadNextFrames: () => void;
  hasMoreNext: boolean;
  hasMorePrev: boolean;
  loadPreviousFrames: () => void;
  isFetchingNext: boolean;
  isFetchingPrev: boolean;
}

const FramesPanel: React.FC<FramesPanelProps> = ({
  frames,
  videoTitle,
  isLoading,
  onClose,
  onFrameClick,
  onSimilaritySearch,
  activeFrameId,
  onRightClick,
  currentUser,
  sendMessage,
  onResultDoubleClick,
  onSubmission,
  loadNextFrames,
  loadPreviousFrames,
  hasMoreNext,
  hasMorePrev,
  isFetchingNext,
  isFetchingPrev,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  
  // Track if we're currently loading to prevent multiple simultaneous loads
  const [isInternalLoading, setIsInternalLoading] = useState(false);
  
  // Track the previous frame count to detect when new frames are added
  const prevFrameCountRef = useRef(frames.length);
  const lastScrollTopRef = useRef(0);

  // Store scroll position when new frames are added at the top
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const currentFrameCount = frames.length;
    const prevFrameCount = prevFrameCountRef.current;

    // If frames were added at the beginning (prev frames), maintain scroll position
    if (currentFrameCount > prevFrameCount) {
      const framesDifference = currentFrameCount - prevFrameCount;
      
      // Estimate the height of added frames (adjust based on your card height)
      const estimatedCardHeight = 200; // Adjust this value based on your actual card height
      const addedHeight = framesDifference * estimatedCardHeight;
      
      // Only adjust if we added frames at the top
      if (framesDifference > 0 && lastScrollTopRef.current < 100) {
        scrollContainer.scrollTop = lastScrollTopRef.current + addedHeight;
      }
    }

    prevFrameCountRef.current = currentFrameCount;
  }, [frames.length]);

  // Improved intersection observer with better logic
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || isLoading || isInternalLoading) return;

    // Initial check: if content doesn't fill viewport, load more
    const hasVerticalScroll = scrollContainer.scrollHeight > scrollContainer.clientHeight;
    
    if (!hasVerticalScroll && hasMoreNext) {
      setIsInternalLoading(true);
      loadNextFrames();
      setTimeout(() => setIsInternalLoading(false), 1000); // Prevent rapid calls
      return;
    }

    // Set up intersection observer with better margins
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isInternalLoading) {
            if (entry.target === topSentinelRef.current && hasMorePrev && !isFetchingPrev) {
              setIsInternalLoading(true);
              lastScrollTopRef.current = scrollContainer.scrollTop;
              loadPreviousFrames();
              setTimeout(() => setIsInternalLoading(false), 1000);
            } else if (entry.target === bottomSentinelRef.current && hasMoreNext && !isFetchingNext) {
              setIsInternalLoading(true);
              loadNextFrames();
              setTimeout(() => setIsInternalLoading(false), 1000);
            }
          }
        });
      },
      { 
        root: scrollContainer, 
        // Reduced margin to prevent premature loading
        rootMargin: '200px 0px',
        // Higher threshold to ensure sentinel is actually visible
        threshold: 0.1
      }
    );

    // Only observe if we have more content to load
    if (topSentinelRef.current && hasMorePrev) {
      observer.observe(topSentinelRef.current);
    }
    if (bottomSentinelRef.current && hasMoreNext) {
      observer.observe(bottomSentinelRef.current);
    }

    return () => observer.disconnect();
  }, [
    frames.length, 
    isLoading, 
    isInternalLoading, 
    hasMoreNext, 
    hasMorePrev, 
    loadNextFrames, 
    loadPreviousFrames,
    isFetchingNext,
    isFetchingPrev
  ]);

  // Manual scroll handler as backup
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isInternalLoading || isLoading) return;
    
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Store current scroll position
    lastScrollTopRef.current = scrollTop;
    
    // Load previous frames when near top
    if (scrollTop < 100 && hasMorePrev && !isFetchingPrev) {
      setIsInternalLoading(true);
      loadPreviousFrames();
      setTimeout(() => setIsInternalLoading(false), 1000);
    }
    
    // Load next frames when near bottom
    if (scrollTop + clientHeight >= scrollHeight - 100 && hasMoreNext && !isFetchingNext) {
      setIsInternalLoading(true);
      loadNextFrames();
      setTimeout(() => setIsInternalLoading(false), 1000);
    }
  }, [isInternalLoading, isLoading, hasMoreNext, hasMorePrev, loadNextFrames, loadPreviousFrames, isFetchingNext, isFetchingPrev]);

  const handleSending = (item: ResultItem) => {
    const message = {
      type: 'broadcast_image',
      payload: { ...item, submittedBy: currentUser },
    };
    sendMessage(JSON.stringify(message));
  };

  const modalClass = `${styles.modalClass} w-11/12 max-w-7xl h-[85vh] flex flex-col bg-white/90 backdrop-blur-lg`;

  return (
    <div className={styles.overlayClass} onClick={onClose}>
      <div className={modalClass} onClick={(e) => e.stopPropagation()}>
        {/* Panel Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800 truncate pr-4">
              Frames from: {videoTitle}
            </h2>
            {/* Loading indicators */}
            {(isFetchingPrev || isFetchingNext || isInternalLoading) && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-dashed rounded-full animate-spin"></div>
                <span>Loading frames...</span>
              </div>
            )}
          </div>
          <button 
            onClick={onClose} 
            className={styles.closeButtonClass} 
            aria-label="Close frames view"
          >
            ×
          </button>
        </div>

        {/* Panel Body */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300"
            onScroll={handleScroll}
          >
            {frames.length > 0 ? (
              <div className={styles.gridClass}>
                {/* Top sentinel - only show if there are more previous frames */}
                {hasMorePrev && (
                  <div 
                    ref={topSentinelRef} 
                    className="w-full h-2 flex items-center justify-center"
                  >
                    {isFetchingPrev && (
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Loading previous frames...
                      </div>
                    )}
                  </div>
                )}
                
                {/* Frames grid */}
                {frames.map(frame => {
                  const isActive = frame.timestamp === activeFrameId?.toString();

                  return (
                    <ResultCard
                      key={frame.id}
                      id={frame.id}
                      thumbnail={getImageUrl(frame.videoId, frame.thumbnail)}
                      title={`${frame.timestamp}`}
                      confidence={frame.confidence}
                      timestamp={frame.timestamp}
                      loaded={true}
                      onLoad={() => {}}
                      onClick={() => onFrameClick(frame)}
                      onContextMenu={(event) => onRightClick(frame, event)}
                      onSimilaritySearch={onSimilaritySearch}
                      onSubmit={() => onSubmission(frame)}
                      onSending={() => handleSending(frame)}
                      onDoubleClick={() => onResultDoubleClick(frame)}
                      showConfidence
                      showTimestamp
                      isSelected={isActive}
                    />
                  );
                })}

                {/* Bottom sentinel - only show if there are more next frames */}
                {hasMoreNext && (
                  <div 
                    ref={bottomSentinelRef} 
                    className="w-full h-2 flex items-center justify-center"
                  >
                    {isFetchingNext && (
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Loading more frames...
                      </div>
                    )}
                  </div>
                )}

                {/* End indicator */}
                {!hasMoreNext && !hasMorePrev && frames.length > 10 && (
                  <div className="col-span-full flex items-center justify-center py-4">
                    <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                      All frames loaded ({frames.length} total)
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center text-slate-500">
                <p className="font-semibold text-lg">No frames were found for this video.</p>
              </div>
            )}
          </div>
        )}

        {/* Footer with frame count info */}
        <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
          <span>
            Showing {frames.length} frames
            {!hasMoreNext && !hasMorePrev && frames.length > 0 && " (complete)"}
          </span>
          <div className="flex gap-4">
            {hasMorePrev && (
              <span className="text-blue-600">← More frames available</span>
            )}
            {hasMoreNext && (
              <span className="text-blue-600">More frames available →</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FramesPanel;