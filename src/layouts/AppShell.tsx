import React from 'react';

interface AppShellProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ leftPanel, rightPanel }) => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Left Panel - very narrow */}
      <aside className="w-[15%] h-screen bg-white/10 backdrop-blur-md border-r border-white/20 p-3 overflow-y-auto">
        {leftPanel}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        {rightPanel}
      </main>
    </div>
  );
};

export default AppShell;
