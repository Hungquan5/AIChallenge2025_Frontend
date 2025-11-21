import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import type { ResultItem } from '../../../results/types';
import type { WebSocketMessage } from '../../../communicate/types';
import frameRates from '../../../../assets/video_fps.json';
import { fullTrakeSubmissionFlow } from '../../../submit/components/SubmitAPI';

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

const EVENT_TYPES = [
    { id: 'event1', name: 'Event 1', color: 'bg-red-500', borderColor: 'border-red-400', shadowColor: 'shadow-red-500/20' },
    { id: 'event2', name: 'Event 2', color: 'bg-blue-500', borderColor: 'border-blue-400', shadowColor: 'shadow-blue-500/20' },
    { id: 'event3', name: 'Event 3', color: 'bg-green-500', borderColor: 'border-green-400', shadowColor: 'shadow-green-500/20' },
    { id: 'event4', name: 'Event 4', color: 'bg-yellow-500', borderColor: 'border-yellow-400', shadowColor: 'shadow-yellow-500/20' },
    { id: 'event5', name: 'Event 5', color: 'bg-purple-500', borderColor: 'border-purple-400', shadowColor: 'shadow-purple-500/20' },
];

interface VideoPanelProps {
  videoId: string;
  timestamp: string;
  onClose: () => void;
  onBroadcast: (item: any) => void;
  currentUser: string;
  sendMessage?: (message: string) => void;
  lastMessage: WebSocketMessage | null;
}

const VideoPanel: React.FC<VideoPanelProps> = ({
  videoId,
  timestamp,
  onClose,
  onBroadcast,
  currentUser,
  sendMessage = () => {},
  lastMessage,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const scrubbingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wheelAccumulatorRef = useRef<number>(0);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [showEventPanel, setShowEventPanel] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventFrames, setEventFrames] = useState<{ [key: string]: ResultItem[] }>({
    event1: [], event2: [], event3: [], event4: [], event5: [],
  });

  useEffect(() => {
    if (
      lastMessage?.type === 'event_list_updated' &&
      lastMessage.payload?.videoId === videoId
    ) {
      setEventFrames(lastMessage.payload.eventFrames);
    }
  }, [lastMessage, videoId]);

  const startTimeInSeconds = useMemo(() => frameIdToSeconds(timestamp, videoId), [timestamp, videoId]);
  const frameRate = useMemo(() => videoFrameRates[`${videoId}.mp4`] || 25.0, [videoId]);

  const videoUrl = useMemo(() => {
    const mediaPlaylistName = `playlist.m3u8`;
    return `http://localhost:1407/video/${videoId}/${mediaPlaylistName}`;
  }, [videoId]);
  
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setCurrentFrame(Math.floor(videoRef.current.currentTime * frameRate));
    }
  }, [frameRate]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Number(e.target.value);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
    setIsMuted(newVolume === 0);
  };
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (!isMuted) {
          setVolume(0);
      } else {
          setVolume(0.5);
          videoRef.current.volume = 0.5
      }
    }
  };

  const togglePlaybackSpeed = () => {
    const newRate = playbackRate === 1 ? 2 : 1;
    setPlaybackRate(newRate);
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);


  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onDurationChange = () => setDuration(video.duration);
    const onVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [handleTimeUpdate]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!videoRef.current || !videoLoaded) return;
    if (event.target instanceof HTMLInputElement) return;
    const video = videoRef.current;
    switch (event.code) {
      case 'Space': event.preventDefault(); togglePlay(); break;
      case 'ArrowLeft': event.preventDefault(); video.currentTime = Math.max(0, video.currentTime - (event.shiftKey ? 5 : 1)); break;
      case 'ArrowRight': event.preventDefault(); video.currentTime = Math.min(video.duration, video.currentTime + (event.shiftKey ? 5 : 1)); break;
      case 'ArrowUp': event.preventDefault(); video.volume = Math.min(1, video.volume + 0.1); break;
      case 'ArrowDown': event.preventDefault(); video.volume = Math.max(0, video.volume - 0.1); break;
      case 'KeyM': event.preventDefault(); toggleMute(); break;
      case 'Escape': event.preventDefault(); onClose(); break;
    }
  }, [onClose, videoLoaded, togglePlay, toggleMute]);

  const handleWheel = useCallback((event: WheelEvent) => {
    if (!videoRef.current || !videoLoaded) return;
    event.preventDefault();
    const video = videoRef.current;
    if (!video.paused) video.pause();
    if (scrubbingTimeoutRef.current) clearTimeout(scrubbingTimeoutRef.current);
    setIsScrubbing(true);
    wheelAccumulatorRef.current += event.deltaY;
    const framesToSeek = Math.floor(Math.abs(wheelAccumulatorRef.current) / 50);
    if (framesToSeek >= 1) {
      const direction = wheelAccumulatorRef.current > 0 ? -1 : 1;
      const timeIncrement = (framesToSeek * direction) / frameRate;
      video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + timeIncrement));
      wheelAccumulatorRef.current %= 50;
    }
    scrubbingTimeoutRef.current = setTimeout(() => {
      setIsScrubbing(false);
      wheelAccumulatorRef.current = 0;
    }, 300);
  }, [videoLoaded, frameRate]);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const videoContainer = videoContainerRef.current;
    if (videoLoaded && videoContainer) {
      videoContainer.addEventListener('wheel', handleWheel, { passive: false });
      return () => videoContainer.removeEventListener('wheel', handleWheel);
    }
  }, [videoLoaded, handleWheel]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (hlsRef.current) hlsRef.current.destroy();
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
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [videoUrl, startTimeInSeconds]);

  const handleBroadcastCurrentFrame = async () => {
    if (videoRef.current && videoLoaded) {
      const currentTime = videoRef.current.currentTime;
      const frameId = Math.floor(currentTime * frameRate);
      try {
        const response = await fetch(`http://localhost:9991/keyframes/nearest?video_id=${videoId}&frame_index=${frameId}`);
        if (!response.ok) throw new Error('Failed to fetch nearest keyframe');
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

  const clearAndSyncEvent = (eventId: string) => {
    const clearedEventFrames = { ...eventFrames, [eventId]: [] };
    setEventFrames(clearedEventFrames);
    const syncMessage = {
      type: 'event_list_updated',
      payload: { videoId, eventFrames: clearedEventFrames, submittedBy: currentUser }
    };
    sendMessage(JSON.stringify(syncMessage));
  };
  
  // ✅ NEW: Helper to clear ALL events and sync
  const clearAndSyncAllEvents = () => {
    // Create a new object with the same keys but empty arrays for values
    const clearedEventFrames = Object.keys(eventFrames).reduce((acc, key) => {
        acc[key] = [];
        return acc;
    }, {} as { [key: string]: ResultItem[] });

    setEventFrames(clearedEventFrames);
    const syncMessage = {
        type: 'event_list_updated',
        payload: { videoId, eventFrames: clearedEventFrames, submittedBy: currentUser }
    };
    sendMessage(JSON.stringify(syncMessage));
  };

  const handleSubmitTrakeToDres = async () => {
    if (!selectedEvent) return alert('Please select an event first');
    const framesToSubmit = eventFrames[selectedEvent];
    if (framesToSubmit.length === 0) return alert('No frames to submit for this event.');
    setIsSubmitting(true);
    try {
      await fullTrakeSubmissionFlow(videoId, framesToSubmit);
      alert(`Successfully submitted ${framesToSubmit.length} frames from ${selectedEvent} as TRAKE.`);
      clearAndSyncEvent(selectedEvent);
    } catch (error: any) {
      console.error('TRAKE submission failed:', error);
      alert(`TRAKE submission failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ REWORKED: Function to submit all events with frames in a SINGLE request
  const handleSubmitAllEventsToDres = async () => {
    // 1. Flatten all frames from all events into a single array.
    const allFramesToSubmit = Object.values(eventFrames).flat();

    // 2. Check if there are any frames to submit.
    if (allFramesToSubmit.length === 0) {
      alert('No frames in any event to submit.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 3. Call the submission flow ONCE with the combined list of frames.
      await fullTrakeSubmissionFlow(videoId, allFramesToSubmit);

      alert(`Successfully submitted ${allFramesToSubmit.length} frames from all events as a single TRAKE submission.`);
      
      // 4. Clear all events and sync with others upon success.
      clearAndSyncAllEvents();

    } catch (error: any) {
      console.error('Combined TRAKE submission failed:', error);
      alert(`Combined TRAKE submission failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
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
      if (!response.ok) throw new Error('Failed to fetch nearest keyframe');
      const keyframe = await response.json();
      const newFrame: ResultItem = {
        id: `${keyframe.video_id}-${frameId}-${Date.now()}`,
        videoId: keyframe.video_id,
        timestamp: frameId.toString(),
        thumbnail: keyframe.filename,
        filename: keyframe.filename,
        title: `${keyframe.video_id}-${frameId}`,
        confidence: 1,
        submittedBy: currentUser,
      };
      const newEventFrames = {
        ...eventFrames,
        [selectedEvent]: [...eventFrames[selectedEvent], newFrame],
      };
      setEventFrames(newEventFrames);
      const message = {
        type: 'event_list_updated',
        payload: { videoId, eventFrames: newEventFrames, submittedBy: currentUser },
      };
      sendMessage(JSON.stringify(message));
    } catch (error) {
      console.error('Error adding frame to event:', error);
    }
  };

  const handleRemoveFrame = (eventKey: string, frameIndex: number) => {
    const updatedFrames = eventFrames[eventKey].filter((_, i) => i !== frameIndex);
    const newEventFrames = { ...eventFrames, [eventKey]: updatedFrames };
    setEventFrames(newEventFrames);
    const message = {
      type: 'event_list_updated',
      payload: { videoId, eventFrames: newEventFrames, submittedBy: currentUser }
    };
    sendMessage(JSON.stringify(message));
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const hasFramesToSubmit = useMemo(() => 
    Object.values(eventFrames).some(frames => frames.length > 0),
    [eventFrames]
  );

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-2 sm:p-4">
      <div className="relative w-full h-full max-w-7xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-gray-700/50">
        
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-900/80 border-b border-gray-700/50 backdrop-blur-sm">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <div className="flex space-x-1.5">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-500 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 flex-1 min-w-0">
                <span className="text-gray-200 font-semibold text-sm sm:text-base truncate">{videoId}</span>
                <span className="text-xs text-gray-400 font-mono">Frame: {currentFrame}</span>
              </div>
              {isScrubbing && (
                <span className="hidden sm:inline ml-2 text-xs font-semibold text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded-full animate-pulse">
                  Scrubbing
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setShowEventPanel(!showEventPanel)}
                className="px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-[0_0_15px_rgba(167,139,250,0.6)] text-xs sm:text-sm font-semibold"
              >
                <span className="hidden sm:inline">{showEventPanel ? 'Hide' : 'Show'} Events</span>
                <span className="sm:hidden">📋</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
                aria-label="Close video"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
            
          <div 
            ref={videoContainerRef}
            className="relative bg-black flex-1 w-full overflow-hidden group"
          >
            <video
              ref={videoRef}
              className="w-full h-full object-contain transition-opacity duration-300"
              playsInline
              crossOrigin="anonymous"
              style={{ opacity: videoLoaded ? 1 : 0 }}
              onClick={togglePlay}
            />
            
            {isScrubbing && (
              <div className="absolute top-4 right-4 bg-blue-500/90 text-white px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm animate-pulse">
                <span className="text-sm font-semibold">🎬 Frame {currentFrame}</span>
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {!videoLoaded && !videoError && (
                 <div className="flex flex-col items-center text-white">
                    <svg className="w-12 h-12 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-3 animate-pulse text-sm">Loading Video...</p>
                 </div>
              )}
              {videoError && (
                 <div className="flex flex-col items-center text-red-400 p-4 bg-red-900/20 rounded-lg max-w-md mx-4">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="mt-2 font-semibold text-center">{videoError}</p>
                 </div>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 sm:p-4 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                <div className="flex items-center gap-3 text-white">
                    <button onClick={togglePlay} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                      {isPlaying ? 
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg> :
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                      }
                    </button>
                    
                    <span className="text-sm font-mono">{formatTime(currentTime)}</span>
                    <input type="range" min="0" max={duration} value={currentTime} onChange={handleSeek} className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer range-thumb" />
                    <span className="text-sm font-mono">{formatTime(duration)}</span>

                    <button onClick={togglePlaybackSpeed} className="px-2.5 py-1 rounded-md hover:bg-white/10 transition-colors text-sm font-mono w-16 text-center" title="Toggle playback speed">
                      {playbackRate}x
                    </button>

                    <div className="flex items-center gap-2">
                        <button onClick={toggleMute} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                          {isMuted || volume === 0 ? 
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" /></svg> :
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                          }
                        </button>
                        <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer range-thumb" />
                    </div>
                </div>
            </div>
          </div>

          <div className="p-2 sm:p-3 bg-gray-900/80 border-t border-gray-700/50 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-4">
              <button onClick={handleBroadcastVideo} disabled={!videoLoaded} className="px-3 sm:px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-[0_0_15px_rgba(249,115,22,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center space-x-2 text-xs sm:text-sm">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
                <span>Share Video</span>
              </button>
              <button onClick={handleBroadcastCurrentFrame} disabled={!videoLoaded} className="px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-[0_0_15px_rgba(16,185,129,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center space-x-2 text-xs sm:text-sm">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>Broadcast Frame</span>
              </button>
            </div>
            <div className="mt-2 text-center text-xs text-gray-500">
              <span className="hidden sm:inline">Space: Play/Pause • ←/→: Seek • Shift+←/→: Seek 5s • Scroll: Frame-by-frame • ESC: Close</span>
            </div>
          </div>
        </div>

        {showEventPanel && (
           <div className="w-full lg:w-96 bg-gray-800/90 backdrop-blur-sm border-t lg:border-t-0 lg:border-l border-gray-700/50 flex flex-col max-h-[50vh] lg:max-h-none">
           <div className="p-3 sm:p-4 border-b border-gray-700/50">
             <h3 className="text-white font-bold text-base sm:text-lg mb-3 flex items-center">
               <span className="mr-2">🎯</span> Event Panel
             </h3>
             <div className="relative mb-4 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                 <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-full"></div>
                 <p className="pl-4 text-gray-300 text-xs sm:text-sm">Select an event, add frames, then submit individually or all at once.</p>
             </div>
             
             <div className="space-y-2 mb-3">
               {EVENT_TYPES.map((event) => (
                 <button key={event.id} onClick={() => setSelectedEvent(event.id)} className={`w-full p-2.5 sm:p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-between ${ selectedEvent === event.id ? `${event.borderColor} bg-gray-700/80 ${event.shadowColor} shadow-lg scale-[1.02]` : 'border-gray-600/50 hover:border-gray-500 hover:bg-gray-700/50' }`}>
                   <div className="flex items-center space-x-2 sm:space-x-3">
                     <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${event.color} ${selectedEvent === event.id ? 'animate-pulse' : ''}`}></div>
                     <span className="text-white font-semibold text-sm sm:text-base">{event.name}</span>
                   </div>
                   <span className="text-gray-400 text-xs sm:text-sm font-mono bg-gray-900/50 px-2 py-0.5 rounded">
                     {eventFrames[event.id].length}
                   </span>
                 </button>
               ))}
             </div>

             <div className="space-y-2">
               <button onClick={handleAddToEvent} disabled={!selectedEvent || !videoLoaded} className="w-full p-2.5 sm:p-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-[0_0_15px_rgba(59,130,246,0.6)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm">
                 <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
                 <span>Add Current Frame</span>
               </button>

               <button onClick={handleSubmitTrakeToDres} disabled={!selectedEvent || (eventFrames[selectedEvent]?.length === 0) || isSubmitting} className="w-full p-2.5 sm:p-3 bg-gradient-to-r from-red-600 to-pink-500 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-[0_0_15px_rgba(220,38,38,0.6)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm">
                 {isSubmitting ? (
                   <><svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Submitting...</span></>
                 ) : (
                   <><svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg><span>Submit Selected Event</span></>
                 )}
               </button>
               
               <button onClick={handleSubmitAllEventsToDres} disabled={!hasFramesToSubmit || isSubmitting} className="w-full p-2.5 sm:p-3 bg-gradient-to-r from-teal-500 to-green-600 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-[0_0_15px_rgba(20,184,166,0.6)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm">
                  {isSubmitting ? (
                    <><svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Submitting...</span></>
                  ) : (
                    <>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2 12.5C2 17.15 5.85 21 10.5 21S19 17.15 19 12.5 15.15 4 10.5 4 2 7.85 2 12.5zM10.5 23C4.7 23 0 18.3 0 12.5S4.7 2 10.5 2 21 6.7 21 12.5 16.3 23 10.5 23zm4.2-11.3L12 14.4l-2.7-2.7L7.9 13l4.1 4.1 5.8-5.8-1.4-1.4z"/></svg>
                      <span>Submit All Events</span>
                    </>
                  )}
               </button>
             </div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-2 sm:p-3">
             {selectedEvent ? (
               <div>
                 <div className="flex items-center justify-between mb-3 sticky top-0 bg-gray-800/95 backdrop-blur-sm py-2 z-10 border-b border-gray-700/50">
                   <h4 className="text-gray-200 font-semibold text-sm flex items-center">
                     <span className={`w-2 h-2 rounded-full ${EVENT_TYPES.find(e => e.id === selectedEvent)?.color} mr-2`}></span>
                     {EVENT_TYPES.find(e => e.id === selectedEvent)?.name}
                   </h4>
                   {eventFrames[selectedEvent].length > 0 && (
                     <button onClick={() => { if (confirm(`Clear all ${eventFrames[selectedEvent].length} frames from this event?`)) { clearAndSyncEvent(selectedEvent); } }} className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded transition-colors">
                       Clear All
                     </button>
                   )}
                 </div>
                 
                 <div className="space-y-2">
                   {eventFrames[selectedEvent].map((frame, index) => (
                     <div key={frame.id} className="bg-gradient-to-r from-gray-700/50 to-gray-700/30 rounded-lg p-2 flex items-center space-x-2 sm:space-x-3 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border border-gray-600/30 hover:border-gray-500/50 group">
                       <div className="relative flex-shrink-0">
                         <img src={`http://localhost:1407/dataset/${frame.videoId}/keyframes/${frame.thumbnail}`} alt={`Frame ${frame.timestamp}`} className="w-16 h-10 sm:w-20 sm:h-12 object-cover rounded shadow-md border border-gray-600/50" />
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded"></div>
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="text-white text-xs sm:text-sm font-semibold truncate">Frame {frame.timestamp}</p>
                         <p className="text-gray-400 text-xs truncate">{frame.videoId}</p>
                         <p className="text-gray-500 text-xs mt-0.5">#{index + 1}</p>
                       </div>
                       <button onClick={() => handleRemoveFrame(selectedEvent, index)} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/20 transition-all duration-200 flex-shrink-0 opacity-0 group-hover:opacity-100" title="Remove frame">
                         <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                       </button>
                     </div>
                   ))}
                   
                   {eventFrames[selectedEvent].length === 0 && (
                     <div className="text-gray-500 text-xs sm:text-sm text-center py-8 sm:py-12 border-2 border-dashed border-gray-700 rounded-lg bg-gray-800/30">
                       <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                       </svg>
                       <p className="font-medium">No frames added yet</p>
                       <p className="text-xs mt-1 text-gray-600">Add frames to create a submission</p>
                     </div>
                   )}
                 </div>
               </div>
             ) : (
               <div className="flex items-center justify-center h-full text-gray-500 text-sm text-center p-4">
                 <div>
                   <svg className="w-16 h-16 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                   </svg>
                   <p className="font-medium">Select an event to begin</p>
                   <p className="text-xs mt-1">Choose an event type from above</p>
                 </div>
               </div>
             )}
           </div>
         </div>
        )}
      </div>

      <style>{`
        .range-thumb::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; background: #3b82f6; border-radius: 50%; cursor: pointer; margin-top: -6px; transition: background 0.2s; }
        .range-thumb::-moz-range-thumb { width: 14px; height: 14px; background: #3b82f6; border-radius: 50%; cursor: pointer; }
        .range-thumb:hover::-webkit-slider-thumb { background: #60a5fa; }
        .range-thumb:hover::-moz-range-thumb { background: #60a5fa; }
        .overflow-y-auto::-webkit-scrollbar { width: 6px; }
        .overflow-y-auto::-webkit-scrollbar-track { background: rgba(31, 41, 55, 0.5); border-radius: 3px; }
        .overflow-y-auto::-webkit-scrollbar-thumb { background: rgba(75, 85, 99, 0.8); border-radius: 3px; }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover { background: rgba(107, 114, 128, 1); }
      `}</style>
    </div>
  );
};

export default React.memo(VideoPanel);