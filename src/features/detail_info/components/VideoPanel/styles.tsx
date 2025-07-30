// src/features/results/components/styles.tsx

// A reusable focus ring style for accessibility
const focusRingClass =
  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-cyan-400';

// === Container Overlay ===
// Full-screen overlay with darkened background
export const overlayClass = `
  fixed inset-0 z-50
  flex items-center justify-center
  bg-black/70 backdrop-blur-sm
`;

// === Video Modal Container ===
// Card-like modal container with smooth shadows and rounded corners
export const modalClass = `
  relative w-full max-w-3xl
  bg-gradient-to-b from-slate-900 via-slate-950 to-black
  rounded-2xl shadow-2xl
  border border-slate-800/50
  p-4
  animate-fade-in
`;

// === Close Button ===
// Floating close button with hover animation
export const closeButtonClass = `
  absolute top-4 right-4 z-20
  flex items-center justify-center
  w-10 h-10
  bg-white/10 hover:bg-white/20 active:bg-white/15
  rounded-full
  text-white/80 hover:text-white
  backdrop-blur-md
  transition-all duration-200 ease-out
  hover:scale-110 active:scale-95
  ${focusRingClass}
`;

// === Player Wrapper ===
// Responsive 16:9 player container with subtle glow
export const playerWrapperClass = `
  relative w-full pb-[56.25%] overflow-hidden
  rounded-xl shadow-lg shadow-cyan-900/40
`;

// === Player Element ===
// Full-cover video player inside the wrapper
export const playerClass = `
  absolute top-0 left-0 w-full h-full
  rounded-xl
`;
