// src/features/frame-detail/components/FrameDetailModal.tsx

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getFrameInformation } from '../../../search/components/SearchRequest/getInfo';
import type { InformationOfFrame } from '../../../search/components/SearchRequest/getInfo';
import type { ResultItem } from '../../../results/types';

// You can reuse styles from your FramesPanel's styles.ts if they are exported
import * as styles from '../../../detail_info/components/RelativeFramePanel/styles'; 

interface FrameDetailModalProps {
  item: ResultItem;
  onClose: () => void;
}

const FrameDetailModal: React.FC<FrameDetailModalProps> = ({ item, onClose }) => {
  const [information, setInformation] = useState<InformationOfFrame | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Don't run if there's no item
    if (!item) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getFrameInformation(item.videoId, item.timestamp);
        setInformation(data);
      } catch (error) {
        console.error("Failed to fetch frame details:", error);
        setInformation(null); // Clear previous data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [item.videoId, item.timestamp]); // Updated dependencies to be more specific

  const modalClass = `${styles.modalClass} w-11/12 max-w-5xl h-auto max-h-[90vh] flex flex-col bg-white/95 backdrop-blur-xl`;

  return (
    <div className={styles.overlayClass} onClick={onClose}>
      <div className={modalClass} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 truncate pr-4">
            Details for: {item.title}
          </h2>
          <button onClick={onClose} className={styles.closeButtonClass} aria-label="Close detail view">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Side: Large Image */}
          <div className="flex items-center justify-center bg-slate-100 rounded-lg overflow-hidden">
            <img 
              src={item.thumbnail} 
              alt={`Detail view of ${item.title}`} 
              className="w-full h-full object-contain"
            />
          </div>

          {/* Right Side: Information */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Extracted Information</h3>
            
            {/* Basic Item Information */}
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold text-slate-600">Video ID:</span>
                <span className="ml-2 font-mono text-slate-800">{item.videoId}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-600">Timestamp:</span>
                <span className="ml-2 font-mono text-slate-800">{item.timestamp}</span>
              </div>
              {item.confidence && (
                <div>
                  <span className="font-semibold text-slate-600">Confidence:</span>
                  <span className="ml-2 text-slate-800">{(item.confidence * 100).toFixed(1)}%</span>
                </div>
              )}
            </div>

            <hr className="border-slate-200" />

            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : information ? (
              <div className="space-y-3 text-sm font-mono text-slate-800">
                <div>
                  <p className="font-sans font-semibold text-slate-500">OCR Text:</p>
                  <pre className="p-2 bg-slate-50 rounded whitespace-pre-wrap break-words text-xs">
                    {information.ocr_text || 'N/A'}
                  </pre>
                </div>
                <div>
                  <p className="font-sans font-semibold text-slate-500">ASR Text (Context):</p>
                  <pre className="p-2 bg-slate-50 rounded whitespace-pre-wrap break-words text-xs">
                    {information.asr_text || 'N/A'}
                  </pre>
                </div>
                <div>
                  <p className="font-sans font-semibold text-slate-500">Detected Objects:</p>
                  <pre className="p-2 bg-slate-50 rounded whitespace-pre-wrap break-words text-xs">
                    {information.objects || 'N/A'}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-center py-8">
                <p>No additional information found for this frame.</p>
                <p className="text-xs mt-2 text-slate-400">The frame may not have OCR, ASR, or object detection data available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer with additional actions if needed */}
        <div className="flex justify-end items-center px-4 py-2 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FrameDetailModal;