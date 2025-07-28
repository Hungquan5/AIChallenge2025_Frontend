import React from 'react';
import { SHORTCUTS } from '../utils/shortcuts';

interface ShortcutItemProps {
  action: string;
  shortcut: typeof SHORTCUTS[keyof typeof SHORTCUTS];
}

const ShortcutItem: React.FC<ShortcutItemProps> = ({ action, shortcut }) => {
  const formatKey = (key: string) => {
    return key.length === 1 ? key.toUpperCase() : key;
  };

  const formatModifier = (modifier: string) => {
    switch (modifier) {
      case 'Ctrl/Cmd':
        return navigator.platform.includes('Mac') ? '⌘' : 'Ctrl';
      case 'Alt':
        return navigator.platform.includes('Mac') ? '⌥' : 'Alt';
      default:
        return '';
    }
  };

  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-gray-700">{action.split('_').join(' ').toLowerCase()}</span>
      <div className="flex gap-1">
        {shortcut.modifier !== 'none' && (
          <kbd className="px-2 py-1 text-sm font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
            {formatModifier(shortcut.modifier)}
          </kbd>
        )}
        <kbd className="px-2 py-1 text-sm font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
          {formatKey(shortcut.key)}
        </kbd>
      </div>
    </div>
  );
};

const ShortcutsHelp: React.FC = () => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-md">
      <h2 className="text-xl font-bold mb-4">Keyboard Shortcuts</h2>
      <div className="space-y-2">
        {Object.entries(SHORTCUTS).map(([action, shortcut]) => (
          <ShortcutItem key={action} action={action} shortcut={shortcut} />
        ))}
      </div>
    </div>
  );
};

export default ShortcutsHelp; 