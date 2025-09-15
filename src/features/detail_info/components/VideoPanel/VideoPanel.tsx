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

type FilmstripWindowProps = {
  videoId: string;
  currentTime: number;
  startTime: number;
  duration: number;
  frameRate: number;
  onSeek: (time: number) => void;
  cache?: PreviewFrameCache;           // optional fallback
  slotCount?: number;
  stepSeconds?: number;
  liveThumbs: Array<{ time: number; url: string }>;  // <--- NEW
};

function findNearestThumb(live: FilmstripWindowProps["liveThumbs"], t: number) {
  if (!live.length) return undefined;
  // simple linear scan is fine for small buffers; binary search if you prefer
  let best = live[0], bestD = Math.abs(live[0].time - t);
  for (let i = 1; i < live.length; i++) {
    const d = Math.abs(live[i].time - t);
    if (d < bestD) { best = live[i]; bestD = d; }
  }
  return best;
}

function useLiveThumbnails(
  videoRef: React.RefObject<HTMLVideoElement|null>,
  {
    width = 160,         // thumbnail size
    height = 90,
    stepSec = 0.5,       // capture every 0.5s of media time
    max = 300            // keep last 300 captures
  } = {}
) {
  const [thumbs, setThumbs] = React.useState<Array<{ time: number; url: string }>>([]);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // IMPORTANT: to allow canvas drawImage on HLS frames
    // make sure your HLS/segment server sends proper CORS headers,
    // and keep crossOrigin="anonymous" on the <video>.
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    let lastCapture = -Infinity;
    let callbackId = 0;

    const loop: VideoFrameRequestCallback = (_now, meta) => {
      const t = meta.mediaTime ?? video.currentTime;

      // capture only if enough media time has passed and not seeking
      if (!video.seeking && (t - lastCapture) >= stepSec) {
        try {
          ctx.drawImage(video, 0, 0, width, height);
          const url = canvas.toDataURL('image/jpeg', 0.72);
          lastCapture = t;
          setThumbs(prev => {
            const next = [...prev, { time: t, url }];
            // drop old frames to stay memory-friendly
            if (next.length > max) next.splice(0, next.length - max);
            return next;
          });
        } catch {
          // canvas can be tainted if CORS is wrong
          // (ensure Access-Control-Allow-Origin on your segment requests)
        }
      }
      callbackId = (video as any).requestVideoFrameCallback(loop);
    };

    // start loop
    callbackId = (video as any).requestVideoFrameCallback(loop);

    return () => {
      try { (video as any).cancelVideoFrameCallback?.(callbackId); } catch {}
    };
  }, [videoRef, width, height, stepSec, max]);

  return thumbs; // [{time, url}, ...]
}


const FilmstripWindow: React.FC<FilmstripWindowProps> = ({
  videoId,
  currentTime,
  startTime,
  duration,
  frameRate,
  onSeek,
  cache,                 // optional (not used for thumbs now, but kept for warm-preload if you want)
  slotCount = 12,
  stepSeconds = 0.5,
  liveThumbs,            // <-- use live thumbs from hook
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tiles, setTiles] = useState<Array<{ time: number; frameId: number }>>([]);

  // we advance the window when playhead crosses the next step index
  const lastIndexRef = useRef<number>(-1);

  const buildWindow = useCallback((anchorTime: number) => {
    const clampedAnchor = Math.max(0, Math.min(duration, anchorTime));
    const arr: Array<{ time: number; frameId: number }> = [];
    for (let i = 0; i < slotCount; i++) {
      const t = Math.min(duration, clampedAnchor + i * stepSeconds);
      const frameId = Math.floor(t * frameRate);
      arr.push({ time: t, frameId });
    }
    setTiles(arr);

    // Optional: still warm the backend cache around the tail (kept if you broadcast using keyframes)
    if (cache) {
      const tailFrame = Math.floor(arr[Math.max(0, arr.length - 1)].time * frameRate);
      cache.preloadFrames(videoId, tailFrame, 40);
    }
  }, [videoId, duration, frameRate, slotCount, stepSeconds, cache]);

  // initial window anchored at provided startTime
  useEffect(() => {
    const initialIndex = Math.floor(startTime / stepSeconds);
    lastIndexRef.current = initialIndex;
    buildWindow(initialIndex * stepSeconds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // auto-slide the window forward when we cross the next step index
  useEffect(() => {
    if (duration <= 0) return;
    const idx = Math.floor(currentTime / stepSeconds);
    if (idx !== lastIndexRef.current) {
      lastIndexRef.current = idx;
      const newAnchor = idx * stepSeconds;          // left edge of window
      buildWindow(newAnchor);
    }
  }, [currentTime, duration, stepSeconds, buildWindow]);

  // drag scrubbing within the window
  const isDragging = useRef(false);
  const timeAtClientX = (clientX: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    // map x to [anchor, anchor + (slotCount-1)*stepSeconds]
    const anchor = lastIndexRef.current * stepSeconds;
    const span = (slotCount - 1) * stepSeconds;
    const t = anchor + (rect.width === 0 ? 0 : (x / rect.width) * span);
    return Math.max(0, Math.min(duration, t));
  };

  const onDown = (e: React.MouseEvent) => { isDragging.current = true; onSeek(timeAtClientX(e.clientX)); };
  const onMove = (e: React.MouseEvent) => { if (isDragging.current) onSeek(timeAtClientX(e.clientX)); };
  const onUp   = () => { isDragging.current = false; };
  const onLeave= () => { isDragging.current = false; };

  // playhead % inside the current window
  const anchor = lastIndexRef.current * stepSeconds;
  const span = (slotCount - 1) * stepSeconds || 1;
  const localPct = Math.min(100, Math.max(0, ((currentTime - anchor) / span) * 100));

  return (
    <div className="bg-gray-900 border-y border-gray-700 p-3">
      <div
        ref={containerRef}
        className="relative w-full select-none rounded-xl overflow-hidden bg-black"
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onLeave}
      >
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${slotCount}, minmax(0, 1fr))` }}
        >
          {tiles.map((t, i) => {
            const nearest = findNearestThumb(liveThumbs, t.time);
            const url = nearest?.url;
            return (
              <div key={`${t.frameId}-${i}`} className="relative">
                {url ? (
                  <img
                    src={url}
                    alt={`t=${Math.floor(t.time)}s`}
                    className="h-20 w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="h-20 bg-gray-700/60 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* blue playhead within the window */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-blue-400"
          style={{ left: `${localPct}%` }}
        />

        {/* edge glow to hint "windowed" */}
        <div className="pointer-events-none absolute inset-0 ring-2 ring-yellow-400/70 rounded-xl" />
      </div>
      <div className="mt-1 text-xs text-gray-400">Auto-advances as the video plays</div>
    </div>
  );
};


// Preview frame cache management
class PreviewFrameCache {
  private cache = new Map<string, string>();
  private loadingPromises = new Map<string, Promise<string>>();
  private maxCacheSize = 100; // Limit cache size

  async getFrame(videoId: string, frameId: number): Promise<string> {
    const key = `${videoId}-${frameId}`;
    
    // Return cached frame immediately
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    // Return existing loading promise to avoid duplicate requests
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)!;
    }

    // Create new loading promise
    const loadPromise = this.loadFrame(videoId, frameId);
    this.loadingPromises.set(key, loadPromise);

    try {
      const result = await loadPromise;
      this.cache.set(key, result);
      
      // Manage cache size
      if (this.cache.size > this.maxCacheSize) {
        const firstKey = this.cache.keys().next().value;
        if (!firstKey){
        } else{
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
    // Preload frames in background without blocking UI
    for (let i = -range; i <= range; i++) {
      const frameId = Math.max(0, centerFrameId + i);
      this.getFrame(videoId, frameId).catch(() => {}); // Silent fail for preloading
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
}

const VideoPanel: React.FC<VideoPanelProps> = ({ 
  videoId, 
  timestamp, 
  onClose, 
  onBroadcast, 
  currentUser 
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

    // Create preview slots immediately with loading state
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

    // Load thumbnails asynchronously
    const loadPromises = newPreviews.map(async (preview, index) => {
      try {
        const thumbnail = await previewCacheRef.current.getFrame(videoId, preview.frameId);
        return { index, thumbnail, loading: false };
      } catch (error) {
        return { index, thumbnail: '', loading: false };
      }
    });

    // Update previews as they load
    loadPromises.forEach(async (promise) => {
      const result = await promise;
      setPreviewFrames(prev => prev.map((item, i) => 
        i === result.index 
          ? { ...item, thumbnail: result.thumbnail, loading: result.loading }
          : item
      ));
    });

    // Preload nearby frames for smooth scrolling
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
    
    // Clear existing timeout
    if (updatePreviewsDebounced.current) {
      clearTimeout(updatePreviewsDebounced.current);
    }
    
    // Debounce preview updates
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

  // Video initialization with better error handling
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Clear any existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Clear cache for new video
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
      // Initial preview load
      updatePreviews(startTimeInSeconds);
    };
    const handleError = () => {
      setVideoError('Failed to load video');
      setVideoLoaded(false);
    };

    // Add event listeners
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('error', handleError);

    // Initialize HLS or native video
    if (Hls.isSupported()) {
      hlsRef.current = new Hls({
        enableWorker: false, // Disable worker for better compatibility
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

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current && videoLoaded) {
      const newTime = (parseFloat(event.target.value) / 100) * duration;
      videoRef.current.currentTime = newTime;
      
      // Clear existing timeout
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

  const handlePreviewClick = (index: number) => {
    if (videoRef.current && videoLoaded && previewFrames[index]) {
      const targetTime = previewFrames[index].time;
      videoRef.current.currentTime = targetTime;
      updatePreviews(targetTime);
    }
  };
// inside VideoPanel component

  const liveThumbs = useLiveThumbnails(videoRef, {
    width: 180,     // tune to taste
    height: 100,
    stepSec: 0.5,   // same spacing you use for tiles
    max: 400,
  });
  

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
            {!videoLoaded && !videoError && (
              <span className="ml-2 text-yellow-400 text-sm">Loading...</span>
            )}
            {videoError && (
              <span className="ml-2 text-red-400 text-sm">{videoError}</span>
            )}
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
          ref={videoContainerRef}
          className="relative bg-black"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <video
  ref={videoRef}
  className="w-full h-auto max-h-[60vh] object-contain"
  playsInline
  crossOrigin="anonymous"      // <-- allow canvas capture
  onClick={togglePlayPause}
  style={{ display: videoError ? 'none' : 'block' }}
/>

          {/* Error Display */}
          {videoError && (
            <div className="w-full h-64 flex items-center justify-center text-red-400">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <p className="text-lg font-medium">{videoError}</p>
                <p className="text-sm text-gray-500 mt-2">Please check the video source</p>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {!videoLoaded && !videoError && (
            <div className="w-full h-64 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Loading video...</p>
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
          )}

          {/* Scroll Indicator */}
          {videoLoaded && (
            <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
              Scroll to seek ±{scrollSensitivity}s
            </div>
          )}
        </div>

        <FilmstripWindow
  videoId={videoId}
  currentTime={currentTime}
  startTime={startTimeInSeconds}
  duration={duration}
  frameRate={frameRate}
  onSeek={(t) => {
    if (!videoRef.current || !videoLoaded) return;
    const clamped = Math.max(0, Math.min(duration, t));
    videoRef.current.currentTime = clamped;
    // (Optional) still warm the server cache for Broadcast button
    previewCacheRef.current.preloadFrames(videoId, Math.floor(clamped * frameRate), 30);
    setCurrentTime(clamped);
  }}
  cache={previewCacheRef.current}   // optional (kept because your Broadcast uses keyframes)
  liveThumbs={liveThumbs}           // <-- add this
  // slotCount={12}
  // stepSeconds={0.5}
/>



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
                disabled={!videoLoaded}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50"
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
                disabled={!videoLoaded}
                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                onClick={() => {
                  if (videoRef.current && videoLoaded) {
                    const newTime = Math.max(0, videoRef.current.currentTime - 1);
                    videoRef.current.currentTime = newTime;
                    updatePreviews(newTime);
                  }
                }}
                disabled={!videoLoaded}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                title="Skip back 1s (←)"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>

              <button
                onClick={() => {
                  if (videoRef.current && videoLoaded) {
                    const newTime = Math.min(duration, videoRef.current.currentTime + 1);
                    videoRef.current.currentTime = newTime;
                    updatePreviews(newTime);
                  }
                }}
                disabled={!videoLoaded}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
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

              {/* Scroll Sensitivity Control */}
              <div className="flex items-center space-x-2">
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

            {/* Broadcast Button */}
            <button
              onClick={handleBroadcastCurrentFrame}
              disabled={!videoLoaded}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
            <span className="bg-gray-700 px-2 py-1 rounded">Scroll</span>
            <span>Seek</span>
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