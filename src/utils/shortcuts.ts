// src/utils/shortcuts.ts

import { useEffect, useCallback } from 'react';

// Define the shortcuts object without page numbers
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
  SEARCH_FOCUSED_ITEM: { key: 'Enter', modifier: 'Alt' },

  // View mode shortcuts
  TOGGLE_VIEW_MODE: { key: 'v', modifier: 'Alt' },

  // Feature input shortcuts
  TOGGLE_OCR: { key: 'j', modifier: 'Ctrl/Cmd' },
  TOGGLE_ASR: { key: 'k', modifier: 'Ctrl/Cmd' },
  TOGGLE_OBJ: { key: 'l', modifier: 'Ctrl/Cmd' },

  // Query mode shortcuts
  TOGGLE_TEXT_MODE: { key: 'u', modifier: 'Ctrl/Cmd' },
  TOGGLE_IMAGE_MODE: { key: 'i', modifier: 'Ctrl/Cmd' },

  // Navigation shortcuts
  FOCUS_SEARCH: { key: 's', modifier: 'Alt' }, // Changed to avoid conflict
  NAVIGATE_SEARCH: { key: 'l', modifier: 'Alt' },
  NEXT_RESULT: { key: 'ArrowDown', modifier: 'Alt' },
  PREV_RESULT: { key: 'ArrowUp', modifier: 'Alt' },

  // Modal and Panel shortcuts
  CLOSE_MODAL: { key: 'Escape', modifier: 'none' },
  TOGGLE_DISLIKE_PANEL: { key: 'd', modifier: 'Ctrl/Cmd' },
  SHOW_HISTORY: { key: 'e', modifier: 'Ctrl/Cmd' },
} as const;

// Keep TypeScript happy with a clear type definition
type ShortcutKey = keyof typeof SHORTCUTS;

// Define the type for our handlers, including a new dynamic handler
type ShortcutHandlers = {
  [K in ShortcutKey]?: () => void;
} & {
  GO_TO_PAGE?: (page: number) => void; // A new, dynamic handler for pagination
};

// Helper function to check for static shortcuts remains the same
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
      return false;
    }
  }
  return true;
};

// The updated, more scalable hook
export const useShortcuts = (handlers: ShortcutHandlers): void => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // --- Dynamic Page Navigation Logic ---
    // Check for Alt + number key (1-9)
    const pageNumber = parseInt(event.key, 10);
    if (
      !event.altKey &&
      event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !isNaN(pageNumber) &&
      pageNumber >= 1 &&
      pageNumber <= 9
    ) {
      if (handlers.GO_TO_PAGE) {
        event.preventDefault();
        handlers.GO_TO_PAGE(pageNumber);
        return; // Exit after handling
      }
    }

    // --- Static Shortcut Logic (from the SHORTCUTS object) ---
    (Object.entries(SHORTCUTS) as [ShortcutKey, typeof SHORTCUTS[ShortcutKey]][]).forEach(([action, shortcut]) => {
      if (isShortcut(event, shortcut) && handlers[action]) {
        event.preventDefault();
        handlers[action]?.();
      }
    });
  }, [handlers]); // Dependency array ensures the handler is stable if handlers object is memoized

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};