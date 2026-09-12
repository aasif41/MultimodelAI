import { useState, useRef, useEffect } from 'react';
import { Menu, X, PanelLeft, ChevronDown, Check } from 'lucide-react';
import Logo from './Logo';

export default function ChatLayout({ sidebar, children, isCollapsed, onToggle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Space 1.5');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef(null);

  const models = [
    { id: 'space-1.5', name: 'Space 1.5', desc: 'Fast, multimodal LPU inference' },
    { id: 'space-pro', name: 'Space Pro', desc: 'Complex reasoning & vision' },
    { id: 'space-flash', name: 'Space Flash', desc: 'Ultra low-latency queries' },
  ];


  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
        setModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#17161B] text-[#EDEAE3] overflow-hidden font-sans relative">
      
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity md:hidden ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar Container */}
      {/* Mobile view */}
      <div 
        className={`fixed md:hidden inset-y-0 left-0 z-50 transform transition-transform duration-200 w-72 bg-[#1D1C22] border-r border-white/[0.08] shadow-xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebar}
        {/* Close Button for Mobile */}
        <button 
          className="absolute top-3.5 -right-11 text-[#EDEAE3] bg-[#1D1C22] p-2 rounded-xl border border-white/[0.08] hover:bg-[#26242C] transition-colors"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Desktop view (collapsible) */}
      <div 
        className={`hidden md:block h-full transition-all duration-200 ease-in-out flex-shrink-0 z-20 ${
          isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-72 border-r border-white/[0.08] bg-[#1D1C22]'
        }`}
      >
        {sidebar}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#17161B] z-10 relative">
        
        {/* Restrained Top Header */}
        <div className="h-14 border-b border-white/[0.08] flex items-center justify-between px-4 md:px-6 bg-[#1D1C22]/80 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Toggle */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-[#A6A2AE] hover:text-[#EDEAE3] p-1.5 rounded-lg hover:bg-white/[0.04] border border-white/[0.08] transition-colors"
              title="Show Sidebar"
              aria-label="Show Sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Desktop Sidebar Toggle (when collapsed) */}
            {isCollapsed && (
              <button 
                onClick={onToggle}
                className="hidden md:flex p-1.5 rounded-lg hover:bg-white/[0.04] border border-white/[0.08] text-[#A6A2AE] hover:text-[#EDEAE3] transition-colors"
                title="Show Sidebar"
                aria-label="Show Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            {/* Wordmark + Status Dot */}
            <div className="flex items-center gap-2.5">
              <Logo className="w-5 h-5" />
              <span className="font-serif font-medium text-sm tracking-tight text-[#EDEAE3]">
                Space
              </span>
              <span 
                className="h-1.5 w-1.5 rounded-full bg-[#7A9B76] ml-0.5" 
                title="Connected" 
              />
            </div>
          </div>

          {/* Model Badge with Dropdown */}
          <div className="relative" ref={modelDropdownRef}>
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#26242C] hover:bg-[#2e2c36] border border-white/[0.08] rounded-full text-xs font-medium text-[#EDEAE3] transition-colors cursor-pointer"
            >
              <span>{selectedModel}</span>
              <ChevronDown className="w-3 h-3 text-[#A6A2AE]" />
            </button>

            {modelDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#26242C] border border-white/[0.1] rounded-xl shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-[#716D7A]">
                  Select Model
                </div>
                {models.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedModel(m.name);
                      setModelDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/[0.04] transition-colors"
                  >
                    <div>
                      <div className="text-xs font-medium text-[#EDEAE3]">{m.name}</div>
                      <div className="text-[10px] text-[#716D7A]">{m.desc}</div>
                    </div>
                    {selectedModel === m.name && (
                      <Check className="w-3.5 h-3.5 text-[#C97B4A] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden">
          {children}
        </div>
      </div>

    </div>
  );
}
