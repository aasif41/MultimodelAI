import { useState, useCallback } from 'react';
import ChatLayout from './components/ChatLayout';
import Sidebar from './components/Sidebar';
import ChatPage from './pages/ChatPage';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import { v4 as uuidv4 } from 'uuid';
import { deleteMedia } from './utils/db';

export default function App() {
  const [sessions, setSessions] = useState(() => {
    const storedChats = JSON.parse(localStorage.getItem('ai_chats') || '{}');
    return Object.values(storedChats).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  });

  // Restore last active session so refreshing doesn't lose the open chat
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    const savedId = localStorage.getItem('current_session_id');
    const storedChats = JSON.parse(localStorage.getItem('ai_chats') || '{}');
    if (savedId && storedChats[savedId]) {
      return savedId;
    }
    const loadedSessions = Object.values(storedChats).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    if (loadedSessions.length > 0) {
      return loadedSessions[0].id;
    }
    const newId = uuidv4();
    localStorage.setItem('current_session_id', newId);
    return newId;
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const newVal = !prev;
      localStorage.setItem('sidebar_collapsed', newVal);
      return newVal;
    });
  };

  const handleSelectSession = (id) => {
    setCurrentSessionId(id);
    localStorage.setItem('current_session_id', id);
  };

  const handleNewChat = () => {
    const newId = uuidv4();
    setCurrentSessionId(newId);
    localStorage.setItem('current_session_id', newId);
  };

  const handleUpdateSessions = useCallback((updatedList) => {
    const sortedList = [...updatedList].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    setSessions(sortedList);
  }, []);

  const handleRenameSession = (id, newTitle) => {
    const storedChats = JSON.parse(localStorage.getItem('ai_chats') || '{}');
    if (storedChats[id]) {
      storedChats[id].title = newTitle;
      storedChats[id].updatedAt = Date.now();
      localStorage.setItem('ai_chats', JSON.stringify(storedChats));
      handleUpdateSessions(Object.values(storedChats));
    }
  };

  const handleDeleteSession = async (id) => {
    const storedChats = JSON.parse(localStorage.getItem('ai_chats') || '{}');
    const sessionToDelete = storedChats[id];
    
    if (sessionToDelete && sessionToDelete.messages) {
      for (const msg of sessionToDelete.messages) {
        if (msg.mediaId) {
          await deleteMedia(msg.mediaId);
        }
      }
    }

    delete storedChats[id];
    localStorage.setItem('ai_chats', JSON.stringify(storedChats));
    
    const remainingSessions = Object.values(storedChats);
    handleUpdateSessions(remainingSessions);
    
    if (currentSessionId === id) {
      if (remainingSessions.length > 0) {
        handleSelectSession(remainingSessions[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleClearAllChats = async () => {
    const storedChats = JSON.parse(localStorage.getItem('ai_chats') || '{}');
    for (const session of Object.values(storedChats)) {
      if (session.messages) {
        for (const msg of session.messages) {
          if (msg.mediaId) {
            await deleteMedia(msg.mediaId);
          }
        }
      }
    }

    localStorage.removeItem('ai_chats');
    localStorage.removeItem('current_session_id');
    setSessions([]);
    handleNewChat();
  };

  return (
    <>
      <ChatLayout 
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
        sidebar={
          <Sidebar 
            sessions={sessions} 
            currentSessionId={currentSessionId}
            onNewChat={handleNewChat}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            onToggle={toggleSidebar}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenHelp={() => setIsHelpOpen(true)}
          />
        }
      >
        <ChatPage 
          key={currentSessionId}
          sessionId={currentSessionId} 
          onUpdateSessions={handleUpdateSessions}
        />
      </ChatLayout>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onClearAllChats={handleClearAllChats}
      />

      {/* Help Modal */}
      <HelpModal 
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </>
  );
}