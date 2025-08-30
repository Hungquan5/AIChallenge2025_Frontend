// src/features/submit/components/TrakeSidePanel.tsx

import React from 'react';
import SlidingPane from 'react-sliding-pane';
import 'react-sliding-pane/dist/react-sliding-pane.css';
import type { ResultItem } from '../../../results/types';
import { Send } from 'lucide-react';

interface TrakeSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onTrakeSubmit: (item: ResultItem) => void;
  item: ResultItem | null;
}

export const TrakeSidePanel: React.FC<TrakeSidePanelProps> = ({ isOpen, onClose, onTrakeSubmit, item }) => {
  const handleSubmit = () => {
    if (item) {
      onTrakeSubmit(item);
    }
  };

  return (
    <SlidingPane
      isOpen={isOpen}
      title="TRAKE Submission"
      from="right"
      width="300px"
      onRequestClose={onClose}
      // Add some styling to the pane
      className="!z-[100]" // Ensure it's on top of other elements
    >
      <div className="h-full p-4 bg-white">
        {item ? (
          <div className="flex flex-col h-full">
            <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
            <p className="text-sm text-gray-500 mb-4">Video: {item.videoId}, Frame: {item.timestamp}</p>
            <div className="flex-shrink-0">
                <img src={item.thumbnail} alt={item.title} className="w-full h-auto mt-2 rounded-lg shadow-md" />
            </div>

            <div className="mt-auto"> {/* Pushes the button to the bottom */}
                <button
                onClick={handleSubmit}
                className="w-full bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-700 flex items-center justify-center text-sm font-medium transition-colors duration-200"
                >
                <Send className="w-4 h-4 mr-2" />
                Confirm TRAKE Submission
                </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No item selected.</p>
          </div>
        )}
      </div>
    </SlidingPane>
  );
};