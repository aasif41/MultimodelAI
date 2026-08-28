import { useState, useEffect } from 'react';
import ChatLayout from './components/ChatLayout';
import Sidebar from './components/Sidebar';
import ChatPage from './pages/ChatPage';
import { v4 as uuidv4 } from 'uuid';
import { deleteMedia } from './utils/db';

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const newVal = !prev;
      localStorage.setItem('sidebar_collapsed', newVal);
      return newVal;
    });
  };

  function handleNewChat() {
    const newId = uuidv4();
    setCurrentSessionId(newId);
  }

  const handleUpdateSessions = (updatedList) => {
    const sortedList = [...updatedList].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    setSessions(sortedList);
  };

  // Load initial sessions from local storage
  useEffect(() => {
    const storedChats = JSON.parse(localStorage.getItem('ai_chats') || '{}');
    const loadedSessions = Object.values(storedChats);
    handleUpdateSessions(loadedSessions);
    
    // Always start with a new chat on website load
    handleNewChat();
  }, []);

  const handleDeleteSession = async (id) => {
    const storedChats = JSON.parse(localStorage.getItem('ai_chats') || '{}');
    const sessionToDelete = storedChats[id];
    
    if (sessionToDelete && sessionToDelete.messages) {
      // Find all mediaIds and delete them from IndexedDB
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
      handleNewChat();
    }
  };

  return (
    <ChatLayout 
      isCollapsed={isSidebarCollapsed}
      onToggle={toggleSidebar}
      sidebar={
        <Sidebar 
          sessions={sessions} 
          currentSessionId={currentSessionId}
          onNewChat={handleNewChat}
          onSelectSession={setCurrentSessionId}
          onDeleteSession={handleDeleteSession}
          onToggle={toggleSidebar}
        />
      }
    >
      <ChatPage 
        key={currentSessionId} // Forces remount when id changes
        sessionId={currentSessionId} 
        onUpdateSessions={handleUpdateSessions}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={toggleSidebar}
      />
    </ChatLayout>
  );
}