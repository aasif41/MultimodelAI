import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import ChatInputBar from '../components/ChatInputBar';
import { askChat, uploadImageAndAsk } from '../api/aiService';
import { Bot, User, Orbit } from 'lucide-react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { getMedia, storeMedia } from '../utils/db';
import StreamingText from '../components/StreamingText';
import ThinkingIndicator from '../components/ThinkingIndicator';
import { v4 as uuidv4 } from 'uuid';

export default function ChatPage({ sessionId, onUpdateSessions }) {
  const [messages, setMessages] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState(null);
  const [activeMediaFile, setActiveMediaFile] = useState(null);
  const scrollRef = useRef(null);

  const isProcessing = isFetching || !!streamingResponse;

  // Load from session storage
  useEffect(() => {
    const loadSession = async () => {
      if (sessionId) {
        const storedChats = JSON.parse(localStorage.getItem('ai_chats') || '{}');
        if (storedChats[sessionId]) {
          const loadedMessages = storedChats[sessionId].messages || [];
          
          // Hydrate media URLs from IndexedDB
          const hydratedMessages = await Promise.all(loadedMessages.map(async (msg) => {
            if (msg.mediaId) {
              const blob = await getMedia(msg.mediaId);
              if (blob) {
                return {
                  ...msg,
                  _mediaUrl: URL.createObjectURL(blob)
                };
              }
            }
            return msg;
          }));
          
          setMessages(hydratedMessages);
        } else {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    };
    
    loadSession();
  }, [sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isProcessing, streamingResponse]);

  const handleScroll = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "auto" });
    }
  };

  // Save to local storage whenever messages update
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      const storedChats = JSON.parse(localStorage.getItem('ai_chats') || '{}');
      let titleText = '';
      const firstContent = messages[0]?.content;
      if (typeof firstContent === 'string') {
        titleText = firstContent;
      } else if (Array.isArray(firstContent)) {
        titleText = firstContent.find(c => c.type === 'text')?.text || 'New Chat';
      }
      const title = titleText.substring(0, 30) + (titleText.length > 30 ? '...' : '') || 'New Chat';
      
      // Preserve existing timestamp if present, otherwise set now
      const existingSession = storedChats[sessionId];
      const updatedAt = existingSession?.updatedAt || Date.now();

      storedChats[sessionId] = { id: sessionId, title, messages, updatedAt };
      localStorage.setItem('ai_chats', JSON.stringify(storedChats));
      onUpdateSessions(Object.values(storedChats));
    }
  }, [messages, sessionId]);

  const handleSendMessage = async ({ text, media }) => {
    if (!text && !media) return;

    let outgoingContent = text || "Attached media file";
    let mediaId = null;
    let localMediaUrl = null;

    if (media) {
      mediaId = uuidv4();
      await storeMedia(mediaId, media);
      localMediaUrl = URL.createObjectURL(media);
      setActiveMediaFile(media);
    } else {
      setActiveMediaFile(null);
    }

    const newMessageObj = {
      role: 'user',
      content: outgoingContent,
      mediaId: mediaId,
      _mediaUrl: localMediaUrl,
      _mediaType: media ? media.type : null,
    };

    const updatedMessages = [...messages, newMessageObj];
    setMessages(updatedMessages);
    setIsFetching(true);

    try {
      let res;
      if (media && media.type.startsWith('image')) {
        res = await uploadImageAndAsk(media, text || '');
      } else {
        // Backend handles pure text history now
        const backendPayload = updatedMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        res = await askChat(backendPayload);
      }

      // If backend updated messages (e.g., append video transcript)
      if (res.updatedMessages && res.updatedMessages.length === updatedMessages.length) {
        // Sync the latest content back to our state keeping our local ui meta intact
        updatedMessages[updatedMessages.length - 1].content = res.updatedMessages[res.updatedMessages.length - 1].content;
      }

      // Set timestamp updated when we actually communicate/send a message
      const storedChats = JSON.parse(localStorage.getItem('ai_chats') || '{}');
      if (storedChats[sessionId]) {
        storedChats[sessionId].updatedAt = Date.now();
        localStorage.setItem('ai_chats', JSON.stringify(storedChats));
      }

      setStreamingResponse(res.answer);
      
    } catch (err) {
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: `**Error:** ${err}` }
      ]);
    } finally {
      setIsFetching(false);
      setActiveMediaFile(null);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0b0c10]">

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-12 py-8 space-y-6 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[80%] max-w-3xl mx-auto text-center px-4 md:py-12 fade-in">
            <div className="mb-6 p-5 rounded-3xl bg-gradient-to-tr from-purple-500/10 to-indigo-500/10 border border-purple-500/20 inline-block shadow-[0_0_30px_rgba(168,85,247,0.15)] animate-breathe">
              <Orbit className="w-9 h-9 text-purple-400 animate-spin-slow" />
            </div>
            <h2 className="text-3xl font-extrabold mb-3 tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
              What can I help you build?
            </h2>
            <p className="text-sm text-gray-400 max-w-md mb-10 leading-relaxed">
              Upload images, analyze videos, or just start a conversation with the fastest LPU-powered Multimodal intelligence.
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full space-y-8 pb-10">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              
              // We safely extract text. If backend changed it to array, pull the text.
              let textToRender = msg.content;
              if (Array.isArray(msg.content)) {
                textToRender = msg.content.find(c => c.type === 'text')?.text || '';
              }
              if (typeof textToRender !== 'string') {
                textToRender = String(textToRender || '');
              }

              return (
                <div key={idx} className={`flex gap-4 animate-message ${isUser ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                    isUser 
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-[0_0_12px_rgba(79,70,229,0.35)]' 
                      : 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                  }`}>
                    {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                  </div>
                  
                  <div className={`flex flex-col gap-2.5 max-w-[85%] ${isUser ? 'text-right items-end' : 'text-left items-start'}`}>
                    
                    {msg._mediaUrl && (
                       msg._mediaType?.startsWith('video') ? (
                         <video src={msg._mediaUrl} controls className="max-w-md rounded-2xl overflow-hidden glass-dark border border-white/5 shadow-2xl transition-all hover:scale-[1.01]" />
                       ) : msg._mediaType?.startsWith('image') ? (
                         <img src={msg._mediaUrl} alt="attachment" className="max-w-md rounded-2xl overflow-hidden border border-white/5 shadow-2xl transition-all hover:scale-[1.01]" />
                       ) : null
                    )}

                    <div className={`px-5 py-3.5 rounded-2xl shadow-md border ${
                      isUser 
                        ? 'bg-gradient-to-tr from-[#1b1c24] to-[#252631] text-gray-100 rounded-tr-sm border-white/5' 
                        : 'bg-white/[0.01] text-gray-200 border-white/[0.02]'
                    }`}>
                      <ErrorBoundary>
                        <div className="prose prose-invert max-w-none text-sm md:text-base leading-relaxed break-words markdown-body">
                          <ReactMarkdown>
                            {textToRender}
                          </ReactMarkdown>
                        </div>
                      </ErrorBoundary>
                    </div>
                  </div>
                </div>
              );
            })}

            {isFetching && (
              <ThinkingIndicator hasMedia={!!activeMediaFile} />
            )}

            {streamingResponse && (
              <div className="flex gap-4 animate-message">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-[0_0_12px_rgba(16,185,129,0.35)]">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col gap-2.5 max-w-[85%] text-left items-start">
                  <div className="px-5 py-3.5 rounded-2xl bg-white/[0.01] text-gray-200 shadow-md border border-white/[0.02]">
                    <StreamingText 
                      content={streamingResponse} 
                      onIteration={handleScroll}
                      onComplete={() => {
                        setMessages(prev => [...prev, { role: 'assistant', content: streamingResponse }]);
                        setStreamingResponse(null);
                      }} 
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-gradient-to-t from-[#0b0c10] via-[#0b0c10]/95 to-transparent pt-4">
        <ChatInputBar onSendMessage={handleSendMessage} isProcessing={isProcessing} />
      </div>

    </div>
  );
}


