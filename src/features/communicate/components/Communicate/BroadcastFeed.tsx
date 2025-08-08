import React,{useState} from 'react';
import type { ResultItem } from '../../../results/types';
interface BroadcastFeedProps {
  messages: ResultItem[];
}
import { ChevronUp, ChevronDown, Users, Wifi, WifiOff } from 'lucide-react';
// Enhanced BroadcastFeed component
export const BroadcastFeed: React.FC<{ 
  messages: ResultItem[];
  onRemoveMessage?: (messageId: string, index: number) => void;
  currentUser?: string;
}> = ({ messages, onRemoveMessage, currentUser }) => {
  const [hoveredItem, setHoveredItem] = useState<{id: string, index: number} | null>(null);
  const [mousePosition, setMousePosition] = useState<{x: number, y: number}>({ x: 0, y: 0 });
const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  const handleRemoveMessage = (messageId: string, index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    onRemoveMessage?.(messageId, index);
  };
    const hoveredMessage = hoveredItem ? messages[hoveredItem.index] : null;
 const handleMouseEnter = (messageId: string, index: number, event: React.MouseEvent) => {
    setHoveredItem({ id: messageId, index });
    const rect = event.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8
    });
  };
  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-500">
        <Users className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">No live submissions yet</p>
        <p className="text-xs opacity-75">Share your discoveries!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Live Submissions</h3>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
            {messages.length}
          </span>
        </div>
        
        {messages.length > 0 && (
          <button 
            onClick={() => messages.forEach((msg, index) => onRemoveMessage?.(msg.id, index))}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50"
          >
            Clear All
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {messages.map((msg, index) => (
          <div 
            key={`${msg.id}-${index}`} 
            className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 hover:border-blue-200 cursor-pointer"
            onMouseEnter={(e) => handleMouseEnter(msg.id, index, e)}
            onMouseLeave={handleMouseLeave}
          >
            {/* Remove button - only show for current user's messages or admin */}
            { (
              <button
                onClick={(e) => handleRemoveMessage(msg.id, index, e)}
                className="absolute top-1 left-1 z-10 w-5 h-5 bg-red-500/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 text-xs font-bold hover:scale-110"
                title="Remove this submission"
              >
                ×
              </button>
            )}

            {/* Image container with fixed aspect ratio */}
            <div className="relative aspect-[12/7] overflow-hidden">
              <img
                src={msg.thumbnail}
                alt={msg.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
              
              {/* Timestamp badge */}
              {msg.timestamp && (
                <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded backdrop-blur-sm">
                  {msg.timestamp}
                </div>
              )}

            </div>

            
            {/* Subtle hover indicator */}
            <div className="absolute inset-0 border-2 border-blue-400/0 group-hover:border-blue-400/30 rounded-lg transition-all duration-200 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Hover tooltip */}
      {hoveredMessage && hoveredItem && (
        <div 
          className="fixed z-50 pointer-events-none transition-all duration-200"
          style={{
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="bg-gray-800 text-white text-xs rounded-lg shadow-xl max-w-64 p-3 backdrop-blur-sm border border-gray-600/50">
            {/* Arrow pointing up */}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45 border-l border-t border-gray-600/50"></div>
            
            <div className="space-y-2">
              {/* Title */}
              <p className="font-semibold text-white line-clamp-2">
                {hoveredMessage.title}
              </p>
              
              {/* Metadata */}
              <div className="space-y-1 text-gray-300">
                {hoveredMessage.timestamp && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Time:</span>
                    <span>{hoveredMessage.timestamp}</span>
                  </div>
                )}
                
                {/* Additional metadata if available */}
                {hoveredMessage.confidence && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Confidence:</span>
                    <span>{(hoveredMessage.confidence * 100).toFixed(1)}%</span>
                  </div>
                )}
                
                {hoveredMessage.videoId && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Video:</span>
                    <span className="truncate">{hoveredMessage.videoId}</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};