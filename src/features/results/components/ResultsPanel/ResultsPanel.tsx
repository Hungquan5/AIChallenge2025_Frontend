import React, { useRef, useEffect, useState } from 'react';
import SortedByConfidenceView from './SortByConfView';
import GroupedByVideoView from './GroupByVideoView';
import type { ResultItem, GroupedResult, ViewMode } from '../../types';
import { containerClass } from './styles';
import { useShortcuts } from '../../../../utils/shortcuts';
import FrameCarousel from '../../../../components/FrameCarousel';

// Define the Keyframe interface to match your FastAPI model
interface Keyframe {
  video_id: string;
  frame_index: number;
  filename: string;
}

interface ResultsPanelProps {
  viewMode: ViewMode;
  results: ResultItem[];
  groupedResults?: GroupedResult[];
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ viewMode, results, groupedResults = [] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [carouselFrames, setCarouselFrames] = useState<any[] | null>(null);
  const [activeFrameId, setActiveFrameId] = useState<string | number | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Function to fetch next frame
  const fetchNextFrame = async (videoId: string, currentFrameIndex: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:9991/keyframes/next?video_id=${encodeURIComponent(videoId)}&frame_index=${currentFrameIndex}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const nextFrame: Keyframe = await response.json();
      
      // Transform to FrameItem format
      const frameItem = {
        id: `${nextFrame.video_id}_${nextFrame.frame_index}`,
        videoId: nextFrame.video_id,
        title: `Frame ${nextFrame.frame_index}`,
        thumbnail: nextFrame.filename,
        confidence: 1.0,
        timestamp: nextFrame.frame_index.toString()
      };
      
      // Update carousel frames - add new frame and remove old ones to maintain window
      setCarouselFrames(prevFrames => {
        if (!prevFrames) return [frameItem];
        
        const newFrames = [...prevFrames, frameItem];
        // Keep only last 5 frames for performance
        return newFrames.slice(-5);
      });
      
      setActiveFrameId(nextFrame.frame_index);
      return nextFrame;
    } catch (error) {
      console.error('Error fetching next frame:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch previous frame
  const fetchPrevFrame = async (videoId: string, currentFrameIndex: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:9991/keyframes/prev?video_id=${encodeURIComponent(videoId)}&frame_index=${currentFrameIndex}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const prevFrame: Keyframe = await response.json();
      
      // Transform to FrameItem format
      const frameItem = {
        id: `${prevFrame.video_id}_${prevFrame.frame_index}`,
        videoId: prevFrame.video_id,
        title: `Frame ${prevFrame.frame_index}`,
        thumbnail: prevFrame.filename,
        confidence: 1.0,
        timestamp: prevFrame.frame_index.toString()
      };
      
      // Update carousel frames - add new frame at beginning and remove old ones to maintain window
      setCarouselFrames(prevFrames => {
        if (!prevFrames) return [frameItem];
        
        const newFrames = [frameItem, ...prevFrames];
        // Keep only first 5 frames for performance
        return newFrames.slice(0, 5);
      });
      
      setActiveFrameId(prevFrame.frame_index);
      return prevFrame;
    } catch (error) {
      console.error('Error fetching previous frame:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle carousel navigation
  const handleCarouselNext = async () => {
    if (!currentVideoId || activeFrameId === null || isLoading) return;
    
    const currentFrameIndex = typeof activeFrameId === 'number' ? activeFrameId : parseInt(activeFrameId.toString());
    await fetchNextFrame(currentVideoId, currentFrameIndex);
  };

  const handleCarouselPrev = async () => {
    if (!currentVideoId || activeFrameId === null || isLoading) return;
    
    const currentFrameIndex = typeof activeFrameId === 'number' ? activeFrameId : parseInt(activeFrameId.toString());
    await fetchPrevFrame(currentVideoId, currentFrameIndex);
  };

  const handleResultClick = async (item: ResultItem) => {
    try {
      setIsLoading(true);
      const currentFrameIndex = typeof item.timestamp === 'number' ? item.timestamp : parseInt(item.timestamp);
      
      // Set current video ID for navigation
      setCurrentVideoId(item.videoId);
      
      // Create initial frame from the clicked item
      const currentFrame = {
        id: `${item.videoId}_${currentFrameIndex}`,
        videoId: item.videoId,
        title: `Frame ${currentFrameIndex}`,
        thumbnail: item.filename || `frame_${currentFrameIndex}.jpg`,
        confidence: item.confidence || 1.0,
        timestamp: currentFrameIndex.toString()
      };
      
      // Initialize carousel with just the current frame
      setCarouselFrames([currentFrame]);
      setActiveFrameId(currentFrameIndex);
      
      // Try to preload a few nearby frames for smoother navigation
      try {
        const windowSize = 2;
        const nearbyFrames = [currentFrame];
        
        // Fetch previous frames
        let prevFrameIndex = currentFrameIndex;
        for (let i = 0; i < windowSize; i++) {
          try {
            const prevRes = await fetch(`http://localhost:9991/keyframes/prev?video_id=${encodeURIComponent(item.videoId)}&frame_index=${prevFrameIndex}`);
            if (prevRes.ok) {
              const prevFrame: Keyframe = await prevRes.json();
              const frameItem = {
                id: `${prevFrame.video_id}_${prevFrame.frame_index}`,
                videoId: prevFrame.video_id,
                title: `Frame ${prevFrame.frame_index}`,
                thumbnail: prevFrame.filename,
                confidence: 1.0,
                timestamp: prevFrame.frame_index.toString()
              };
              nearbyFrames.unshift(frameItem);
              prevFrameIndex = prevFrame.frame_index;
            } else {
              break;
            }
          } catch (e) {
            break;
          }
        }
        
        // Fetch next frames
        let nextFrameIndex = currentFrameIndex;
        for (let i = 0; i < windowSize; i++) {
          try {
            const nextRes = await fetch(`http://localhost:9991/keyframes/next?video_id=${encodeURIComponent(item.videoId)}&frame_index=${nextFrameIndex}`);
            if (nextRes.ok) {
              const nextFrame: Keyframe = await nextRes.json();
              const frameItem = {
                id: `${nextFrame.video_id}_${nextFrame.frame_index}`,
                videoId: nextFrame.video_id,
                title: `Frame ${nextFrame.frame_index}`,
                thumbnail: nextFrame.filename,
                confidence: 1.0,
                timestamp: nextFrame.frame_index.toString()
              };
              nearbyFrames.push(frameItem);
              nextFrameIndex = nextFrame.frame_index;
            } else {
              break;
            }
          } catch (e) {
            break;
          }
        }
        
        setCarouselFrames(nearbyFrames);
      } catch (preloadError) {
        console.warn('Error preloading nearby frames:', preloadError);
        // Continue with just the current frame
      }
      
    } catch (error) {
      console.error('Error opening frame carousel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCarouselClose = () => {
    setCarouselFrames(null);
    setActiveFrameId(null);
    setCurrentVideoId(null);
  };

  const focusNextResult = () => {
    const container = containerRef.current;
    if (!container) return;
    
    const items = container.querySelectorAll('.result-item');
    const currentFocus = document.activeElement;
    const currentIndex = Array.from(items).indexOf(currentFocus as Element);
    
    if (currentIndex === -1 && items.length > 0) {
      // No item focused, focus first item
      (items[0] as HTMLElement).focus();
    } else if (currentIndex < items.length - 1) {
      // Focus next item
      (items[currentIndex + 1] as HTMLElement).focus();
    }
  };

  const focusPrevResult = () => {
    const container = containerRef.current;
    if (!container) return;
    
    const items = container.querySelectorAll('.result-item');
    const currentFocus = document.activeElement;
    const currentIndex = Array.from(items).indexOf(currentFocus as Element);
    
    if (currentIndex === -1 && items.length > 0) {
      // No item focused, focus last item
      (items[items.length - 1] as HTMLElement).focus();
    } else if (currentIndex > 0) {
      // Focus previous item
      (items[currentIndex - 1] as HTMLElement).focus();
    }
  };

  useShortcuts({
    NEXT_RESULT: focusNextResult,
    PREV_RESULT: focusPrevResult,
  });

  return (
    <div className={containerClass} ref={containerRef}>
      {viewMode === 'sortByConfidence' ? (
        <SortedByConfidenceView results={results} onResultClick={handleResultClick} />
      ) : (
        <GroupedByVideoView groupedResults={groupedResults} onResultClick={handleResultClick} />
      )}
      {carouselFrames && activeFrameId && (
        <FrameCarousel
          frames={carouselFrames}
          activeFrameId={activeFrameId}
          onClose={handleCarouselClose}
          onNext={handleCarouselNext}
          onPrev={handleCarouselPrev}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default ResultsPanel;