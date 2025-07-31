// src/features/frame-carousel/components/styles.ts
// A reusable focus ring style for accessibility on interactive elements
const focusRingClass = 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-cyan-400';

// === Main Carousel Container ===
// Made more compact with reduced height
export const containerClass = `
  absolute inset-x-0 bottom-0 h-[20vh]
  bg-gradient-to-t from-slate-900/90 via-slate-950/85 to-black/80
  backdrop-blur-xl
  border-t border-white/10
  shadow-xl shadow-black/40
  transition-all duration-300 ease-out
`;

// === Close Button ===
// Smaller and more subtle
export const closeButtonClass = `
  absolute top-2 right-2 z-20
  flex items-center justify-center
  w-6 h-6
  bg-white/10 hover:bg-white/25 active:bg-white/15
  rounded-full
  text-white/70 hover:text-white text-sm
  transition-all duration-200 ease-out
  hover:scale-110 active:scale-100
  ${focusRingClass}
`;

// === Loading State ===
export const loadingOverlayClass = `
  absolute inset-0 z-30
  flex items-center justify-center
  bg-slate-900/60 backdrop-blur-md
  transition-opacity duration-200
`;

export const loadingSpinnerClass = `
  w-6 h-6
  border-2 border-white/20 border-t-cyan-400
  rounded-full
  animate-spin
`;

// === Swiper & Slide Styles ===
export const swiperWrapperClass = 'items-center';

// === FrameItemSlide Component Styles ===
// Compact wrapper for a single slide
export const slideContentWrapperClass = `
  flex items-center justify-center h-full
  p-1 rounded-lg
  group
  transition-all duration-200 ease-in-out
  transform-gpu
`;

// Style for the currently ACTIVE slide - more compact
export const activeSlideClass = `
  opacity-100
  scale-100
  shadow-[0_0_15px_rgba(0,255,255,0.25),_0_0_8px_rgba(180,80,255,0.15)]
  ring-1 ring-white/25
`;

// Style for INACTIVE slides - smaller and more subtle
export const inactiveSlideClass = `
  scale-85
  opacity-60
  saturate-75
  hover:opacity-90 hover:scale-90 hover:saturate-100
`;

// Container for the image
export const imageContainerClass = 'relative';

// The frame image itself - much more compact
export const imageClass = `
  h-[15vh] w-auto
  rounded-md object-contain
  shadow-md
  transition-all duration-200 ease-in-out
`;

// A subtle glow effect for the active slide
export const activeImageGlowClass = `
  absolute -inset-2
  rounded-lg
  bg-gradient-to-r from-purple-600/20 via-blue-500/20 to-cyan-500/20
  blur-xl
  transition-opacity duration-200
  pointer-events-none
`;