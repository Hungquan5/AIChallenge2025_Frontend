import React, { useState } from 'react';
import type { ResultItem } from '../../../results/types'; // Correct path to types
import { Users, Send } from 'lucide-react';
import ResultCard from '../../../results/components/ResultsPanel/ResultCard'; // Correct path to ResultCard
import { getImageUrl } from '../../../../utils/getImageURL';
import { fullSubmissionFlow } from '../../../submit/components/SubmitAPI';

interface BroadcastFeedProps {
  messages: ResultItem[];
  onRemoveMessage?: (messageId: string, index: number) => void;
  currentUser?: string;
  onResultClick: (item: ResultItem) => void;
  onRightClick: (item: ResultItem, event: React.MouseEvent) => void;
  onSimilaritySearch: (imageSrc: string, cardId: string) => void;
  onVqaSubmit: (item: ResultItem, question: string) => void;
  onSubmission: (item: ResultItem) => void; // ✅ Add the new prop
  onResultDoubleClick: (item: ResultItem) => void; // Add prop

}

export const BroadcastFeed: React.FC<BroadcastFeedProps> = ({
  messages,
  onRemoveMessage,
  onResultClick,
  onRightClick,
  onSimilaritySearch,
  onVqaSubmit,
  onSubmission,
  onResultDoubleClick
}) => {
  // ✅ FIX: Manage all VQA inputs in a single state object outside the loop.
  const [vqaQuestions, setVqaQuestions] = useState<{ [key: string]: string }>({});

  const handleRemoveMessage = (messageId: string, index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    onRemoveMessage?.(messageId, index);
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
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 p-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {messages.map((msg, index) => {
          const imageUrl = msg.thumbnail.startsWith('http') ? msg.thumbnail : getImageUrl(msg.videoId, msg.thumbnail);
          
          // ✅ FIX: Handle state change for the specific message input.
          const handleVqaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const { value } = e.target;
            setVqaQuestions(prev => ({
              ...prev,
              [msg.id]: value,
            }));
          };

          // ✅ FIX: Submit the question for the specific message.
          const handleLocalVqaSubmit = () => {
            const question = vqaQuestions[msg.id] || '';
            if (question.trim()) {
              onVqaSubmit(msg, question);
              // Clear the input for this specific message after submission.
              setVqaQuestions(prev => ({
                ...prev,
                [msg.id]: '',
              }));
            }
          };

          return (
            <div key={`${msg.id}-${index}`} className="relative group flex flex-col items-center">
              <div className="w-full">
                <ResultCard
                  id={msg.timestamp}
                  thumbnail={imageUrl}
                  title={msg.title}
                  timestamp={msg.timestamp ?? ''}
                  confidence={msg.confidence ?? 0}
                  onClick={() => onResultClick(msg)}
                  onContextMenu={(event) => onRightClick(msg, event)}
                  onSimilaritySearch={() => onSimilaritySearch(imageUrl, msg.id)}
                  onSubmit={() => onSubmission(msg)}
                  onDoubleClick={() => onResultDoubleClick(msg)}

                  loaded={true}
                  onLoad={() => {}}
                />
              </div>

              <div className="relative w-full mt-1.5" title="Ask a question about this image">
                <input
                  type="text"
                  // ✅ FIX: Get the value from the state object.
                  value={vqaQuestions[msg.id] || ''}
                  // ✅ FIX: Use the new handler for changes.
                  onChange={handleVqaInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLocalVqaSubmit();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder={`VQA: Ask... (By ${msg.submittedBy})`}
                  className="w-full pl-2 pr-7 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLocalVqaSubmit();
                  }}
                  // ✅ FIX: Disable based on the specific question in the state object.
                  disabled={!(vqaQuestions[msg.id] || '').trim()}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {onRemoveMessage && (
                <button
                  onClick={(e) => handleRemoveMessage(msg.id, index, e)}
                  className="absolute top-1 right-1 z-10 w-5 h-5 bg-red-500/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 text-xs font-bold hover:scale-110"
                  title="Remove this submission"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};