import React, { useMemo } from 'react';
import type { ResultItem } from '../../../results/types'; // Correct path to types
import { Users, Send } from 'lucide-react';
import ResultCard from '../../../results/components/ResultsPanel/ResultCard'; // Correct path to ResultCard
import { getImageUrl } from '../../../../utils/getImageURL';

interface BroadcastFeedProps {
  messages: ResultItem[];
  onRemoveMessage?: (messageId: string, index: number) => void;
  currentUser?: string;
  onResultClick: (item: ResultItem) => void;
  onRightClick: (item: ResultItem, event: React.MouseEvent) => void;
  onSimilaritySearch: (imageSrc: string, cardId: string) => void;
  onVqaSubmit: (item: ResultItem, question: string) => void;
  onSubmission: (item: ResultItem) => void;
  onResultDoubleClick: (item: ResultItem) => void;
  vqaQuestions: { [key: string]: string };
  onVqaQuestionChange: (itemId: string, question: string) => void;
  isTrackModeActive: boolean;
}

export const BroadcastFeed: React.FC<BroadcastFeedProps> = ({
  messages,
  onRemoveMessage,
  onResultClick,
  onRightClick,
  onSimilaritySearch,
  onVqaSubmit,
  onSubmission,
  onResultDoubleClick,
  vqaQuestions,
  onVqaQuestionChange,
  isTrackModeActive,
}) => {
  const processedMessages = useMemo(() => {
    if (!isTrackModeActive) {
      return { default: { title: 'All Submissions', items: messages } };
    }
    
    const grouped = messages.reduce((acc, msg) => {
      const key = msg.videoId || 'unknown';
      if (!acc[key]) {
        acc[key] = { title: msg.title, items: [] };
      }
      acc[key].items.push(msg);
      return acc;
    }, {} as Record<string, { title: string; items: ResultItem[] }>);

    for (const videoId in grouped) {
      grouped[videoId].items.sort((a, b) =>
        (a.timestamp ?? '').localeCompare(b.timestamp ?? '')
      );
    }
    return grouped;
  }, [messages, isTrackModeActive]);

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
    <div className="space-y-2 p-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
      {Object.entries(processedMessages).map(([key, group]) => (
        <div key={key}>
          {isTrackModeActive && (
            <div className="px-2 pt-1">
              <p className="text-xs font-bold text-slate-700 truncate" title={group.title}>
                {group.title || key}
              </p>
              <hr className="border-t border-slate-200 mt-1" />
            </div>
          )}
          
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 p-1">
            {group.items.map((msg, index) => {
              const imageUrl = msg.thumbnail.startsWith('http') ? msg.thumbnail : getImageUrl(msg.videoId, msg.thumbnail);
              const handleVqaInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                onVqaQuestionChange(msg.id, e.target.value);
              };
              const handleLocalVqaSubmit = () => {
                const question = vqaQuestions[msg.id] || '';
                if (question.trim()) {
                  onVqaSubmit(msg, question);
                  onVqaQuestionChange(msg.id, '');
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

                  <div className="relative w-full mt-1.5" title="Submit with Enter. New line with Ctrl+S.">
                    <textarea
                      rows={1}
                      value={vqaQuestions[msg.id] || ''}
                      onChange={handleVqaInputChange}
                      onKeyDown={(e) => {
                        // ✅ CHANGE 1: Handle Ctrl+S for new line
                        if (e.key === 's' && e.ctrlKey) {
                          e.preventDefault(); // Prevent browser's save action
                          
                          const textarea = e.target as HTMLTextAreaElement;
                          const { selectionStart, selectionEnd, value } = textarea;
                          
                          // Manually insert a newline character at the cursor's position
                          const newValue =
                            value.substring(0, selectionStart) +
                            '\n' +
                            value.substring(selectionEnd);
                            
                          onVqaQuestionChange(msg.id, newValue);

                          // Use a timeout to set the cursor position after the state update
                          setTimeout(() => {
                            textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
                          }, 0);
                        }

                        // ✅ CHANGE 2: Handle Enter (without modifiers) for submission
                        if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                          e.preventDefault(); // Prevent new line on Enter
                          handleLocalVqaSubmit();
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      placeholder={`VQA: Ask... (By ${msg.submittedBy})`}
                      className="w-full pl-2 pr-7 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none overflow-hidden"
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLocalVqaSubmit();
                      }}
                      disabled={!(vqaQuestions[msg.id] || '').trim()}
                      className="absolute right-1 top-1.5 p-0.5 text-gray-400 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                      title="Submit Question (Enter)"
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
      ))}
    </div>
  );
};