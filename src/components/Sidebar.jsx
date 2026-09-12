import { useState, useRef, useEffect } from 'react';
import { Plus, MessageSquare, PanelLeftClose, Settings, HelpCircle, Search, MoreHorizontal, Edit2, Trash2, Check } from 'lucide-react';
import Logo from './Logo';

export default function Sidebar({ 
  sessions = [], 
  currentSessionId, 
  onNewChat, 
  onSelectSession, 
  onDeleteSession, 
  onRenameSession,
  onToggle,
  onOpenSettings,
  onOpenHelp
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuSessionId, setActiveMenuSessionId] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef(null);
  const menuRef = useRef(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuSessionId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus inline edit input
  useEffect(() => {
    if (editingSessionId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingSessionId]);

  const filteredSessions = sessions.filter(s => {
    const title = s.title || 'New Conversation';
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleStartRename = (session, e) => {
    e.stopPropagation();
    setActiveMenuSessionId(null);
    setEditingSessionId(session.id);
    setEditTitle(session.title || 'New Conversation');
  };

  const handleSaveRename = (sessionId) => {
    const trimmed = editTitle.trim();
    if (trimmed && onRenameSession) {
      onRenameSession(sessionId, trimmed);
    }
    setEditingSessionId(null);
  };

  const handleKeyDownRename = (e, sessionId) => {
    if (e.key === 'Enter') {
      handleSaveRename(sessionId);
    } else if (e.key === 'Escape') {
      setEditingSessionId(null);
    }
  };

  return (
    <div className="w-full h-full bg-[#1D1C22] flex flex-col select-none">
      
      {/* Header with Logo + Wordmark */}
      <div className="p-4 flex items-center justify-between border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <Logo className="w-6 h-6" />
          <span className="font-serif text-lg font-medium tracking-tight text-[#EDEAE3]">
            Space
          </span>
        </div>
        <button 
          onClick={onToggle}
          className="hidden md:flex p-1.5 rounded-lg text-[#A6A2AE] hover:text-[#EDEAE3] hover:bg-white/[0.06] transition-colors"
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3 pb-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C97B4A] hover:bg-[#DA8E5D] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Search Input Box */}
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#26242C] border border-white/[0.08] rounded-xl focus-within:border-[#C97B4A] transition-colors">
          <Search className="w-3.5 h-3.5 text-[#716D7A] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-transparent text-xs text-[#EDEAE3] placeholder-[#716D7A] outline-none"
          />
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 scrollbar-thin">
        <div className="text-[10px] font-semibold text-[#716D7A] uppercase tracking-wider px-2 py-1">
          Recent
        </div>

        {filteredSessions.length === 0 ? (
          <div className="px-3 py-4 text-xs text-[#716D7A] italic">
            {searchQuery ? 'No matching conversations' : 'No conversations yet'}
          </div>
        ) : (
          filteredSessions.map(session => {
            const isActive = currentSessionId === session.id;
            const isEditing = editingSessionId === session.id;
            const isMenuOpen = activeMenuSessionId === session.id;

            return (
              <div 
                key={session.id}
                onClick={() => {
                  if (!isEditing) onSelectSession(session.id);
                }}
                className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-xs ${
                  isActive 
                    ? 'border-l-2 border-l-[#C97B4A] bg-[#26242C] text-[#EDEAE3] font-medium' 
                    : 'text-[#A6A2AE] hover:bg-white/[0.04] hover:text-[#EDEAE3]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#C97B4A]' : 'opacity-60'}`} />
                  
                  {isEditing ? (
                    <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleSaveRename(session.id)}
                        onKeyDown={(e) => handleKeyDownRename(e, session.id)}
                        className="w-full bg-[#1D1C22] border border-[#C97B4A] rounded px-1.5 py-0.5 text-xs text-[#EDEAE3] outline-none"
                      />
                      <button 
                        onClick={() => handleSaveRename(session.id)}
                        className="p-1 text-[#7A9B76] hover:bg-white/[0.06] rounded"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="truncate">{session.title || 'New Conversation'}</span>
                  )}
                </div>

                {!isEditing && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuSessionId(isMenuOpen ? null : session.id);
                      }}
                      className={`p-1 rounded-md text-[#A6A2AE] hover:text-[#EDEAE3] hover:bg-white/[0.06] transition-opacity ${
                        isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      title="More options"
                      aria-label="More options"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>

                    {/* Context Dropdown */}
                    {isMenuOpen && (
                      <div 
                        ref={menuRef}
                        className="absolute right-0 top-full mt-1 w-28 bg-[#26242C] border border-white/[0.1] rounded-xl shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => handleStartRename(session, e)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#EDEAE3] hover:bg-white/[0.06] text-left"
                        >
                          <Edit2 className="w-3 h-3 text-[#A6A2AE]" />
                          <span>Rename</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuSessionId(null);
                            onDeleteSession(session.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#D9695F] hover:bg-[#D9695F]/10 text-left"
                        >
                          <Trash2 className="w-3 h-3 text-[#D9695F]" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-white/[0.08] flex flex-col gap-1 bg-[#17161B]">
        <button 
          onClick={onOpenSettings}
          className="flex items-center gap-2.5 text-xs text-[#A6A2AE] hover:text-[#EDEAE3] px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left cursor-pointer"
        >
          <Settings className="w-4 h-4 text-[#716D7A]" />
          <span>Settings</span>
        </button>
        <button 
          onClick={onOpenHelp}
          className="flex items-center gap-2.5 text-xs text-[#A6A2AE] hover:text-[#EDEAE3] px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-[#716D7A]" />
          <span>Help & Feedback</span>
        </button>
      </div>

    </div>
  );
}
