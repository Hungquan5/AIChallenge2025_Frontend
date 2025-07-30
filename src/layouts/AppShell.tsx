// AppShell.tsx
import React from 'react';

interface AppShellProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  searchButton: React.ReactNode;
  // Add a new optional prop for the carousel overlay
  carouselOverlay?: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ leftPanel, rightPanel, searchButton, carouselOverlay }) => {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 text-slate-900">
      {/* Left Panel - No changes needed here */}
      <aside className="w-[320px] min-w-[320px] max-w-[400px] h-screen bg-gradient-to-b from-white/95 to-slate-50/95 backdrop-blur-md border-slate-200/60 shadow-xl relative">
        <div className="h-full overflow-y-auto pb-16 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {leftPanel}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-white/98 via-white/95 to-transparent backdrop-blur-sm border-t border-slate-200/40">
          {searchButton}
        </div>
      </aside>

      {/* Right-side Container */}
      {/* This new container acts as the positioning parent for the main content and the carousel. */}
      <div className="relative flex-1">
        {/* Right Panel Content */}
        <main className="h-screen overflow-hidden bg-white/30 backdrop-blur-sm">
          <div className="h-full overflow-y-auto text-slate-900 scrollbar-thin scrollbar-thumb-slate-300/50 scrollbar-track-transparent">
            <div className="min-h-full bg-gradient-to-br from-white/40 to-transparent">
              {rightPanel}
            </div>
          </div>
        </main>

        {/* Carousel Overlay Panel */}
        {/* Render the carousel here. Its absolute positioning will be constrained to this container. */}
        {carouselOverlay}
      </div>
    </div>
  );
};

export default AppShell;