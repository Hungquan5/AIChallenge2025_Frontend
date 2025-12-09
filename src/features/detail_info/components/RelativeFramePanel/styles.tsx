// src/features/frame-carousel/components/styles.ts

// A reusable focus ring style for accessibility on all interactive elements
const focusRingClass = 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-400';

// === Main Modal Overlay ===
// Covers the entire screen with a semi-transparent backdrop.
// Clicking this will close the modal.
export const overlayClass = `absolute  
 inset-0 z-40
  flex items-center justify-center
  bg-black/70
  backdrop-blur-sm
  transition-opacity
`;

// === Modal Panel Container ===
// The main panel that holds the content. It's designed to be responsive.
export const modalClass = `
  w-11/12 max-w-7xl h-[90vh]
  flex flex-col
  bg-gradient-to-br from-slate-50 to-gray-100
  rounded-2xl
  shadow-2xl shadow-black/40
  border border-slate-200/50
  transform transition-all 
`;

// === Panel Header ===
// Contains the title and the close button, with a clean bottom border.
export const panelHeaderClass = `
  flex-shrink-0
  flex justify-between items-center
  p-4
  border-b border-slate-200/80
`;

// === Panel Title ===
// Styling for the "Frames from: ..." heading.
export const panelTitleClass = `
  text-xl font-bold text-slate-800
  truncate pr-4
`;

// === Close Button ===
// A stylish and accessible close button for the top right corner.
export const closeButtonClass = `
  flex-shrink-0
  flex items-center justify-center
  w-8 h-8
  bg-slate-200/70 hover:bg-slate-300/90 active:bg-slate-300
  rounded-full
  text-slate-600 hover:text-slate-800
  hover:scale-110 active:scale-95
  ${focusRingClass}
`;

// === Panel Body ===
// The main scrollable area where the grid of frames will be displayed.
export const panelBodyClass = `
  flex-1
  overflow-y-auto
  p-4
  scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent
`;

// === Frames Grid ===
// A responsive grid layout for the ResultCard components.
export const gridClass = `
  grid
  grid-cols-[repeat(auto-fill,minmax(160px,1fr))]
  sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]
  lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]
  gap-3
`;

// === Loading State Container ===
// Centers the spinner within the panel body while frames are loading.
export const loadingContainerClass = `
  flex-1 flex items-center justify-center
  h-full
`;

// === Loading Spinner ===
// A visually appealing spinner animation.
export const loadingSpinnerClass = `
  w-12 h-12
  border-4 border-slate-200 border-t-blue-500
  rounded-full
  animate-spin
`;

// === No Results Message ===
// Displayed when a video has no frames to show.
export const noResultsClass = `
  flex items-center justify-center
  h-full
  text-center text-slate-500
`;

export const noResultsTitleClass = 'font-semibold text-lg';