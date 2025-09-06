// src/hooks/useModalState.ts
import { useState, useCallback } from 'react';
import type { ResultItem } from '../features/results/types';

interface VideoPanelState {
  isOpen: boolean;
  videoId: string | null;
  timestamp: string | null;
}

interface FramesPanelState {
  isOpen: boolean;
  frames: ResultItem[];
  videoTitle: string;
  isLoading: boolean;
}

interface UseModalStateReturn {
  // Video Panel State
  videoPanelState: VideoPanelState;
  handleOpenVideoPanel: (videoId: string, timestamp: string) => void;
  handleCloseVideoPanel: () => void;

  // Detail Modal State
  detailModalItem: ResultItem | null;
  handleOpenDetailModal: (item: ResultItem) => void;
  handleCloseDetailModal: () => void;

  // Dislike Panel State
  isDislikePanelOpen: boolean;
  handleToggleDislikePanel: () => void;

  // Shortcuts State
  showShortcuts: boolean;
  setShowShortcuts: React.Dispatch<React.SetStateAction<boolean>>;

  // Generic close handler for ESC key
  handleCloseModal: () => void;
}

export const useModalState = (): UseModalStateReturn => {
  // Video Panel State
  const [videoPanelState, setVideoPanelState] = useState<VideoPanelState>({
    isOpen: false,
    videoId: null,
    timestamp: null,
  });

  // Detail Modal State
  const [detailModalItem, setDetailModalItem] = useState<ResultItem | null>(null);

  // Dislike Panel State
  const [isDislikePanelOpen, setIsDislikePanelOpen] = useState(false);

  // Shortcuts State
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Video Panel Handlers
  const handleOpenVideoPanel = useCallback((videoId: string, timestamp: string) => {
    console.log(`Opening VideoPanel for videoId: ${videoId} at timestamp: ${timestamp}`);
    setVideoPanelState({ isOpen: true, videoId, timestamp });
  }, []);

  const handleCloseVideoPanel = useCallback(() => {
    setVideoPanelState({ isOpen: false, videoId: null, timestamp: null });
  }, []);

  // Detail Modal Handlers
  const handleOpenDetailModal = useCallback((item: ResultItem) => {
    setDetailModalItem(item);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setDetailModalItem(null);
  }, []);

  // Dislike Panel Handlers
  const handleToggleDislikePanel = useCallback(() => {
    setIsDislikePanelOpen(prev => !prev);
  }, []);

  // Generic close handler for ESC key
  const handleCloseModal = useCallback(() => {
    // Close modals in priority order (top-most first)
    if (videoPanelState.isOpen) {
      handleCloseVideoPanel();
      return;
    }
    
    if (detailModalItem) {
      handleCloseDetailModal();
      return;
    }

    if (isDislikePanelOpen) {
      handleToggleDislikePanel();
      return;
    }

    if (showShortcuts) {
      setShowShortcuts(false);
      return;
    }
  }, [
    videoPanelState.isOpen, 
    detailModalItem, 
    isDislikePanelOpen, 
    showShortcuts,
    handleCloseVideoPanel,
    handleCloseDetailModal,
    handleToggleDislikePanel
  ]);

  return {
    // Video Panel
    videoPanelState,
    handleOpenVideoPanel,
    handleCloseVideoPanel,

    // Detail Modal
    detailModalItem,
    handleOpenDetailModal,
    handleCloseDetailModal,

    // Dislike Panel
    isDislikePanelOpen,
    handleToggleDislikePanel,

    // Shortcuts
    showShortcuts,
    setShowShortcuts,

    // Generic
    handleCloseModal,
  };
};