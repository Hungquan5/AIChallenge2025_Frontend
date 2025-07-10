import React from 'react';
import type { ResultItem } from '../../types';
import {
  gridClass,
  cardClass,
  imageClass,
  contentClass,
  titleClass,
  confidenceClass,
  timestampClass,
} from './styles';

interface Props {
  results: ResultItem[];
}

const SortedByConfidenceView: React.FC<Props> = ({ results }) => {
  const sorted = [...results].sort((a, b) => b.confidence - a.confidence);

  return (
    <div className={gridClass}>
      {sorted.map((item) => (
        <div key={item.id} className={cardClass}>
          <img src={item.thumbnail} alt={item.title} className={imageClass} />
          <div className={contentClass}>
            <h3 className={titleClass}>{item.title}</h3>
            <p className={confidenceClass}>Confidence: {(item.confidence * 100).toFixed(1)}%</p>
            <p className={timestampClass}>Timestamp: {item.timestamp}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SortedByConfidenceView;
