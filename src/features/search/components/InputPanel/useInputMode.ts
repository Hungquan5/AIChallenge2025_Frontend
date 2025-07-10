import { useState } from 'react';

export type SearchMode = 'text' | 'image' | 'semantic' | 'object' | 'scene' | 'audio';

export const useInputMode = (initial: SearchMode = 'text') => {
  const [mode, setMode] = useState<SearchMode>(initial);

  const switchMode = (newMode: SearchMode) => {
    setMode(newMode);
  };

  return { mode, switchMode };
};
