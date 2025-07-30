// features/frame-carousel/types/index.ts

export interface FrameItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  confidence: number;
  timestamp: string;
}

export interface FrameCarouselProps {
  frames: FrameItem[];
  activeFrameId: string | number;
  onClose?: () => void;
  onNext?: () => Promise<void>;
  onPrev?: () => Promise<void>;
  onFrameChange?: (frameId: string | number) => void;
  isLoading?: boolean;
}
