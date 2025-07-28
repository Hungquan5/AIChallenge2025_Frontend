// components/ResultCard.tsx
import React from 'react';
import {
  cardClass,
  imageClass,
  imageContainerClass,
  imageOverlayClass,
  contentClass,
  titleClass,
  confidenceClass,
  timestampClass,
} from './styles';

interface Props {
  id: string;
  thumbnail: string;
  title: string;
  confidence: number;
  timestamp: string;
  loaded: boolean;
  onLoad: (id: string) => void;
  onClick?: () => void;
}

const ResultCard: React.FC<Props> = ({ id, thumbnail, title, confidence, timestamp, loaded, onLoad, onClick }) => {
  return (
    <div className={`${cardClass} group result-item`} tabIndex={0} onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }}>
      <div className={imageContainerClass}>
        <img
          src={thumbnail}
          alt={title}
          loading="lazy"
          decoding="async"
          className={`${imageClass} ${!loaded ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => onLoad(id)}
        />
        <div className={imageOverlayClass} />
        {!loaded && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
      </div>
      <div className={contentClass}>
        <h3 className={titleClass}>{title}</h3>
        {/* <p className={confidenceClass}>{(confidence * 100).toFixed(1)}%</p>
        <p className={timestampClass}>{timestamp}</p> */}
      </div>
    </div>
  );
};

export default React.memo(ResultCard);
