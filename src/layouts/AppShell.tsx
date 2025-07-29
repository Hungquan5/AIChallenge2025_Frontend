import React from 'react';

interface AppShellProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  searchButton: React.ReactNode; // Add search button as separate prop
}

const AppShell: React.FC<AppShellProps> = ({ leftPanel, rightPanel, searchButton }) => {
  return (
    <div className="flex bg-gradient-to-br from-slate-50 to-blue-50/30 text-slate-900">
      {/* Left Panel - Input Panel */}
      <aside className="w-[320px] min-w-[320px] max-w-[400px] h-screen bg-gradient-to-b from-white/95 to-slate-50/95 backdrop-blur-md border-slate-200/60 shadow-xl relative">
        {/* Scrollable content area with bottom padding for search button */}
        <div className="h-full overflow-y-auto pb-16 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {leftPanel}
        </div>
        
        {/* Fixed search button container at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-white/98 via-white/95 to-transparent backdrop-blur-sm border-t border-slate-200/40">
          {searchButton}
        </div>
      </aside>

      {/* Subtle divider */}
      {/* <div className="w-px bg-gradient-to-b from-transparent via-slate-300/40 to-transparent"></div> */}

      {/* Right Panel with independent scroll */}
      <main className="flex-1 h-screen overflow-hidden bg-white/30 backdrop-blur-sm">
        <div className="h-full overflow-y-auto text-slate-900 scrollbar-thin scrollbar-thumb-slate-300/50 scrollbar-track-transparent">
          <div className="min-h-full bg-gradient-to-br from-white/40 to-transparent">
            {rightPanel}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppShell;