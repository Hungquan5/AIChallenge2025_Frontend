import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import type { ResultItem } from '../../../results/types';
import {
  MediaController,
  MediaControlBar,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaVolumeRange,
  MediaPlayButton,
  MediaMuteButton,
} from 'media-chrome/react';

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
  const mediaControllerRef = useRef<HTMLElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const scrubbingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [showEventPanel, setShowEventPanel] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [eventFrames, setEventFrames] = useState<{[key: string]: ResultItem[]}>({
    event1: [], event2: [], event3: [], event4: [], event5: []
  });

  const startTimeInSeconds = useMemo(() => frameIdToSeconds(timestamp, videoId), [timestamp, videoId]);
  const frameRate = useMemo(() => videoFrameRates[`${videoId}.mp4`] || 25.0, [videoId]);

  const videoUrl = useMemo(() => {
    const mediaPlaylistName = `playlist.m3u8`;
    return `http://localhost:1406/video/${videoId}/${mediaPlaylistName}`;
  }, [videoId]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!videoRef.current || !videoLoaded) return;
    if (event.target instanceof HTMLInputElement) return;

    switch (event.code) {
      case 'Space':
        event.preventDefault();
        videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        videoRef.current.currentTime -= 1;
        break;
      case 'ArrowRight':
        event.preventDefault();
        videoRef.current.currentTime += 1;
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
    }
  }, [onClose, videoLoaded]);

  // Simplified scrolling logic
  const handleWheel = useCallback((event: WheelEvent) => {
    if (!videoRef.current || !videoLoaded) return;
    event.preventDefault();

    const video = videoRef.current;
    if (!video.paused) {
      video.pause();
    }

    if (scrubbingTimeoutRef.current) {
      clearTimeout(scrubbingTimeoutRef.current);
    }
    setIsScrubbing(true);

    const scrollSensitivity = 0.1; // Adjust this value to control seeking speed
    const timeIncrement = event.deltaY > 0 ? -scrollSensitivity : scrollSensitivity;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + timeIncrement));

    scrubbingTimeoutRef.current = setTimeout(() => {
      setIsScrubbing(false);
    }, 200); // Hide "Scrubbing" indicator after 200ms of inactivity

  }, [videoLoaded]);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const mediaEl = mediaControllerRef.current;
    if (videoLoaded && mediaEl) {
      mediaEl.addEventListener('wheel', handleWheel, { passive: false });
      return () => mediaEl.removeEventListener('wheel', handleWheel);
    }
  }, [videoLoaded, handleWheel]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    setVideoLoaded(false);
    setVideoError(null);

    const onError = () => {
      setVideoError('Failed to load video. Please check the source.');
      setVideoLoaded(false);
    };

    videoEl.addEventListener('error', onError);

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(videoUrl);
      hls.attachMedia(videoEl);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoEl.currentTime = startTimeInSeconds;
        videoEl.play().catch(console.error);
        setVideoLoaded(true);
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error('HLS Error:', data);
          setVideoError(`HLS Error: ${data.details}`);
        }
      });
    } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = videoUrl;
      videoEl.addEventListener('loadedmetadata', () => {
        videoEl.currentTime = startTimeInSeconds;
        videoEl.play().catch(console.error);
        setVideoLoaded(true);
      });
    } else {
      setVideoError('HLS is not supported in your browser.');
    }

    return () => {
      videoEl.removeEventListener('error', onError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [videoUrl, startTimeInSeconds]);

  // Rest of your handlers (handleBroadcastCurrentFrame, handleBroadcastVideo, etc.) remain unchanged
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
    const currentTime = videoRef.current.currentTime;
    
    const message = {
      type: 'broadcast_video',
      payload: {
        videoId,
        timestamp: currentTime,
        submittedBy: currentUser,
        message: `${currentUser} is sharing video: ${videoId} at ${new Date(currentTime * 1000).toISOString().substr(14, 5)}`
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
    
    setEventFrames(prev => ({
      ...prev,
      [selectedEvent]: []
    }));

    alert(`Submitted ${frames.length} frames from ${selectedEvent} to DRES`);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4">
      <div className="relative w-full h-full max-w-4xl bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-gray-700/50">
        
        {/* Main Video Panel */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-gray-900/50 border-b border-gray-700/50 shadow-md">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1.5">
                <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
              </div>
              <span className="text-gray-200 font-semibold text-base truncate">{videoId}</span>
              {isScrubbing && (
                <span className="ml-2 text-xs font-semibold text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded-full">Scrubbing</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowEventPanel(!showEventPanel)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-[0_0_15px_rgba(167,139,250,0.6)] text-sm font-semibold"
              >
                {showEventPanel ? 'Hide Events' : 'Show Events'}
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-colors duration-200"
                aria-label="Close video"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
            
          {/* Video Container */}
          <MediaController 
            ref={mediaControllerRef}
            className="relative bg-black flex-1 w-full aspect-video overflow-hidden"
          >
            <video
              ref={videoRef}
              slot="media"
              className="w-full h-full object-contain transition-opacity duration-300"
              playsInline
              crossOrigin="anonymous"
              style={{ opacity: videoLoaded ? 1 : 0 }}
            />
            
            {/* Loading and Error States */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {!videoLoaded && !videoError && (
                 <div className="flex flex-col items-center text-white">
                    <svg className="w-12 h-12 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-2 animate-pulse">Loading Video...</p>
                 </div>
              )}
              {videoError && (
                 <div className="flex flex-col items-center text-red-400 p-4 bg-red-900/20 rounded-lg">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="mt-2 font-semibold">{videoError}</p>
                 </div>
              )}
            </div>

            <MediaControlBar className="transition-opacity duration-200">
              <MediaPlayButton className="transform hover:scale-110 transition-transform"></MediaPlayButton>
              <MediaTimeDisplay></MediaTimeDisplay>
              <MediaTimeRange></MediaTimeRange>
              <MediaTimeDisplay showDuration></MediaTimeDisplay>
              <MediaMuteButton className="transform hover:scale-110 transition-transform"></MediaMuteButton>
              <MediaVolumeRange></MediaVolumeRange>
            </MediaControlBar>
          </MediaController>

          {/* Action Buttons Panel */}
          <div className="p-3 bg-gray-900/50 border-t border-gray-700/50">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handleBroadcastVideo}
                disabled={!videoLoaded}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-[0_0_15px_rgba(249,115,22,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center space-x-2 text-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
                <span className="hidden sm:inline">Share Video</span>
              </button>

              <button
                onClick={handleBroadcastCurrentFrame}
                disabled={!videoLoaded}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-[0_0_15px_rgba(16,185,129,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center space-x-2 text-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span className="hidden sm:inline">Broadcast Frame</span>
              </button>
            </div>
          </div>
        </div>

        {/* Event Panel */}
        {showEventPanel && (
          <div className="w-full lg:w-96 bg-gray-800/80 backdrop-blur-sm border-t lg:border-t-0 lg:border-l border-gray-700/50 flex flex-col">
            <div className="p-4 border-b border-gray-700/50">
              <h3 className="text-white font-bold text-lg mb-4">Event Panel</h3>
              <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 w-1 bg-blue-500 rounded-r-full"></div>
                  <p className="pl-4 text-gray-300 text-sm">Select an event to add frames.</p>
              </div>
              <div className="space-y-2 mb-4">
                {EVENT_TYPES.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event.id)}
                    className={`w-full p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-between shadow-lg ${
                      selectedEvent === event.id 
                        ? 'border-blue-400 bg-gray-700 shadow-blue-500/20' 
                        : 'border-gray-600/50 hover:border-gray-500 hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${event.color}`}></div>
                      <span className="text-white font-semibold">{event.name}</span>
                    </div>
                    <span className="text-gray-400 text-sm font-mono bg-gray-900/50 px-2 py-0.5 rounded">
                      {eventFrames[event.id].length}
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleAddToEvent}
                disabled={!selectedEvent || !videoLoaded}
                className="w-full p-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-[0_0_15px_rgba(59,130,246,0.6)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
                <span>Add Current Frame</span>
              </button>

              <button
                onClick={handleSubmitToDres}
                disabled={!selectedEvent || (eventFrames[selectedEvent]?.length === 0)}
                className="w-full mt-3 p-3 bg-gradient-to-r from-red-600 to-pink-500 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-[0_0_15px_rgba(220,38,38,0.6)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                <span>Submit to DRES</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {selectedEvent && (
                <div className="p-2">
                  <h4 className="text-gray-200 font-semibold mb-3">
                    Frames for {EVENT_TYPES.find(e => e.id === selectedEvent)?.name}
                  </h4>
                  
                  <div className="space-y-2">
                    {eventFrames[selectedEvent].map((frame, index) => (
                      <div key={frame.id} className="bg-gray-700/50 rounded-lg p-2 flex items-center space-x-3 transition-transform duration-200 hover:scale-102">
                        <img src={`http://localhost:1406/dataset/full/merge/${frame.videoId}/keyframes/${frame.thumbnail}`} alt={`Frame ${frame.timestamp}`} className="w-16 h-10 object-cover rounded shadow-md"/>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">Frame {frame.timestamp}</p>
                          <p className="text-gray-400 text-xs truncate">Video: {frame.videoId}</p>
                        </div>
                        <button
                          onClick={() => {
                            setEventFrames(prev => ({
                              ...prev,
                              [selectedEvent]: prev[selectedEvent].filter((_, i) => i !== index)
                            }));
                          }}
                          className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-red-500/20 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                        </button>
                      </div>
                    ))}
                    
                    {eventFrames[selectedEvent].length === 0 && (
                      <div className="text-gray-500 text-sm text-center py-10 border-2 border-dashed border-gray-700 rounded-lg">
                        <p>No frames added yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        media-controller {
          --media-primary-color: #3b82f6;
          --media-secondary-color: #ffffff;
          --media-control-background: rgba(20, 20, 20, 0.7);
          --media-control-bar-background: transparent;
          --media-control-hover-background: rgba(40, 40, 40, 0.8);
        }
        media-control-bar {
            background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
        }
        media-time-range {
          --media-range-track-background: #4a5568;
        }
        media-volume-range {
          width: 80px;
        }
      `}</style>
    </div>
  );
};

export default React.memo(VideoPanel);