import React, { useRef, useEffect, useLayoutEffect } from 'react';
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

    checkAndLoadMore();

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
              loadPreviousFrames();
            }
            else if (entry.target === bottomSentinelRef.current && hasMoreNext && !isFetchingNext) {
              loadNextFrames();
            }
          }
        });
      },
      {
        root: scrollContainer,
        // This is the key to loading frames before the user hits the bottom.
        // The 'rootMargin' effectively extends the viewport. A value of '600px'
        // means the observer will trigger when the sentinel is still 600px
        // away from being visible.
        // If your grid rows are about 250px high, this will trigger the next
        // load when the user is about two rows away from the end.
        // Increase this value to load earlier, or decrease it to load later.
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
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300"
          >
            {frames.length > 0 ? (
              <div className={styles.gridClass}>
                {hasMorePrev && (
                  <div
                    ref={topSentinelRef}
                    className="w-full h-2 col-span-full"
                  />
                )}
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
                      onLoad={() => { }}
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
                {hasMoreNext && (
                   <div
                    ref={bottomSentinelRef}
                    className="w-full h-2 col-span-full"
                  />
                )}
                {!hasMoreNext && frames.length > 10 && (
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

        {/* Footer */}
        <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
          <span>
            Showing {frames.length} frames
            {!hasMoreNext && !hasMorePrev && frames.length > 0 && " (complete)"}
          </span>
          <div className="flex gap-4">
            {hasMorePrev && (
              <span className="text-blue-600">Scroll up to load more</span>
            )}
            {hasMoreNext && (
              <span className="text-blue-600">Scroll down to load more</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FramesPanel;