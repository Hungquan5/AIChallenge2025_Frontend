// src/hooks/useModalState.ts - Updated to support enhanced VideoPanel
import { useState, useCallback } from 'react';
import type { ResultItem } from '../features/results/types';

interface VideoPanelState {
  isOpen: boolean;
  videoId: string | null;
  timestamp: string | null;
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

  // Shortcuts Modal State
  showShortcuts: boolean;
  setShowShortcuts: React.Dispatch<React.SetStateAction<boolean>>;

  // Generic Modal Handlers
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

  // Shortcuts Modal State
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Video Panel Handlers
  const handleOpenVideoPanel = useCallback((videoId: string, timestamp: string) => {
    setVideoPanelState({
      isOpen: true,
      videoId,
      timestamp,
    });
  }, []);

  const handleCloseVideoPanel = useCallback(() => {
    setVideoPanelState({
      isOpen: false,
      videoId: null,
      timestamp: null,
    });
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

  // Generic Close Handler (for shortcuts)
  const handleCloseModal = useCallback(() => {
    // Close whatever modal is currently open
    if (videoPanelState.isOpen) {
      handleCloseVideoPanel();
    } else if (detailModalItem) {
      handleCloseDetailModal();
    } else if (showShortcuts) {
      setShowShortcuts(false);
    } else if (isDislikePanelOpen) {
      handleToggleDislikePanel();
    }
  }, [
    videoPanelState.isOpen,
    detailModalItem,
    showShortcuts,
    isDislikePanelOpen,
    handleCloseVideoPanel,
    handleCloseDetailModal,
    handleToggleDislikePanel,
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

    // Shortcuts Modal
    showShortcuts,
    setShowShortcuts,

    // Generic Handler
    handleCloseModal,
  };
};