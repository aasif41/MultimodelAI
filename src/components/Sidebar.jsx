import { MessageSquarePlus, MessageSquare, Trash2, Settings, Orbit, PanelLeftClose, HelpCircle } from 'lucide-react';

export default function Sidebar({ sessions, currentSessionId, onNewChat, onSelectSession, onDeleteSession, onToggle }) {
  return (
    <div className="w-full h-full bg-[#0f1016] flex flex-col transition-all duration-300">
      
      {/* Header with Glowing Logo & Toggle */}
      <div className="p-4 flex items-center justify-between border-b border-white/5 bg-[#0f1016]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-[0_0_15px_rgba(124,58,237,0.35)] flex items-center justify-center">
            <Orbit className="w-4 h-4 text-white animate-spin-slow" />
          </div>
          <span className="font-extrabold text-sm tracking-wider bg-gradient-to-r from-white via-gray-100 to-purple-400 bg-clip-text text-transparent">
            ANTIGRAVITY AI
          </span>
        </div>
        <button 
          onClick={onToggle}
          className="hidden md:block p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all hover:scale-105"
          title="Collapse Sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(124,58,237,0.15)] hover:shadow-[0_4px_20px_rgba(124,58,237,0.3)] hover:scale-[1.01] active:scale-[0.99]"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 scrollbar-thin">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-3">Recent Chats</div>
        
        {sessions.length === 0 ? (
          <div className="px-3 py-4 text-xs text-gray-500 italic">No conversation history</div>
        ) : (
          <div className="space-y-1">
            {sessions.map(session => {
              const isActive = currentSessionId === session.id;
              return (
                <div 
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`group flex items-center justify-between cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 border ${
                    isActive 
                      ? 'bg-white/5 border-white/5 text-white shadow-sm' 
                      : 'border-transparent text-gray-400 hover:bg-white/[0.02] hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden text-xs">
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-purple-400' : 'opacity-60'
                    }`} />
                    <span className="truncate font-medium">{session.title || 'New Conversation'}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-white/5 flex flex-col gap-1.5 bg-[#0d0e13]">
        <button className="flex items-center gap-3 text-xs text-gray-400 hover:text-white px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all">
          <Settings className="w-4 h-4 text-gray-500" />
          <span className="font-medium">Settings</span>
        </button>
        <button className="flex items-center gap-3 text-xs text-gray-400 hover:text-white px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all">
          <HelpCircle className="w-4 h-4 text-gray-500" />
          <span className="font-medium">Help & Feedback</span>
        </button>
      </div>
    </div>
  );
}

