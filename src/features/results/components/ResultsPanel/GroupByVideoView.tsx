import React from 'react';
import type { GroupedResult } from '../../types';
import {
  groupContainerClass,
  groupTitleClass,
  gridClass,
  cardClass,
  imageClass,
  contentClass,
  titleClass,
  confidenceClass,
  timestampClass,
} from './styles';

interface Props {
  groupedResults: GroupedResult[];
}

const GroupedByVideoView: React.FC<Props> = ({ groupedResults }) => {
  return (
    <div className={groupContainerClass}>
      {groupedResults.map((group) => (
        <div key={group.videoId}>
          <h2 className={groupTitleClass}>{group.videoTitle}</h2>
          <div className={gridClass}>
            {group.items.map((item) => (
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
        </div>
      ))}
    </div>
  );
};

export default GroupedByVideoView;
