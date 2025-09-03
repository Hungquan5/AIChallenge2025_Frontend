// src/utils/shortcuts.ts

import { useEffect } from 'react';

// Định nghĩa các phím tắt
export const SHORTCUTS = {
  // Search shortcuts
  TRIGGER_SEARCH: { key: 'Enter', modifier: 'none' },
  TRIGGER_CHAIN_SEARCH: { key: 'Enter', modifier: 'Shift' },
  NEW_QUERY: { key: 'Enter', modifier: 'Ctrl/Cmd' },
  NEXT_CELL: { key: 'Tab', modifier: 'none' },
  PREV_CELL: { key: 'Tab', modifier: 'Shift' },
  NEW_LINE: { key: 'Enter', modifier: 'Shift' },
  CLEAR_SEARCH: { key: '`', modifier: 'none' },
  ADD_QUERY: { key: 'n', modifier: 'Alt' },
  REMOVE_QUERY: { key: 'd', modifier: 'Alt' },
  TRANSLATE_QUERY: { key: 'q', modifier: 'Alt' },
  TOGGLE_AUTO_TRANSLATE: { key: 'q', modifier: 'Alt+Shift' },

  // View mode shortcuts
  TOGGLE_VIEW_MODE: { key: 'v', modifier: 'Alt' },

  // Feature input shortcuts
  TOGGLE_OCR: { key: 'j', modifier: 'Ctrl/Cmd' },
  TOGGLE_ASR: { key: 'k', modifier: 'Ctrl/Cmd' },
  TOGGLE_OBJ: { key: 'l', modifier: 'Ctrl/Cmd' },

  // Query mode shortcuts
  TOGGLE_TEXT_MODE: { key: 'u', modifier: 'Ctrl/Cmd' },
  TOGGLE_IMAGE_MODE: { key: 'i', modifier: 'Ctrl/Cmd' },

  // Search mode shortcuts
  SWITCH_TO_NORMAL: { key: '1', modifier: 'Alt' },
  SWITCH_TO_CHAIN: { key: '2', modifier: 'Alt' },
  
  // Navigation shortcuts
  FOCUS_SEARCH: { key: 'f', modifier: 'Alt' },
  NAVIGATE_SEARCH: {key: 'l', modifier: 'Alt'}, 
  NEXT_RESULT: { key: 'ArrowDown', modifier: 'Alt' },
  PREV_RESULT: { key: 'ArrowUp', modifier: 'Alt' },

  // Modal and Panel shortcuts
  CLOSE_MODAL: { key: 'Escape', modifier: 'none' },
  TOGGLE_DISLIKE_PANEL: { key: 'd', modifier: 'Ctrl/Cmd' }, // ✅ ADD THIS LINE
} as const;

type ShortcutKey = keyof typeof SHORTCUTS;

// Helper function to check for shortcuts
export const isShortcut = (event: KeyboardEvent | React.KeyboardEvent, shortcut: typeof SHORTCUTS[ShortcutKey]): boolean => {
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false;
  }

  const isCtrlOrCmd = event.ctrlKey || event.metaKey;

  const modifiersPressed = {
    'Ctrl/Cmd': isCtrlOrCmd,
    'Alt': event.altKey,
    'Shift': event.shiftKey,
  };

  const requiredModifiers = shortcut.modifier.split('+').filter(m => m !== 'none');
  const allModifierKeys = ['Ctrl/Cmd', 'Alt', 'Shift'];

  for (const modKey of allModifierKeys) {
    const isRequired = requiredModifiers.includes(modKey);
    const isPressed = modifiersPressed[modKey as keyof typeof modifiersPressed];

    if (isRequired !== isPressed) {
      return false; // Modifier state does not match
    }
  }
  
  return true;
};

// Hook to register shortcuts
export const useShortcuts = (handlers: {
  [K in ShortcutKey]?: () => void;
}): void => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      (Object.entries(SHORTCUTS) as [ShortcutKey, typeof SHORTCUTS[ShortcutKey]][]).forEach(([action, shortcut]) => {
        if (isShortcut(event, shortcut) && handlers[action]) {
          event.preventDefault();
          handlers[action]?.();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
};