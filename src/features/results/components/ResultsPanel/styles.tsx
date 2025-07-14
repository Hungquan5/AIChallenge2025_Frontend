// styles.ts

export const containerClass = 'space-y-4 pb-8';
export const groupContainerClass = 'space-y-6'; // Reduced spacing
export const groupTitleClass = 'text-lg font-bold text-white mb-3'; // Smaller title
export const gridClass = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'; // More columns, smaller gap
export const cardClass = 'bg-white/10 rounded-lg border border-white/20 overflow-hidden hover:border-purple-500/50'; // Simplified card
export const imageContainerClass = 'relative aspect-[4/3] overflow-hidden bg-black/20'; // 4:3 ratio for better grid fit
export const imageClass = 'w-full h-full object-cover'; // Always cover for consistency
export const imageOverlayClass = 'absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity';
export const contentClass = 'p-2 text-xs'; // Reduced padding, smaller text
export const titleClass = 'text-white font-medium truncate'; // Single line title
export const confidenceClass = 'text-gray-400 mt-1';
export const timestampClass = 'text-gray-400';
export const videoIdClass = 'text-gray-500 hidden'; // Hide video ID by default
export const noResultsClass = 'text-center text-gray-400 py-8';
export const loadingClass = 'animate-pulse bg-white/10';
