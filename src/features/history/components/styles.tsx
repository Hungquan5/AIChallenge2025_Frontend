// src/features/search/components/HistoryPanel/styles.ts

// Enhanced overlay with backdrop blur
export const historyPanelOverlayClass = "fixed inset-0 z-30 bg-black/10 backdrop-blur-sm";

// Main panel with improved positioning and modern glass effect
export const historyPanelContainerClass = `
  absolute top-4 left-1/2 -translate-x-1/2 
  w-[95%] max-w-2xl max-h-[70vh]
  bg-white/95 backdrop-blur-xl
  flex flex-col rounded-2xl shadow-2xl border border-slate-200/70
  overflow-hidden z-40
  animate-in fade-in-50 slide-in-from-top-4 duration-300
`;

// Enhanced header with gradient background
export const historyPanelHeaderClass = `
  flex-shrink-0 p-4 border-b border-slate-200/80 
  bg-gradient-to-r from-slate-50 to-white
`;

export const historyPanelTitleClass = `
  text-lg font-semibold text-slate-800 flex items-center gap-3
`;

// Enhanced list container
export const historyPanelListClass = `
  p-3 space-y-2 overflow-y-auto max-h-full
`;

// Modernized history items with better interaction states
export const historyItemClass = `
  group relative p-3 rounded-xl cursor-pointer transition-all duration-200
  border-2
`;

export const historyItemDefaultClass = `
  border-transparent hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm
`;

export const historyItemSelectedClass = `
  border-blue-500 bg-blue-50 shadow-md transform scale-[1.02]
`;

// Enhanced preview components
export const queryPreviewContainerClass = `
  flex-1 min-w-0
`;

export const queryPreviewTextClass = `
  text-sm font-medium text-slate-800 truncate
`;

// Modern chip design with gradients
export const queryTypeChipClass = `
  flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg shadow-sm
`;

// Search input styling
export const searchInputClass = `
  w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm 
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
  transition-shadow
`;

// Footer styling
export const historyPanelFooterClass = `
  flex-shrink-0 px-4 py-3 bg-slate-50/80 border-t border-slate-200/80 
  text-xs text-slate-500
`;

// Action button styles
export const actionButtonClass = `
  p-1.5 rounded-lg transition-colors
`;

export const selectButtonClass = `
  ${actionButtonClass} hover:bg-blue-100
`;

export const deleteButtonClass = `
  ${actionButtonClass} hover:bg-red-100
`;

// Loading state
export const loadingSpinnerClass = `
  animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500
`;

// Empty state
export const emptyStateClass = `
  flex flex-col items-center justify-center h-32 text-slate-500
`;