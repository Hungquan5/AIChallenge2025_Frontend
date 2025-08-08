import React,{useState} from 'react';
import type { ResultItem } from '../../../results/types';
interface BroadcastFeedProps {
  messages: ResultItem[];
}
import { ChevronUp, ChevronDown, Users, Wifi, WifiOff } from 'lucide-react';

import ResultCard from '../../../results/components/ResultsPanel/ResultCard';
interface BroadcastFeedProps {
  messages: ResultItem[];
  onRemoveMessage?: (messageId: string, index: number) => void;
  currentUser?: string;
  // ✅ 2. Add props for all the actions ResultCard can perform
  onResultClick: (item: ResultItem) => void;
  onRightClick: (item: ResultItem, event: React.MouseEvent) => void;
  onSimilaritySearch: (imageSrc: string, cardId: string) => void;
}
// Enhanced BroadcastFeed component
export const BroadcastFeed: React.FC<BroadcastFeedProps> = ({
  messages,
  onRemoveMessage,
  currentUser,
  // ✅ 3. Destructure the new function props
  onResultClick,
  onRightClick,
  onSimilaritySearch,
}) => {
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
      {/* ✅ 4. Use a responsive grid for the cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 p-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {messages.map((msg, index) => (
          // This wrapper handles the hover state for the tooltip and the remove button
          <div
            key={`${msg.id}-${index}`}
            className="relative group"
            onMouseEnter={(e) => handleMouseEnter(msg.id, index, e)}
            onMouseLeave={handleMouseLeave}
          >
            <ResultCard
              id={msg.id}
              thumbnail={msg.thumbnail}
              title={msg.title}
              // Pass metadata; use optional chaining for safety
              timestamp={msg.timestamp ?? ''}
              confidence={msg.confidence ?? 0}
              loaded={true} // Images in the feed are likely loaded
              onLoad={() => {}}
              // ✅ 5. Wire up all the actions to the handlers from props
              onClick={() => onResultClick(msg)}
              onContextMenu={(event) => {
                event.preventDefault(); // Important: prevent default right-click menu
                onRightClick(msg, event);
              }}
              onSimilaritySearch={onSimilaritySearch}
              // These actions don't make sense for a received message, so we omit them
              // onSubmit={() => {}}
              // onSending={() => {}}
            />
            
            {/* ✅ 6. Overlay the remove button on top of the ResultCard */}
            {/* Only show for messages sent by the current user */}
            { (
              <button
                onClick={(e) => handleRemoveMessage(msg.id, index, e)}
                className="absolute top-1 right-1 z-10 w-5 h-5 bg-red-500/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 text-xs font-bold hover:scale-110"
                title="Remove this submission"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};