// === Layout ===
export const containerClass = `
  p-3
  margin-0
  space-y-3
  bg-[var(--bg-primary)]
  backdrop-blur-sm
`;

export const sectionClass = 'space-y-2';
export const labelClass = 'text-slate-900 font-semibold text-sm tracking-wide uppercase opacity-80';

// === TextInputBox ===
export const inputClass = `
  w-full
  px-3
  py-2.5
  rounded-xl
  border-0
  bg-white/90
  backdrop-blur-sm
  text-slate-900
  placeholder-slate-400
  shadow-sm
  ring-1
  ring-slate-200/60
  focus:outline-none
  focus:ring-2
  focus:ring-blue-500/20
  focus:bg-white
  transition-all
  duration-200
  hover:shadow-md
  hover:ring-slate-300/60
`;

// === ImageInputBox ===
export const fileInputClass = 'hidden';

export const uploadAreaClass = `
  block w-full p-6 
  border-2 border-dashed border-slate-200/80 
  rounded-2xl text-center cursor-pointer 
  bg-gradient-to-br from-slate-50/50 to-white/30
  backdrop-blur-sm
  hover:border-blue-300/60 
  hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-white/40
  transition-all duration-300 
  group shadow-sm hover:shadow-lg
`;

export const uploadedTextClass = 'text-emerald-600 font-medium';
export const emptyStateClass = 'text-slate-500 group-hover:text-slate-700 transition-colors duration-300';
export const iconClass = 'w-8 h-8 mx-auto mb-2 text-slate-400 group-hover:text-blue-500 transition-colors duration-300';
export const filenameClass = 'text-sm font-semibold text-slate-800 truncate';
export const emptyTextClass = 'text-sm text-slate-500 font-medium';

// === SearchTypeSelector ===
export const buttonGroupGrid = 'grid grid-cols-3 gap-2';

export const modeButtonShared = `
  flex flex-col items-center p-3 rounded-xl 
  border-0 transition-all duration-300 cursor-pointer
  shadow-sm hover:shadow-md
  backdrop-blur-sm
`;

export const modeButtonSelected = `
  bg-gradient-to-br from-amber-100/90 to-yellow-100/90 
  ring-2 ring-amber-300/60 
  text-slate-900 shadow-lg
  transform scale-105
`;

export const modeButtonUnselected = `
  bg-white/60 
  ring-1 ring-slate-200/50 
  text-slate-600 
  hover:bg-gradient-to-br hover:from-amber-50/80 hover:to-yellow-50/80
  hover:ring-amber-200/60 
  hover:text-slate-800
  hover:scale-102
`;

export const modeIconClass = 'w-5 h-5 mb-1.5 transition-transform duration-300';
export const modeLabelClass = 'text-xs font-semibold text-current tracking-wide';

// === SearchMode Selector (in InputPanel) ===
export const searchButtonClass = `
  px-4
  py-2.5
  rounded-xl
  bg-gradient-to-r from-[var(--accent-color)] to-blue-600
  text-white
  font-semibold
  text-sm
  shadow-lg
  hover:shadow-xl
  hover:from-blue-600 hover:to-[var(--accent-color)]
  disabled:opacity-50
  disabled:cursor-not-allowed
  disabled:hover:shadow-lg
  transition-all
  duration-300
  transform
  hover:scale-105
  active:scale-95
  backdrop-blur-sm
`;