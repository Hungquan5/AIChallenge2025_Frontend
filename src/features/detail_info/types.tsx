// features/frame-carousel/types/index.ts
import type { ResultItem } from "../results/types";
export interface FrameCarouselProps {
  frames: ResultItem[] ;
  activeFrameId: string | number;
  onClose?: () => void;
  onNext?: () => Promise<void>;
  onPrev?: () => Promise<void>;
  onFrameChange?: (frameId: string | number) => void;
  isLoading?: boolean;
}
