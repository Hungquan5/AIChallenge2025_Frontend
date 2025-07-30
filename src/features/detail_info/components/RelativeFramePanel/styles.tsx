// src/features/frame-carousel/components/styles.ts

  // A reusable focus ring style for accessibility on interactive elements
  const focusRingClass = 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-cyan-400';

  // === Main Carousel Container ===
  // Enhanced with a subtle gradient background and a colorful top border.
  export const containerClass = `
    absolute inset-x-0 bottom-0 h-[35vh]
    bg-gradient-to-t from-slate-900/90 via-slate-950/85 to-black/80
    backdrop-blur-xl
    border-t-2 border-blue-500/20
    shadow-2xl shadow-black/60
    transition-all duration-300 ease-out
  `;

  // === Close Button ===
  // Made slightly more distinct with a brighter hover effect.
  export const closeButtonClass = `
    absolute top-3 right-3 z-20
    flex items-center justify-center
    w-8 h-8
    bg-white/10 hover:bg-white/25 active:bg-white/15
    rounded-full
    text-white/70 hover:text-white
    transition-all duration-200 ease-out
    hover:scale-110 active:scale-100
    ${focusRingClass}
  `;

  // === Loading State ===
// No major changes, this is already clean and effective.
export const loadingOverlayClass = `
  absolute inset-0 z-30
  flex items-center justify-center
  bg-slate-900/60 backdrop-blur-md
  transition-opacity duration-200
`;
export const loadingSpinnerClass = `
  w-8 h-8
  border-2 border-white/20 border-t-cyan-400
  rounded-full
  animate-spin
`;

// === Swiper & Slide Styles ===
export const swiperWrapperClass = 'items-center';

// === FrameItemSlide Component Styles ===

// Base wrapper for a single slide. Contains transitions and group context.
export const slideContentWrapperClass = `
  flex flex-col items-center justify-center h-full
  p-1 rounded-xl // Padding allows the ring/border to have space
  group
  transition-all duration-300 ease-in-out
  transform-gpu
`;

// Style for the currently ACTIVE slide.
// Features full opacity, a vibrant colored shadow, and a crisp border.
export const activeSlideClass = `
  opacity-100
  scale-100
  shadow-[0_0_25px_rgba(0,255,255,0.3),_0_0_15px_rgba(180,80,255,0.2)]
  ring-1 ring-white/30
`;

// Style for INACTIVE slides.
// They are smaller, desaturated, and mostly transparent.
export const inactiveSlideClass = `
  scale-90
  opacity-50
  saturate-50
  hover:opacity-100 hover:scale-95 hover:saturate-100
`;

// Container for the image. Relative positioning for the glow effect.
export const imageContainerClass = 'relative';

// The frame image itself. Transitions for smooth hover effects.
export const imageClass = `
  h-[25vh] w-auto
  rounded-lg object-contain
  shadow-lg
  transition-all duration-300 ease-in-out
`;

// A vibrant glow effect, conditionally rendered ONLY for the active slide.
export const activeImageGlowClass = `
  absolute -inset-3
  rounded-xl
  bg-gradient-to-r from-purple-600/30 via-blue-500/30 to-cyan-500/30
  blur-2xl
  transition-opacity duration-300
  pointer-events-none
`;

// Info panel below the image. It will now animate in.
export const infoPanelClass = `
  mt-3 px-4 py-1
  bg-black/30 backdrop-blur-sm
  rounded-full border border-white/10
  text-center text-xs
  transition-all duration-300 ease-in-out
  // Hidden by default on inactive slides...
  opacity-0 translate-y-2
  // ...and revealed on hover or when the slide is active.
  group-hover:opacity-100 group-hover:translate-y-0
`;

// Flex container for the info content.
export const infoContentClass = 'flex items-center justify-center space-x-5 text-white/90';

// Styles for the "Time" and "Conf" labels and values.
export const infoSectionClass = 'flex items-baseline space-x-1.5';
export const infoLabelClass = 'text-white/60 font-medium';
export const infoValueClass = 'font-mono tracking-wider text-white';