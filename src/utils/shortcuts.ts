import { useEffect } from 'react';

// Định nghĩa các phím tắt
export const SHORTCUTS = {
  // Search shortcuts
  TRIGGER_SEARCH: { key: 'Enter', modifier: 'Ctrl/Cmd' },
  NEW_QUERY: { key: 'Enter', modifier: 'none' },
  NEXT_CELL: { key: 'Tab', modifier: 'none' },
  PREV_CELL: { key: 'Tab', modifier: 'Shift' },
  NEW_LINE: { key: 'Enter', modifier: 'Shift' },
  CLEAR_SEARCH: { key: 'Escape', modifier: 'none' },
  ADD_QUERY: { key: 'n', modifier: 'Alt' },
  REMOVE_QUERY: { key: 'd', modifier: 'Alt' },
  
  // View mode shortcuts
  TOGGLE_VIEW_MODE: { key: 'v', modifier: 'Alt' },
  
  // Search mode shortcuts
  SWITCH_TO_NORMAL: { key: '1', modifier: 'Alt' },
  SWITCH_TO_CHAIN: { key: '2', modifier: 'Alt' },
  
  // Navigation shortcuts
  FOCUS_SEARCH: { key: 'f', modifier: 'Alt' },
  NEXT_RESULT: { key: 'ArrowDown', modifier: 'Alt' },
  PREV_RESULT: { key: 'ArrowUp', modifier: 'Alt' },
} as const;

type ShortcutKey = keyof typeof SHORTCUTS;

// Helper function để kiểm tra phím tắt
export const isShortcut = (event: KeyboardEvent | React.KeyboardEvent, shortcut: typeof SHORTCUTS[ShortcutKey]): boolean => {
  const isCtrlOrCmd = event.ctrlKey || event.metaKey;
  const isAlt = event.altKey;
  const isShift = event.shiftKey;
  
  if (shortcut.modifier === 'Ctrl/Cmd') {
    return isCtrlOrCmd && event.key === shortcut.key;
  } else if (shortcut.modifier === 'Alt') {
    return isAlt && event.key === shortcut.key;
  } else if (shortcut.modifier === 'Shift') {
    return isShift && event.key === shortcut.key;
  } else {
    return !isCtrlOrCmd && !isAlt && !isShift && event.key === shortcut.key;
  }
};

// Hook để đăng ký phím tắt
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