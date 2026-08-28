import { useState } from 'react';
import { Menu, X, PanelLeft, Orbit } from 'lucide-react';

export default function ChatLayout({ sidebar, children, isCollapsed, onToggle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#0b0c10] text-gray-200 overflow-hidden font-sans relative">
      
      {/* Deep Space Ambient Glow Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/75 z-40 transition-opacity md:hidden backdrop-blur-sm ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar Container */}
      {/* Mobile view */}
      <div 
        className={`fixed md:hidden inset-y-0 left-0 z-50 transform transition-transform duration-300 w-72 bg-[#17171d] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebar}
        {/* Close Button for Mobile */}
        <button 
          className="absolute top-4 -right-12 text-white bg-black/60 p-2 rounded-xl border border-white/5 backdrop-blur-md"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop view (collapsible) */}
      <div 
        className={`hidden md:block h-full transition-all duration-300 ease-in-out flex-shrink-0 z-20 ${
          isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-72 border-r border-white/5 bg-[#121319]'
        }`}
      >
        {sidebar}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-transparent z-10 relative">
        
        {/* Premium Unified Header */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-[#0b0c10]/40 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Toggle */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-gray-400 hover:text-white transition-all hover:scale-105 p-2 rounded-xl hover:bg-white/5 border border-white/5"
              title="Show Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Sidebar Toggle (Visible only when collapsed) */}
            {isCollapsed && (
              <button 
                onClick={onToggle}
                className="hidden md:block p-2 rounded-xl hover:bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all hover:scale-105"
                title="Show Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            {/* Branding Logo */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-[0_0_12px_rgba(124,58,237,0.25)] flex items-center justify-center">
                <Orbit className="w-3.5 h-3.5 text-white animate-spin-slow" />
              </div>
              <span className="font-extrabold text-xs tracking-wider text-gray-100">ANTIGRAVITY AI</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold font-mono hidden sm:inline">Active</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] md:text-[10px] text-gray-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5 font-semibold font-mono uppercase tracking-wider">
              LPU Inference
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden">
          {children}
        </div>
      </div>

    </div>
  );
}


