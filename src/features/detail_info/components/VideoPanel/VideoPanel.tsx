import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import type { ResultItem } from '../../../results/types';

// Import your existing assets
import frameRates from '../../../../assets/video_fps.json';

type FrameRates = {
  [key: string]: number;
};

const videoFrameRates: FrameRates = frameRates;

const frameIdToSeconds = (frameId: string, videoId: string): number => {
  const frameRate = videoFrameRates[`${videoId}.mp4`] || 25.0;
  const frameNumber = parseInt(frameId, 10);
  if (isNaN(frameNumber) || frameRate <= 0) {
    return 0;
  }
  return frameNumber / frameRate;
};

// Event types for the event panel
const EVENT_TYPES = [
  { id: 'event1', name: 'Event 1', color: 'bg-red-500' },
  { id: 'event2', name: 'Event 2', color: 'bg-blue-500' },
  { id: 'event3', name: 'Event 3', color: 'bg-green-500' },
  { id: 'event4', name: 'Event 4', color: 'bg-yellow-500' },
  { id: 'event5', name: 'Event 5', color: 'bg-purple-500' },
];

// Preview frame cache management
class PreviewFrameCache {
  private cache = new Map<string, string>();
  private loadingPromises = new Map<string, Promise<string>>();
  private maxCacheSize = 100;

  async getFrame(videoId: string, frameId: number): Promise<string> {
    const key = `${videoId}-${frameId}`;
    
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)!;
    }  

    const loadPromise = this.loadFrame(videoId, frameId);
    this.loadingPromises.set(key, loadPromise);

    try {
      const result = await loadPromise;
      this.cache.set(key, result);
      
      if (this.cache.size > this.maxCacheSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          this.cache.delete(firstKey);          
        }
      }
      
      return result;
    } catch (error) {
      console.error('Failed to load frame:', error);
      return '';
    } finally {
      this.loadingPromises.delete(key);
    }
  }

  private async loadFrame(videoId: string, frameId: number): Promise<string> {
    const response = await fetch(`http://localhost:9991/keyframes/nearest?video_id=${videoId}&frame_index=${frameId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch keyframe');
    }
    const keyframe = await response.json();
    return keyframe.filename || '';
  }

  preloadFrames(videoId: string, centerFrameId: number, range: number = 10) {
    for (let i = -range; i <= range; i++) {
      const frameId = Math.max(0, centerFrameId + i);
      this.getFrame(videoId, frameId).catch(() => {});
    }
  }

  clear() {
    this.cache.clear();
    this.loadingPromises.clear();
  }
}

interface VideoPanelProps {
  videoId: string;
  timestamp: string;
  onClose: () => void;
  onBroadcast: (item: any) => void;
  currentUser: string;
  sendMessage?: (message: string) => void;
}

const VideoPanel: React.FC<VideoPanelProps> = ({ 
  videoId, 
  timestamp, 
  onClose, 
  onBroadcast, 
  currentUser,
  sendMessage = () => {}
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const previewCacheRef = useRef(new PreviewFrameCache());
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [scrollSensitivity, setScrollSensitivity] = useState(0.1);
  const [previewFrames, setPreviewFrames] = useState<Array<{time: number, frameId: number, thumbnail: string, loading: boolean}>>([]);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [showEventPanel, setShowEventPanel] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [eventFrames, setEventFrames] = useState<{[key: string]: ResultItem[]}>({
    event1: [],
    event2: [],
    event3: [],
    event4: [],
    event5: []
  });

  const startTimeInSeconds = useMemo(() => frameIdToSeconds(timestamp, videoId), [timestamp, videoId]);
  const frameRate = useMemo(() => videoFrameRates[`${videoId}.mp4`] || 25.0, [videoId]);

  const videoUrl = useMemo(() => {
    const mediaPlaylistName = `playlist.m3u8`;
    return `http://localhost:1406/video/${videoId}/${mediaPlaylistName}`;
  }, [videoId]);

  // Debounced preview update
  const updatePreviewsDebounced = useRef<NodeJS.Timeout | null>(null);

  const updatePreviews = useCallback(async (centerTime: number) => {
    const centerFrameId = Math.floor(centerTime * frameRate);
    const newPreviews = [];

    for (let offset = -3; offset <= 3; offset++) {
      const time = Math.max(0, Math.min(duration || 0, centerTime + offset));
      const frameId = Math.floor(time * frameRate);
      
      newPreviews.push({
        time,
        frameId,
        thumbnail: '',
        loading: true
      });
    }

    setPreviewFrames(newPreviews);

    const loadPromises = newPreviews.map(async (preview, index) => {
      try {
        const thumbnail = await previewCacheRef.current.getFrame(videoId, preview.frameId);
        return { index, thumbnail, loading: false };
      } catch (error) {
        return { index, thumbnail: '', loading: false };
      }
    });

    loadPromises.forEach(async (promise) => {
      const result = await promise;
      setPreviewFrames(prev => prev.map((item, i) => 
        i === result.index 
          ? { ...item, thumbnail: result.thumbnail, loading: result.loading }
          : item
      ));
    });

    previewCacheRef.current.preloadFrames(videoId, centerFrameId, 15);
  }, [videoId, duration, frameRate]);

  // Handle scroll for seeking
  const handleScroll = useCallback((event: WheelEvent) => {
    if (!videoRef.current || !videoContainerRef.current?.contains(event.target as Node)) return;
    if (!videoLoaded) return;
    
    event.preventDefault();
    
    const scrollDelta = event.deltaY > 0 ? scrollSensitivity : -scrollSensitivity;
    const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + scrollDelta));
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    
    if (updatePreviewsDebounced.current) {
      clearTimeout(updatePreviewsDebounced.current);
    }
    
    updatePreviewsDebounced.current = setTimeout(() => {
      updatePreviews(newTime);
    }, 100);
  }, [scrollSensitivity, duration, videoLoaded, updatePreviews]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!videoRef.current || !videoLoaded) return;

    switch (event.code) {
      case 'Space':
        event.preventDefault();
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        const newTimeLeft = Math.max(0, videoRef.current.currentTime - 1);
        videoRef.current.currentTime = newTimeLeft;
        updatePreviews(newTimeLeft);
        break;
      case 'ArrowRight':
        event.preventDefault();
        const newTimeRight = Math.min(duration, videoRef.current.currentTime + 1);
        videoRef.current.currentTime = newTimeRight;
        updatePreviews(newTimeRight);
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
    }
  }, [isPlaying, duration, onClose, videoLoaded, updatePreviews]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('wheel', handleScroll, { passive: false });
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('wheel', handleScroll);
      
      if (updatePreviewsDebounced.current) {
        clearTimeout(updatePreviewsDebounced.current);
      }
    };
  }, [handleKeyDown, handleScroll]);

  // Video initialization
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    previewCacheRef.current.clear();
    setVideoLoaded(false);
    setVideoError(null);
    setPreviewFrames([]);

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      const time = videoElement.currentTime;
      setCurrentTime(time);
    };
    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
      setVideoLoaded(true);
      updatePreviews(startTimeInSeconds);
    };
    const handleError = () => {
      setVideoError('Failed to load video');
      setVideoLoaded(false);
    };

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('error', handleError);

    if (Hls.isSupported()) {
      hlsRef.current = new Hls({
        enableWorker: false,
        maxLoadingDelay: 4,
        maxBufferLength: 30,
        maxBufferSize: 60 * 1000 * 1000,
      });

      hlsRef.current.loadSource(videoUrl);
      hlsRef.current.attachMedia(videoElement);
      
      hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
        videoElement.currentTime = startTimeInSeconds;
        videoElement.play().catch(console.error);
      });

      hlsRef.current.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
        if (data.fatal) {
          setVideoError(`HLS Error: ${data.details}`);
          setVideoLoaded(false);
        }
      });
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      videoElement.src = videoUrl;
      videoElement.addEventListener('loadedmetadata', () => {
        videoElement.currentTime = startTimeInSeconds;
        videoElement.play().catch(console.error);
      });
    } else {
      setVideoError('Video format not supported');
    }

    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('error', handleError);
      
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl, startTimeInSeconds, updatePreviews]);

  const handleBroadcastCurrentFrame = async () => {
    if (videoRef.current && videoLoaded) {
      const currentTime = videoRef.current.currentTime;
      const frameId = Math.floor(currentTime * frameRate);

      try {
        const response = await fetch(`http://localhost:9991/keyframes/nearest?video_id=${videoId}&frame_index=${frameId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch nearest keyframe');
        }
        const keyframe = await response.json();

        const itemToBroadcast: ResultItem = {
          id: `${keyframe.video_id}-${frameId}`,
          videoId: keyframe.video_id,
          timestamp: frameId.toString(),
          thumbnail: keyframe.filename,
          filename: keyframe.filename,
          title: `${keyframe.video_id}-${frameId}`,
          confidence: 1,
          submittedBy: currentUser,
        };

        onBroadcast(itemToBroadcast);
      } catch (error) {
        console.error('Error broadcasting current frame:', error);
      }
    }
  };

  const handleBroadcastVideo = () => {
    if (!videoRef.current || !videoLoaded) return;

    const message = {
      type: 'broadcast_video',
      payload: {
        videoId,
        timestamp: currentTime,
        submittedBy: currentUser,
        message: `${currentUser} is sharing video: ${videoId} at ${formatTime(currentTime)}`
      }
    };

    sendMessage(JSON.stringify(message));
  };

  const handleAddToEvent = async () => {
    if (!selectedEvent || !videoRef.current || !videoLoaded) return;

    const currentFrameTime = videoRef.current.currentTime;
    const frameId = Math.floor(currentFrameTime * frameRate);

    try {
      const response = await fetch(`http://localhost:9991/keyframes/nearest?video_id=${videoId}&frame_index=${frameId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch nearest keyframe');
      }
      const keyframe = await response.json();

      const newFrame: ResultItem = {
        id: `${keyframe.video_id}-${frameId}`,
        videoId: keyframe.video_id,
        timestamp: frameId.toString(),
        thumbnail: keyframe.filename,
        filename: keyframe.filename,
        title: `${keyframe.video_id}-${frameId}`,
        confidence: 1,
        submittedBy: currentUser,
      };

      setEventFrames(prev => ({
        ...prev,
        [selectedEvent]: [...prev[selectedEvent], newFrame]
      }));

      // Broadcast event update
      const message = {
        type: 'event_frame_added',
        payload: {
          eventId: selectedEvent,
          frame: newFrame,
          submittedBy: currentUser
        }
      };

      sendMessage(JSON.stringify(message));

    } catch (error) {
      console.error('Error adding frame to event:', error);
    }
  };

  const handleSubmitToDres = () => {
    if (!selectedEvent) {
      alert('Please select an event first');
      return;
    }

    const frames = eventFrames[selectedEvent];
    if (frames.length === 0) {
      alert('No frames added to this event');
      return;
    }

    const message = {
      type: 'dres_submission',
      payload: {
        eventId: selectedEvent,
        frames: frames,
        submittedBy: currentUser,
        timestamp: Date.now()
      }
    };

    sendMessage(JSON.stringify(message));
    
    // Clear the event after submission
    setEventFrames(prev => ({
      ...prev,
      [selectedEvent]: []
    }));

    alert(`Submitted ${frames.length} frames from ${selectedEvent} to DRES`);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current && videoLoaded) {
      const newTime = (parseFloat(event.target.value) / 100) * duration;
      videoRef.current.currentTime = newTime;
      
      if (updatePreviewsDebounced.current) {
        clearTimeout(updatePreviewsDebounced.current);
      }
      
      updatePreviewsDebounced.current = setTimeout(() => {
        updatePreviews(newTime);
      }, 200);
    }
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const newVolume = parseFloat(event.target.value) / 100;
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current && videoLoaded) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-1">
      <div className="relative w-full h-full max-w-3xl bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        {/* Main Video Panel */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between p-1 md:p-1 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1.5">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-gray-300 font-medium text-sm md:text-base truncate">{videoId}</span>
              {!videoLoaded && !videoError && (
                <span className="ml-2 text-yellow-400 text-xs md:text-sm">Loading...</span>
              )}
              {videoError && (
                <span className="ml-2 text-red-400 text-xs md:text-sm">{videoError}</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowEventPanel(!showEventPanel)}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
              >
                {showEventPanel ? 'Hide Events' : 'Show Events'}
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Close video"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Video Container */}
          <div 
            ref={videoContainerRef}
            className="relative bg-black flex-1 w-full h-auto aspect-video"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              playsInline
              crossOrigin="anonymous"
              onClick={togglePlayPause}
              style={{ display: videoError ? 'none' : 'block' }}
            />

            {/* Error Display */}
            {videoError && (
              <div className="absolute inset-0 flex items-center justify-center text-red-400 p-1">
                <div className="text-center">
                  <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <p className="text-base md:text-lg font-medium">{videoError}</p>
                  <p className="text-xs md:text-sm text-gray-500 mt-2">Please check the video source</p>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {!videoLoaded && !videoError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="animate-spin w-10 h-10 md:w-12 md:h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-sm md:text-base">Loading video...</p>
                </div>
              </div>
            )}

            {/* Custom Controls Overlay */}
            {videoLoaded && (
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                showControls ? 'opacity-100' : 'opacity-0'
              }`}>
                <button
                  onClick={togglePlayPause}
                  className="p-3 md:p-1 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                >
                  {isPlaying ? (
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.68L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/>
                    </svg>
                  )}
                </button>
              </div>
            )}

            {/* Scroll Indicator */}
            {videoLoaded && (
              <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-black/70 text-white px-2 py-1 rounded-lg text-xs md:text-sm">
                Scroll to seek ±{scrollSensitivity}s
              </div>
            )}
          </div>

          {/* Control Panel */}
          <div className="p-1 md:p-1 bg-gray-800 space-y-3">
            {/* Timeline */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <span className="text-xs md:text-sm text-gray-300 font-mono">{formatTime(currentTime)}</span>
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={duration ? (currentTime / duration) * 100 : 0}
                  onChange={handleSeek}
                  disabled={!videoLoaded}
                  className="w-full h-1.5 md:h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50"
                />
              </div>
              <span className="text-xs md:text-sm text-gray-300 font-mono">{formatTime(duration)}</span>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2 md:space-x-4">
                {/* Play/Pause */}
                <button
                  onClick={togglePlayPause}
                  disabled={!videoLoaded}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlaying ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.68L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/>
                    </svg>
                  )}
                </button>

                {/* Volume Control */}
                <div className="flex items-center space-x-1.5 md:space-x-2">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume * 100}
                    onChange={handleVolumeChange}
                    className="w-16 md:w-20 h-1 bg-gray-600 rounded appearance-none cursor-pointer"
                  />
                </div>

                {/* Scroll Sensitivity Control */}
                <div className="hidden md:flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Scroll:</span>
                  <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.05"
                    value={scrollSensitivity}
                    onChange={(e) => setScrollSensitivity(parseFloat(e.target.value))}
                    className="w-16 h-1 bg-gray-600 rounded appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-400 w-12">{scrollSensitivity.toFixed(2)}s</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBroadcastVideo}
                  disabled={!videoLoaded}
                  className="px-3 py-1.5 md:px-4 md:py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                  </svg>
                  <span className="hidden sm:inline">Share Video</span>
                </button>

                <button
                  onClick={handleBroadcastCurrentFrame}
                  disabled={!videoLoaded}
                  className="px-3 py-1.5 md:px-4 md:py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span className="hidden sm:inline">Broadcast Frame</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Event Panel */}
        {showEventPanel && (
          <div className="w-full lg:w-80 bg-gray-800 border-t lg:border-t-0 lg:border-l border-gray-700 flex flex-col">
            <div className="p-1 border-b border-gray-700">
              <h3 className="text-white font-semibold mb-4">Event Panel</h3>
              
              {/* Event Selection */}
              <div className="space-y-2 mb-4">
                {EVENT_TYPES.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event.id)}
                    className={`w-full p-3 rounded-lg border-2 transition-colors flex items-center justify-between ${
                      selectedEvent === event.id 
                        ? 'border-white bg-gray-700' 
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${event.color}`}></div>
                      <span className="text-white text-sm font-medium">{event.name}</span>
                    </div>
                    <span className="text-gray-400 text-xs">
                      {eventFrames[event.id].length} frames
                    </span>
                  </button>
                ))}
              </div>

              {/* Add Frame Button */}
              <button
                onClick={handleAddToEvent}
                disabled={!selectedEvent || !videoLoaded}
                className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                </svg>
                <span>Add Current Frame</span>
              </button>

              {/* Submit to DRES Button */}
              <button
                onClick={handleSubmitToDres}
                disabled={!selectedEvent}
                className="w-full mt-2 p-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
                <span>Submit to DRES</span>
              </button>
            </div>

            {/* Event Frames List */}
            <div className="flex-1 overflow-y-auto">
              {selectedEvent && (
                <div className="p-1">
                  <h4 className="text-gray-300 font-medium mb-3">
                    {EVENT_TYPES.find(e => e.id === selectedEvent)?.name} Frames
                  </h4>
                  
                  <div className="space-y-2">
                    {eventFrames[selectedEvent].map((frame, index) => (
                      <div
                        key={frame.id}
                        className="bg-gray-700 rounded-lg p-1 flex items-center space-x-3"
                      >
                        <img
                          src={`http://localhost:1406/keyframes/${frame.thumbnail}`}
                          alt={`Frame ${frame.timestamp}`}
                          className="w-12 h-8 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            Frame {frame.timestamp}
                          </p>
                          <p className="text-gray-400 text-xs">
                            Video: {frame.videoId}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setEventFrames(prev => ({
                              ...prev,
                              [selectedEvent]: prev[selectedEvent].filter((_, i) => i !== index)
                            }));
                          }}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                    
                    {eventFrames[selectedEvent].length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-8">
                        No frames added to this event yet
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1f2937;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          margin-top: -6px; /* Adjust for vertical alignment */
        }
        
        @media (min-width: 768px) {
            .slider::-webkit-slider-thumb {
                width: 20px;
                height: 20px;
                margin-top: -8px; /* Adjust for vertical alignment */
            }
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1f2937;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        @media (min-width: 768px) {
            .slider::-moz-range-thumb {
                width: 20px;
                height: 20px;
            }
        }

        .slider:disabled::-webkit-slider-thumb {
          background: #6b7280;
          cursor: not-allowed;
        }

        .slider:disabled::-moz-range-thumb {
          background: #6b7280;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default VideoPanel;