// AppShell.tsx
import React,{ useState } from 'react';
import type { ResultItem } from '../features/search/types';
import { ChevronUp, ChevronDown, Users, Wifi, WifiOff } from 'lucide-react';
import { BroadcastFeed } from '../features/communicate/components/Communicate/BroadcastFeed';
interface AppShellProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  searchButton: React.ReactNode;
  chainSearchButton: React.ReactNode;
  carouselOverlay?: React.ReactNode;
  // NEW: BroadcastFeed props
  broadcastMessages?: ResultItem[];
  isConnected?: boolean;
  activeUsers?: number;
  onRemoveBroadcastMessage?: (messageId: string, index: number) => void;
}

const AppShell: React.FC<AppShellProps> = ({ 
  leftPanel, 
  rightPanel, 
  searchButton, 
  chainSearchButton, 
  carouselOverlay,
  broadcastMessages = [],
  isConnected = false,
  activeUsers = 0,
  onRemoveBroadcastMessage,
}) => {
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  const toggleBroadcast = () => {
    setIsBroadcastOpen(!isBroadcastOpen);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 text-slate-900">
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <aside className="w-[240px] min-w-[240px] max-w-[400px] h-full bg-gradient-to-b from-white/95 to-slate-50/95 backdrop-blur-md border-slate-200/60 shadow-xl relative">
          <div className="h-full overflow-y-auto pb-16 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {leftPanel}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-white/98 via-white/95 to-transparent backdrop-blur-sm border-t border-slate-200/40">
            <div className="flex gap-2">
              {searchButton}
              {chainSearchButton}
            </div>
          </div>
        </aside>

        {/* Right-side Container */}
        <div className="relative flex-1 overflow-hidden">
          {/* Right Panel Content */}
          <main className="h-full overflow-hidden bg-white/30 backdrop-blur-sm">
            <div className="h-full overflow-y-auto text-slate-900 scrollbar-thin scrollbar-thumb-slate-300/50 scrollbar-track-transparent">
              <div className="min-h-full bg-gradient-to-br from-white/40 to-transparent">
                {rightPanel}
              </div>
            </div>
          </main>
          
          {/* Carousel Overlay */}
          {carouselOverlay}
        </div>
      </div>

      {/* Broadcast Feed Panel - Bottom Slide Up */}
      <div className="relative z-30">
        {/* Toggle Button */}
        <div className="flex justify-center">
          <button
            onClick={toggleBroadcast}
            className={`
              relative -mb-1 px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
              text-white rounded-t-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5
              flex items-center gap-2 border-t border-l border-r border-blue-300/30
              ${isBroadcastOpen ? 'shadow-xl -translate-y-0.5' : 'shadow-lg'}
            `}
          >
            <div className="flex items-center gap-2">
              {/* Connection Status Indicator */}
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <Wifi className="w-4 h-4" />
                ) : (
                  <WifiOff className="w-4 h-4 opacity-70" />
                )}
              </div>

              <Users className="w-4 h-4" />
              <span className="font-medium text-sm">Live Feed</span>
              
              {/* Message Count Badge */}
              {broadcastMessages.length > 0 && (
                <span className="bg-white/25 text-white text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center">
                  {broadcastMessages.length}
                </span>
              )}
              
              {/* Active Users Count */}
              {activeUsers > 0 && (
                <span className="bg-green-400/30 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {activeUsers} online
                </span>
              )}
            </div>

            {/* Arrow Icon */}
            <div className={`transform transition-transform duration-300 ${isBroadcastOpen ? 'rotate-180' : ''}`}>
              <ChevronUp className="w-4 h-4" />
            </div>

            {/* Pulse animation for new messages */}
            {broadcastMessages.length > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse" />
            )}
          </button>
        </div>

        {/* Broadcast Panel */}
        <div className={`
          bg-gradient-to-r from-white/95 to-blue-50/95 backdrop-blur-md border-t border-gray-200/50 shadow-2xl
          transition-all duration-500 ease-in-out overflow-hidden
          ${isBroadcastOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="">
            {/* Connection Status Bar */}
              {activeUsers > 0 && (
                <span className="text-sm text-gray-600">
                  {activeUsers} user{activeUsers !== 1 ? 's' : ''} online
                </span>
              )}
            </div>

            {/* Broadcast Feed Content */}
            <BroadcastFeed 
              messages={broadcastMessages} 
              onRemoveMessage={onRemoveBroadcastMessage}
            />
          </div>
        </div>
      </div>
  );
};

export default AppShell;