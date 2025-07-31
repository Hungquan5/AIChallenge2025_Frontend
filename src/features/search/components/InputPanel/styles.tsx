
export const uploadedTextClass = 'text-emerald-600 font-medium';
export const emptyStateClass = 'text-slate-500 group-hover:text-slate-700 transition-colors duration-300';
export const iconClass = 'w-8 h-8 mx-auto mb-2 text-slate-400 group-hover:text-blue-500 transition-colors duration-300';
export const filenameClass = 'text-sm font-semibold text-slate-800 truncate';
export const emptyTextClass = 'text-sm text-slate-500 font-medium';

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

// === QueryItem Container ===
export const queryItemContainerClass = `
  p-3 
  border border-slate-200/60 
  rounded-xl 
  shadow-sm 
  space-y-3 
  bg-gradient-to-br from-white/90 to-slate-50/50 
  backdrop-blur-sm
`;

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

// === Mode Toggle Buttons ===
export const modeToggleButtonClass = `
  flex items-center justify-center
  w-10 h-10
  rounded-lg 
  text-lg
  transition-all duration-300 
  transform hover:scale-105 active:scale-95
  shadow-sm backdrop-blur-sm border-0
`;

export const modeToggleActiveClass = `
  text-slate-900 
  ring-2 ring-blue-300/60 
  shadow-lg
`;

export const modeToggleInactiveClass = `
  bg-white/60 
  text-slate-600 
  ring-1 ring-slate-200/50 
  hover:bg-gradient-to-br hover:from-blue-50/80 hover:to-white/80 
  hover:ring-blue-200/60 
  hover:text-slate-800
`;

export const textModeActiveColor = 'bg-gradient-to-br from-blue-100/90 to-indigo-100/90';
export const imageModeActiveColor = 'bg-gradient-to-br from-purple-100/90 to-pink-100/90';

// === Feature Toggle Buttons ===
export const featureToggleButtonClass = `
  flex items-center justify-center
  w-10 h-10
  rounded-lg 
  text-lg
  transition-all duration-300 
  transform hover:scale-105 active:scale-95
  shadow-sm backdrop-blur-sm border-0
`;

export const featureToggleActiveClass = `
  text-slate-900 
  ring-2 ring-opacity-60 
  shadow-lg
`;

export const featureToggleInactiveClass = `
  bg-white/60 
  text-slate-600 
  ring-1 ring-slate-200/50 
  hover:bg-gradient-to-br hover:from-slate-50/80 hover:to-white/80 
  hover:ring-slate-300/60 
  hover:text-slate-800
`;

export const ocrActiveColor = 'bg-gradient-to-br from-red-100/90 to-orange-100/90 ring-red-300';
export const asrActiveColor = 'bg-gradient-to-br from-blue-100/90 to-cyan-100/90 ring-blue-300';
export const objActiveColor = 'bg-gradient-to-br from-green-100/90 to-emerald-100/90 ring-green-300';

// === Feature Section ===
export const featureSectionClass = '';

export const featureTitleClass = '';

export const featureDividerClass = '';

export const featureGridClass = 'flex items-center gap-2';

// === ImageInputBox ===
export const fileInputClass = 'hidden';

export const uploadAreaClass = `
  block cursor-pointer 
  border-2 border-dashed border-purple-200/80 
  rounded-2xl p-6 text-center 
  bg-gradient-to-br from-purple-50/50 to-pink-50/30 
  backdrop-blur-sm
  hover:border-purple-300/60 
  hover:bg-gradient-to-br hover:from-purple-100/50 hover:to-pink-100/40
  transition-all duration-300 group 
  shadow-sm hover:shadow-lg
`;

export const uploadIconClass = `
  text-3xl mb-2 
  group-hover:scale-110 
  transition-transform duration-300
`;

export const uploadTextClass = `
  text-sm font-medium text-purple-700 
  group-hover:text-purple-800 
  transition-colors
`;

export const uploadedImageClass = `
  max-w-xs max-h-64 
  rounded-xl shadow-lg 
  border border-slate-200/60
`;

// === Feature Input Fields ===
export const featureInputLabelClass = '';

export const featureInputClass = `
  w-full p-2 
  rounded-lg 
  border 
  text-sm text-slate-800 
  placeholder-slate-500 
  focus:outline-none 
  focus:ring-1 
  transition-all duration-200
`;

export const ocrInputClass = `
  bg-gradient-to-br from-red-50/80 to-orange-50/80 
  border-red-200/60 
  focus:ring-red-300/40
`;

export const asrInputClass = `
  bg-gradient-to-br from-blue-50/80 to-cyan-50/80 
  border-blue-200/60 
  focus:ring-blue-300/40
`;

export const objInputClass = `
  bg-gradient-to-br from-green-50/80 to-emerald-50/80 
  border-green-200/60 
  focus:ring-green-300/40
`;

// === Bottom Controls ===
export const bottomControlsClass = `
  flex justify-between items-center 
  pt-2 border-t border-slate-200/50
`;

export const languageToggleClass = `
  px-3 py-1.5 
  text-xs font-semibold 
  bg-gradient-to-br from-slate-100/80 to-white/80 
  text-slate-700 
  rounded-lg 
  border border-slate-200/60 
  hover:from-slate-200/80 hover:to-slate-100/80 
  hover:text-slate-800 
  transition-all duration-200 
  transform hover:scale-105
`;

export const actionButtonClass = `
  w-8 h-8 
  flex items-center justify-center 
  rounded-lg 
  font-bold 
  transition-all duration-200 
  transform hover:scale-105 active:scale-95 
  shadow-sm
`;

export const removeButtonClass = `
  bg-gradient-to-br from-red-500 to-red-600 
  text-white 
  hover:from-red-600 hover:to-red-700
`;

export const addButtonClass = `
  bg-gradient-to-br from-blue-500 to-indigo-600 
  text-white 
  hover:from-blue-600 hover:to-indigo-700
`;

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
  mt-2
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