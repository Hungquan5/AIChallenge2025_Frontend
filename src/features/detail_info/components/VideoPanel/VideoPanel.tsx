// src/features/results/components/VideoPanel.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import '@mux/mux-player';
import {
  overlayClass,
  modalClass,
  closeButtonClass,
  playerWrapperClass,
  playerClass,
} from './styles';

const frameIdToSeconds = (frameId: string, frameRate: number): number => {
  const frameNumber = parseInt(frameId, 10);
  if (isNaN(frameNumber) || frameRate <= 0) {
    return 0;
  }
  return frameNumber / frameRate;
};

interface VideoPanelProps {
  videoId: string;
  timestamp: string; // This is the frame ID
  onClose: () => void;
}

const VideoPanel: React.FC<VideoPanelProps> = ({ videoId, timestamp, onClose }) => {
  const muxPlayerRef = useRef<any>(null);

  const videoUrl = useMemo(() => {
    const startTimeInSeconds = frameIdToSeconds(timestamp, 25);
    const mediaPlaylistName = `${videoId}_720p.m3u8`;
    return `http://localhost:1406/video/${videoId}/${mediaPlaylistName}?start=${startTimeInSeconds}`;
  }, [videoId, timestamp]);

  useEffect(() => {
    const player = muxPlayerRef.current;
    if (player) {
      player.addEventListener('loadedmetadata', () => {
        const url = new URL(videoUrl, window.location.href);
        const startParam = url.searchParams.get('start');
        if (startParam) {
          player.currentTime = parseFloat(startParam);
        }
        player.play();
      });
    }
  }, [videoUrl]);

  return (
    <div className={overlayClass}>
      <div className={modalClass}>
        <button onClick={onClose} className={closeButtonClass} aria-label="Close video">
          ×
        </button>
        <div className={playerWrapperClass}>
          <mux-player
            ref={muxPlayerRef}
            stream-type="on-demand"
            src={videoUrl}
            primary-color="#06b6d4"
            secondary-color="#ffffff"
            autoplay
            muted
            playsinline
            class={playerClass}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoPanel;
