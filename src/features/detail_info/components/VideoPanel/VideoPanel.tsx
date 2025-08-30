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

interface VideoPanelProps {
  videoId: string;
  timestamp: string;
  onClose: () => void;
  onBroadcast: (item: any) => void;
  currentUser: string;
}

const VideoPanel: React.FC<VideoPanelProps> = ({ 
  videoId, 
  timestamp, 
  onClose, 
  onBroadcast, 
  currentUser 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);

  const startTimeInSeconds = useMemo(() => frameIdToSeconds(timestamp, videoId), [timestamp, videoId]);

  const videoUrl = useMemo(() => {
    const mediaPlaylistName = `playlist.m3u8`;
    return `http://localhost:1406/video/${videoId}/${mediaPlaylistName}`;
  }, [videoId]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!videoRef.current) return;

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
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 1);
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
    }
  }, [isPlaying, duration, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    let hls: Hls | null = null;
    const videoElement = videoRef.current;

    if (videoElement) {
      // Video event listeners
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleTimeUpdate = () => setCurrentTime(videoElement.currentTime);
      const handleLoadedMetadata = () => setDuration(videoElement.duration);

      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('pause', handlePause);
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);

      if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(videoUrl);
        hls.attachMedia(videoElement);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoElement.currentTime = startTimeInSeconds;
          videoElement.play();
        });
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = videoUrl;
        videoElement.addEventListener('loadedmetadata', () => {
          videoElement.currentTime = startTimeInSeconds;
          videoElement.play();
        });
      }

      return () => {
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        if (hls) {
          hls.destroy();
        }
      };
    }
  }, [videoUrl, startTimeInSeconds]);

  const handleBroadcastCurrentFrame = async () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const frameRate = videoFrameRates[`${videoId}.mp4`] || 25.0;
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

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const newTime = (parseFloat(event.target.value) / 100) * duration;
      videoRef.current.currentTime = newTime;
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
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl mx-4 bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="ml-4 text-gray-300 font-medium">{videoId}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close video"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Video Container */}
        <div 
          className="relative bg-black"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <video
            ref={videoRef}
            className="w-full h-auto max-h-[70vh] object-contain"
            playsInline
            onClick={togglePlayPause}
          />

          {/* Custom Controls Overlay */}
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}>
            <button
              onClick={togglePlayPause}
              className="p-4 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              {isPlaying ? (
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.68L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Control Panel */}
        <div className="p-4 bg-gray-800 space-y-4">
          {/* Timeline */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300 font-mono">{formatTime(currentTime)}</span>
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="100"
                value={duration ? (currentTime / duration) * 100 : 0}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <span className="text-sm text-gray-300 font-mono">{formatTime(duration)}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Play/Pause */}
              <button
                onClick={togglePlayPause}
                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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

              {/* Skip buttons */}
              <button
                onClick={() => videoRef.current && (videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 1))}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="Skip back 1s (←)"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>

              <button
                onClick={() => videoRef.current && (videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 1))}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="Skip forward 1s (→)"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
              </button>

              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-600 rounded appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Broadcast Button */}
            <button
              onClick={handleBroadcastCurrentFrame}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
              <span>Broadcast Frame</span>
            </button>
          </div>

          {/* Keyboard Shortcuts Info */}
          <div className="text-xs text-gray-500 flex items-center space-x-4">
            <span>Shortcuts:</span>
            <span className="bg-gray-700 px-2 py-1 rounded">Space</span>
            <span>Play/Pause</span>
            <span className="bg-gray-700 px-2 py-1 rounded">←/→</span>
            <span>±1s</span>
            <span className="bg-gray-700 px-2 py-1 rounded">Esc</span>
            <span>Close</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1f2937;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1f2937;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default VideoPanel;