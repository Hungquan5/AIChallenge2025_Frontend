import React, { useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
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

  const scrollStateRef = useRef<{
    scrollHeight: number;
    scrollTop: number;
    prevFrameCount: number;
  } | null>(null);

  // Memoized frame processing to prevent unnecessary recalculations
  const processedFrames = useMemo(() => {
    return frames.map(frame => {
      const isActive = frame.timestamp === activeFrameId?.toString();
      
      return {
        ...frame,
        thumbnail: getImageUrl(frame.videoId, frame.thumbnail),
        title: `${frame.timestamp}`,
        isActive
      };
    });
  }, [frames, activeFrameId]);

  // Memoized handlers to prevent child re-renders
  const handleSending = useCallback((item: ResultItem) => {
    const message = {
      type: 'broadcast_image',
      payload: { ...item, submittedBy: currentUser },
    };
    sendMessage(JSON.stringify(message));
  }, [currentUser, sendMessage]);

  // Memoized empty handler to prevent re-renders
  const emptyHandler = useCallback(() => {}, []);

  useLayoutEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !scrollStateRef.current) return;

    const { prevFrameCount, scrollHeight: prevScrollHeight, scrollTop: prevScrollTop } = scrollStateRef.current;

    if (frames.length > prevFrameCount) {
      const newScrollHeight = scrollContainer.scrollHeight;
      const heightDifference = newScrollHeight - prevScrollHeight;
      scrollContainer.scrollTop = prevScrollTop + heightDifference;
    }

    scrollStateRef.current = null;
  }, [frames.length]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || isLoading) return;

    const checkAndLoadMore = () => {
      if (
        scrollContainer.scrollHeight <= scrollContainer.clientHeight &&
        hasMoreNext &&
        !isFetchingNext
      ) {
        loadNextFrames();
      }
    };

    // Use requestIdleCallback to avoid blocking rendering
    requestIdleCallback(checkAndLoadMore);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === topSentinelRef.current && hasMorePrev && !isFetchingPrev) {
              scrollStateRef.current = {
                scrollHeight: scrollContainer.scrollHeight,
                scrollTop: scrollContainer.scrollTop,
                prevFrameCount: frames.length,
              };
              // Use setTimeout to avoid blocking the intersection callback
              setTimeout(() => loadPreviousFrames(), 0);
            }
            else if (entry.target === bottomSentinelRef.current && hasMoreNext && !isFetchingNext) {
              setTimeout(() => loadNextFrames(), 0);
            }
          }
        });
      },
      {
        root: scrollContainer,
        rootMargin: '600px 0px',
      }
    );

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
    hasMoreNext,
    hasMorePrev,
    loadNextFrames,
    loadPreviousFrames,
    isFetchingNext,
    isFetchingPrev,
  ]);

  const modalClass = `${styles.modalClass} w-11/12 max-w-7xl h-[85vh] flex flex-col bg-white/90 backdrop-blur-lg`;

  return (
    <div className={styles.overlayClass} onClick={onClose}>
      <div className={modalClass} onClick={(e) => e.stopPropagation()}>
        {/* Panel Header - Memoized content */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800 truncate pr-4">
              Frames from: {videoTitle}
            </h2>
            {(isFetchingPrev || isFetchingNext) && (
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
        {isLoading && frames.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300"
          >
            {processedFrames.length > 0 ? (
              <div className={styles.gridClass}>
                {hasMorePrev && (
                  <div
                    ref={topSentinelRef}
                    className="w-full h-2 col-span-full"
                  />
                )}
                {processedFrames.map(frame => (
                  <ResultCard
                    key={frame.id}
                    item={frame}
                    loaded={true}
                    onLoad={emptyHandler}
                    onClick={onFrameClick}
                    onContextMenu={onRightClick}
                    onSimilaritySearch={onSimilaritySearch}
                    onSubmit={onSubmission}
                    onSending={handleSending}
                    onDoubleClick={onResultDoubleClick}
                    showConfidence
                    showTimestamp
                    isSelected={frame.isActive}
                    priority={frame.isActive} // Prioritize loading active frame
                  />
                ))}
                {hasMoreNext && (
                   <div
                    ref={bottomSentinelRef}
                    className="w-full h-2 col-span-full"
                  />
                )}
                {!hasMoreNext && processedFrames.length > 10 && (
                  <div className="col-span-full flex items-center justify-center py-4">
                    <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                      All frames loaded ({processedFrames.length} total)
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
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(FramesPanel);