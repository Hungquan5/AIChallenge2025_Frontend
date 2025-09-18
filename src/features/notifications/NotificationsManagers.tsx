import React, { useState, useCallback } from 'react';
import SharedVideoNotification from '../detail_info/components/VideoPanel/ShareVideoNotifications';

interface Notification {
  id: string;
  type: 'video_share' | 'event_frame' | 'dres_submission';
  videoId?: string;
  timestamp?: number;
  submittedBy: string;
  message: string;
  createdAt: number;
  eventId?: string;
  frameCount?: number;
}

interface NotificationManagerProps {
  onOpenVideo: (videoId: string, timestamp: string) => void;
}

interface UseNotificationManagerReturn {
  notifications: Notification[];
  NotificationContainer: React.FC<NotificationManagerProps>;
  showVideoNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  showEventFrameNotification: (eventId: string, submittedBy: string) => void;
  showDresSubmissionNotification: (submission: any) => void;
  dismissNotification: (id: string) => void;
}

export const useNotificationManager = (): UseNotificationManagerReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showVideoNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `video-${Date.now()}-${Math.random()}`,
      createdAt: Date.now(),
    };
    
    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const showEventFrameNotification = useCallback((eventId: string, submittedBy: string) => {
    const notification: Notification = {
      id: `event-${Date.now()}-${Math.random()}`,
      type: 'event_frame',
      eventId,
      submittedBy,
      message: `${submittedBy} added a frame to ${eventId}`,
      createdAt: Date.now(),
    };
    
    setNotifications(prev => [...prev, notification]);
  }, []);

  const showDresSubmissionNotification = useCallback((submission: any) => {
    const notification: Notification = {
      id: `dres-${Date.now()}-${Math.random()}`,
      type: 'dres_submission',
      eventId: submission.eventId,
      frameCount: submission.frameCount,
      submittedBy: submission.submittedBy,
      message: `${submission.submittedBy} submitted ${submission.frameCount} frames from ${submission.eventId} to DRES`,
      createdAt: Date.now(),
    };
    
    setNotifications(prev => [...prev, notification]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const NotificationContainer: React.FC<NotificationManagerProps> = ({ onOpenVideo }) => {
    return (
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {notifications.map((notification, index) => {
          if (notification.type === 'video_share' && notification.videoId && notification.timestamp !== undefined) {
            return (
              <SharedVideoNotification
                key={notification.id}
                videoId={notification.videoId}
                timestamp={notification.timestamp}
                submittedBy={notification.submittedBy}
                message={notification.message}
                onWatch={onOpenVideo}
                onDismiss={() => dismissNotification(notification.id)}
              />
            );
          }

          if (notification.type === 'event_frame') {
            return (
              <div
                key={notification.id}
                className={`
                  bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg 
                  shadow-2xl border border-green-500/30 backdrop-blur-sm p-4 max-w-sm
                  transform transition-all duration-300 ease-out
                  translate-x-0 opacity-100
                `}
                style={{ top: `${index * 80}px` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Event Update</span>
                  </div>
                  <button
                    onClick={() => dismissNotification(notification.id)}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-white/90">{notification.message}</p>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => dismissNotification(notification.id)}
                    className="px-3 py-1 text-xs bg-white/20 hover:bg-white/30 rounded transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          }

          if (notification.type === 'dres_submission') {
            return (
              <div
                key={notification.id}
                className={`
                  bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg 
                  shadow-2xl border border-red-500/30 backdrop-blur-sm p-4 max-w-sm
                  transform transition-all duration-300 ease-out
                  translate-x-0 opacity-100
                `}
                style={{ top: `${index * 80}px` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">DRES Submission</span>
                  </div>
                  <button
                    onClick={() => dismissNotification(notification.id)}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-white/90 mb-2">{notification.message}</p>
                <div className="text-xs text-white/70">
                  Event: {notification.eventId} • Frames: {notification.frameCount}
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => dismissNotification(notification.id)}
                    className="px-3 py-1 text-xs bg-white/20 hover:bg-white/30 rounded transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    );
  };

  return {
    notifications,
    NotificationContainer,
    showVideoNotification,
    showEventFrameNotification,
    showDresSubmissionNotification,
    dismissNotification,
  };
};