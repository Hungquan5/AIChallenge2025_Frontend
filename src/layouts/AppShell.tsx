import React from 'react';

interface AppShellProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ leftPanel, rightPanel }) => {
  return (
    <div className="flex min-h-screen max-h-screen bg-[#FDF5E6] text-black">
      {/* Left Panel */}
      <aside className="w-[18%] h-screen bg-white/70 backdrop-blur-sm border-r border-gray-300 overflow-y-auto text-black pl-1 pr-0 pb-1 pt-1">
        {leftPanel}
      </aside>

      {/* Right Panel with independent scroll */}
      <main className="flex-1 h-screen overflow-hidden">
        <div className="h-full overflow-y-auto text-black">
          {rightPanel}
        </div>
      </main>
    </div>
  );
};

export default AppShell;
