// src/features/search/components/InputPanel/styles.ts

// === Layout ===
export const containerClass = 'space-y-6';
export const sectionClass = 'space-y-2';
export const labelClass = 'text-white font-medium block';

// === TextInputBox ===
export const inputClass =
  'w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300';

// === ImageInputBox ===
export const fileInputClass = 'hidden';

export const uploadAreaClass =
  'block w-full p-8 border-2 border-dashed border-white/20 rounded-xl text-center cursor-pointer hover:border-white/40 transition-all duration-300 group';

export const uploadedTextClass = 'text-green-400';
export const emptyStateClass = 'text-gray-400 group-hover:text-white transition-colors duration-300';
export const iconClass = 'w-8 h-8 mx-auto mb-2';
export const filenameClass = 'text-sm font-medium';
export const emptyTextClass = 'text-sm';

// === SearchTypeSelector ===
export const buttonGroupGrid = 'grid grid-cols-3 gap-2';
export const modeButtonShared = 'flex flex-col items-center p-3 rounded-lg border transition-all duration-300';
export const modeButtonSelected = 'bg-white/20 border-white/30 text-white shadow';
export const modeButtonUnselected = 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white';
export const modeIconClass = 'w-5 h-5 mb-1';
export const modeLabelClass = 'text-xs';

// === Search Button ===
export const searchButtonClass =
  'w-full bg-purple-600 hover:bg-purple-700 transition text-white py-3 rounded-xl';
