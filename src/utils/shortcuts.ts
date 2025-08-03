import { useEffect } from 'react';

// Định nghĩa các phím tắt
export const SHORTCUTS = {
  // Search shortcuts
  TRIGGER_SEARCH: { key: 'Enter', modifier: 'Ctrl/Cmd' },
  TRIGGER_CHAIN_SEARCH: { key: 'Enter', modifier: 'Shift' },
  NEW_QUERY: { key: 'Enter', modifier: 'none' },
  NEXT_CELL: { key: 'Tab', modifier: 'none' },
  PREV_CELL: { key: 'Tab', modifier: 'Shift' },
  NEW_LINE: { key: 'Enter', modifier: 'Shift' },
  CLEAR_SEARCH: { key: 'Escape', modifier: 'none' },
  ADD_QUERY: { key: 'n', modifier: 'Alt' },
  REMOVE_QUERY: { key: 'd', modifier: 'Alt' },
  TRANSLATE_QUERY: { key: 't', modifier: 'Alt' },
  TRANSLATE_ALL_QUERIES: { key: 't', modifier: 'Alt+Shift' }, // ✅ ADD THIS LINE

  // View mode shortcuts
  TOGGLE_VIEW_MODE: { key: 'v', modifier: 'Alt' },
  
  // Search mode shortcuts
  SWITCH_TO_NORMAL: { key: '1', modifier: 'Alt' },
  SWITCH_TO_CHAIN: { key: '2', modifier: 'Alt' },
  
  // Navigation shortcuts
  FOCUS_SEARCH: { key: 'f', modifier: 'Alt' },
  NAVIGATE_SEARCH: {key: 'l', modifier: 'Alt'}, 
  NEXT_RESULT: { key: 'ArrowDown', modifier: 'Alt' },
  PREV_RESULT: { key: 'ArrowUp', modifier: 'Alt' },
} as const;

type ShortcutKey = keyof typeof SHORTCUTS;

// Helper function để kiểm tra phím tắt
// ✅ REPLACE the existing isShortcut with this updated version
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


// Hook để đăng ký phím tắt (no changes needed here)
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