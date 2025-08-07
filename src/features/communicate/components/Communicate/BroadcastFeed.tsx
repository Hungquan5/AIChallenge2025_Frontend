import React from 'react';
import type { BroadcastImageMessage } from '../../types';

interface BroadcastFeedProps {
  messages: BroadcastImageMessage[];
}

export const BroadcastFeed: React.FC<BroadcastFeedProps> = ({ messages }) => {
  if (messages.length === 0) {
    return null; // Don't render anything if there are no messages
  }

  return (
    <div className="p-4 bg-gray-50 border-b border-gray-200">
      <h3 className="text-lg font-semibold mb-3 text-gray-700">Live Submissions</h3>
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {messages.map((msg, index) => (
          <div key={`${msg.payload.id}-${index}`} className="flex-shrink-0 w-40 animate-fade-in">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <img
                src={msg.payload.thumbnail}
                alt={msg.payload.title}
                className="w-full h-24 object-cover"
              />
              <div className="p-2 text-xs">
                <p className="font-semibold text-gray-800 truncate" title={msg.payload.title}>
                  {msg.payload.title}
                </p>
                <p className="text-gray-500">
                  By: <span className="font-medium">{msg.payload.submittedBy}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
