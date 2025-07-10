
import React from 'react';
import type { ResultItem } from '../../types';

interface Props {
  results: ResultItem[];
}

const SortedByConfidenceView: React.FC<Props> = ({ results }) => {
  const sorted = [...results].sort((a, b) => b.confidence - a.confidence);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {sorted.map((item) => (
        <div
          key={item.id}
          className="bg-white/10 rounded-xl border border-white/20 overflow-hidden hover:shadow-lg transition"
        >
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-40 object-cover"
          />
          <div className="p-4">
            <h3 className="text-white font-semibold line-clamp-2">{item.title}</h3>
            <p className="text-sm text-gray-400">Confidence: {(item.confidence * 100).toFixed(1)}%</p>
            <p className="text-sm text-gray-400">Timestamp: {item.timestamp}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SortedByConfidenceView;