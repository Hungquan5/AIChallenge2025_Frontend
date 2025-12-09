import React, { useEffect, useState } from 'react';

interface SharedVideoNotificationProps {
  videoId: string;
  timestamp: number;
  submittedBy: string;
  message: string;
  onWatch: (videoId: string, timestamp: string) => void;
  onDismiss: () => void;
}

const SharedVideoNotification: React.FC<SharedVideoNotificationProps> = ({
  videoId,
  timestamp,
  submittedBy,
  message,
  onWatch,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto dismiss after 10 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Wait for fade out animation
    }, 10000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleWatch = () => {
    const frameId = Math.floor(timestamp * 25); // Assuming 25fps default
    onWatch(videoId, frameId.toString());
  };

  if (!isVisible) return null;

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm bg-gradient-to-r from-blue-600 to-purple-600 
      text-white rounded-lg shadow-2xl border border-blue-500/30 backdrop-blur-sm
      transform transition-all duration-300 ease-out
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Video Shared</span>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="text-white/70 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-white/90 mb-3">{message}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/70">Video:</span>
            <span className="font-mono bg-white/20 px-2 py-1 rounded">{videoId}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/70">Time:</span>
            <span className="font-mono bg-white/20 px-2 py-1 rounded">{formatTime(timestamp)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/70">From:</span>
            <span className="font-medium">{submittedBy}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleWatch}
            className="flex-1 bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.68L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/>
            </svg>
            <span>Watch</span>
          </button>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/20 rounded-b-lg overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-white/40 to-white/60 rounded-b-lg"
          style={{
            animation: 'progress 10s linear forwards'
          }}
        ></div>
      </div>

      <style>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default SharedVideoNotification;