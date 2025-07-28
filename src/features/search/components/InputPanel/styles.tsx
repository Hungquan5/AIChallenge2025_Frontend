// === Layout ===
export const containerClass = `
  p-4 
  space-y-4
  bg-[var(--bg-primary)]
`;
export const sectionClass = 'space-y-2';
export const labelClass = 'text-black font-medium block'; // <-- changed to black

// === TextInputBox ===
export const inputClass = `
  w-full 
  p-3 
  rounded-lg
  border
  border-[var(--border-color)]
  bg-[var(--bg-secondary)]
  text-[var(--text-primary)]
  placeholder-[var(--text-secondary)]
  focus:outline-none
  focus:ring-2
  focus:ring-[var(--accent-color)]
  focus:border-transparent
`;

// === ImageInputBox ===
export const fileInputClass = 'hidden';

export const uploadAreaClass =
  'block w-full p-8 border-2 border-dashed border-gray-300 rounded-xl text-center cursor-pointer hover:border-gray-400 transition-all duration-300 group';

export const uploadedTextClass = 'text-green-600'; // darker green
export const emptyStateClass = 'text-gray-500 group-hover:text-black transition-colors duration-300';
export const iconClass = 'w-8 h-8 mx-auto mb-2';
export const filenameClass = 'text-sm font-medium text-black'; // <-- new
export const emptyTextClass = 'text-sm text-gray-600'; // <-- new

// === SearchTypeSelector ===
export const buttonGroupGrid = 'grid grid-cols-3 gap-2';

export const modeButtonShared = 'flex flex-col items-center p-3 rounded-lg border transition-all duration-300';

export const modeButtonSelected = 'bg-yellow-100 border-yellow-400 text-black shadow';
export const modeButtonUnselected = 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-yellow-50 hover:text-black';

export const modeIconClass = 'w-5 h-5 mb-1';
export const modeLabelClass = 'text-xs text-black';

// === SearchMode Selector (in InputPanel) ===

export const searchButtonClass = `
  px-4 
  py-2 
  rounded-lg 
  bg-[var(--accent-color)]
  text-[var(--bg-primary)]
  font-medium
  hover:bg-[var(--accent-hover)]
  disabled:opacity-50
  disabled:cursor-not-allowed
  transition-colors
`;
