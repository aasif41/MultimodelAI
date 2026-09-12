import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import ChatInputBar from '../components/ChatInputBar';
import { askChat, uploadImageAndAsk } from '../api/aiService';
import { User, Copy, Check, RotateCcw, ThumbsUp, ThumbsDown, X, Image as ImageIcon, Video, Lightbulb, BookOpen } from 'lucide-react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { getMedia, storeMedia } from '../utils/db';
import StreamingText from '../components/StreamingText';
import ThinkingIndicator from '../components/ThinkingIndicator';
import Logo from '../components/Logo';
import { v4 as uuidv4 } from 'uuid';

export default function ChatPage({ sessionId, onUpdateSessions }) {
  const [messages, setMessages] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState(null);
  const [isStoppedStreaming, setIsStoppedStreaming] = useState(false);
  const [activeMediaFile, setActiveMediaFile] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [feedbackState, setFeedbackState] = useState({}); // { [idx]: 'up' | 'down' }
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const inputBarRef = useRef(null);
  const scrollRef = useRef(null);

  const isProcessing = isFetching || !!streamingResponse;

  const suggestions = [
    { label: "Analyze an image", icon: <ImageIcon className="w-4 h-4 text-[#C97B4A]" />, prompt: "Analyze this image and describe the most important elements you notice:" },
    { label: "Summarize a video", icon: <Video className="w-4 h-4 text-[#C97B4A]" />, prompt: "Provide a concise summary of the key actions and dialogue in this video:" },
    { label: "Brainstorm ideas", icon: <Lightbulb className="w-4 h-4 text-[#C97B4A]" />, prompt: "Give me 5 creative, practical ideas to explore for:" },
    { label: "Explain a concept", icon: <BookOpen className="w-4 h-4 text-[#C97B4A]" />, prompt: "Explain how neural attention mechanisms work in simple, clear analogies:" }
  ];

  // Load session from storage
  useEffect(() => {
    const loadSession = async () => {
      if (sessionId) {
        const storedChats = JSON.parse(localStorage.getItem('ai_chats') || '{}');
        if (storedChats[sessionId]) {
          const loadedMessages = storedChats[sessionId].messages || [];
          
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

  // Save to local storage whenever messages change
  const onUpdateSessionsRef = useRef(onUpdateSessions);
  useEffect(() => {
    onUpdateSessionsRef.current = onUpdateSessions;
  });

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
      const title = titleText.substring(0, 32) + (titleText.length > 32 ? '...' : '') || 'New Chat';
      
      const existingSession = storedChats[sessionId];
      const updatedAt = existingSession?.updatedAt || Date.now();

      storedChats[sessionId] = { id: sessionId, title, messages, updatedAt };
      localStorage.setItem('ai_chats', JSON.stringify(storedChats));
      if (onUpdateSessionsRef.current) {
        onUpdateSessionsRef.current(Object.values(storedChats));
      }
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
    setIsStoppedStreaming(false);

    try {
      let res;
      if (media && media.type.startsWith('image')) {
        res = await uploadImageAndAsk(media, text || '');
      } else {
        const backendPayload = updatedMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        res = await askChat(backendPayload);
      }

      if (res.updatedMessages && res.updatedMessages.length === updatedMessages.length) {
        updatedMessages[updatedMessages.length - 1].content = res.updatedMessages[res.updatedMessages.length - 1].content;
      }

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

  // Copy message markdown to clipboard
  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Regenerate last assistant turn
  const handleRegenerate = async (idx) => {
    if (isProcessing) return;
    
    // Find preceding user message
    let precedingUserMsg = null;
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        precedingUserMsg = messages[i];
        break;
      }
    }
    if (!precedingUserMsg) return;

    // Slice messages up to the user message
    const trimmed = messages.slice(0, idx);
    setMessages(trimmed);
    setIsFetching(true);
    setIsStoppedStreaming(false);

    try {
      let res;
      if (precedingUserMsg.mediaId) {
        const blob = await getMedia(precedingUserMsg.mediaId);
        if (blob && blob.type.startsWith('image')) {
          res = await uploadImageAndAsk(blob, precedingUserMsg.content || '');
        } else {
          res = await askChat(trimmed.map(m => ({ role: m.role, content: m.content })));
        }
      } else {
        res = await askChat(trimmed.map(m => ({ role: m.role, content: m.content })));
      }

      setStreamingResponse(res.answer);
    } catch (err) {
      setMessages([
        ...trimmed,
        { role: 'assistant', content: `**Error:** ${err}` }
      ]);
    } finally {
      setIsFetching(false);
    }
  };

  const handleStopStreaming = () => {
    setIsStoppedStreaming(true);
  };

  const handleCompleteStreaming = (finalText) => {
    setMessages(prev => [...prev, { role: 'assistant', content: finalText }]);
    setStreamingResponse(null);
    setIsStoppedStreaming(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#17161B]">

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-12 py-8 space-y-6 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[80%] max-w-2xl mx-auto text-center px-4 py-8">
            
            {/* Flat Monogram Logo */}
            <div className="mb-5">
              <Logo className="w-10 h-10" />
            </div>

            {/* Restrained Fraunces Title */}
            <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-tight text-[#EDEAE3] mb-3">
              What would you like to explore?
            </h1>

            {/* Calm Subtitle */}
            <p className="text-sm text-[#A6A2AE] max-w-md mb-8 leading-relaxed">
              One assistant for text, vision, audio, and documents.
            </p>

            {/* 4 Flat Suggestion Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => inputBarRef.current?.setText(item.prompt)}
                  className="flex items-center gap-3 px-4 py-3 bg-[#26242C] hover:bg-[#2e2c36] border border-white/[0.08] hover:border-white/[0.16] rounded-xl text-left transition-all hover:-translate-y-0.5 cursor-pointer group"
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="text-xs font-medium text-[#EDEAE3]">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full space-y-6 pb-8">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              
              let textToRender = msg.content;
              if (Array.isArray(msg.content)) {
                textToRender = msg.content.find(c => c.type === 'text')?.text || '';
              }
              if (typeof textToRender !== 'string') {
                textToRender = String(textToRender || '');
              }

              return (
                <div key={idx} className={`flex gap-3 animate-message ${isUser ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  {isUser ? (
                    <div className="w-7 h-7 rounded-full bg-[#2C2A33] border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5 text-[#A6A2AE]">
                      <User className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-[#26242C] border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                      <Logo className="w-4 h-4" />
                    </div>
                  )}
                  
                  {/* Bubble Container */}
                  <div className={`flex flex-col gap-1.5 max-w-[85%] ${isUser ? 'items-end' : 'items-start group'}`}>
                    
                    {/* Media Attachments */}
                    {msg._mediaUrl && (
                       msg._mediaType?.startsWith('video') ? (
                         <video src={msg._mediaUrl} controls className="max-w-md rounded-xl overflow-hidden border border-white/[0.08] shadow-md" />
                       ) : msg._mediaType?.startsWith('image') ? (
                         <img 
                           src={msg._mediaUrl} 
                           alt="attachment" 
                           onClick={() => setLightboxUrl(msg._mediaUrl)}
                           className="max-w-md rounded-xl overflow-hidden border border-white/[0.08] shadow-md cursor-pointer hover:opacity-95 transition-opacity" 
                         />
                       ) : null
                    )}

                    {/* Bubble Content */}
                    <div className={`px-4 py-3 rounded-2xl text-sm md:text-base leading-relaxed break-words shadow-sm border ${
                      isUser 
                        ? 'bg-[#2C2A33] text-[#EDEAE3] rounded-tr-sm border-white/[0.06]' 
                        : 'bg-[#26242C] text-[#EDEAE3] rounded-tl-sm border-white/[0.08]'
                    }`}>
                      <ErrorBoundary>
                        <div className="prose prose-invert max-w-none text-sm md:text-base leading-relaxed break-words markdown-body text-[#EDEAE3]">
                          <ReactMarkdown>
                            {textToRender}
                          </ReactMarkdown>
                        </div>
                      </ErrorBoundary>
                    </div>

                    {/* Assistant Action Toolbar (Copy, Regenerate, Thumbs) */}
                    {!isUser && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-0.5 px-1">
                        <button
                          onClick={() => handleCopy(textToRender, idx)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-[#A6A2AE] hover:text-[#EDEAE3] rounded-md hover:bg-white/[0.04] transition-colors"
                          title="Copy response"
                        >
                          {copiedIdx === idx ? (
                            <>
                              <Check className="w-3 h-3 text-[#7A9B76]" />
                              <span className="text-[10px] text-[#7A9B76]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleRegenerate(idx)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-[#A6A2AE] hover:text-[#EDEAE3] rounded-md hover:bg-white/[0.04] transition-colors"
                          title="Regenerate response"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span className="text-[10px]">Regenerate</span>
                        </button>

                        <button
                          onClick={() => setFeedbackState(prev => ({ ...prev, [idx]: prev[idx] === 'up' ? null : 'up' }))}
                          className={`p-1 rounded-md transition-colors ${
                            feedbackState[idx] === 'up' ? 'text-[#7A9B76]' : 'text-[#716D7A] hover:text-[#EDEAE3]'
                          }`}
                          title="Good response"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => setFeedbackState(prev => ({ ...prev, [idx]: prev[idx] === 'down' ? null : 'down' }))}
                          className={`p-1 rounded-md transition-colors ${
                            feedbackState[idx] === 'down' ? 'text-[#D9695F]' : 'text-[#716D7A] hover:text-[#EDEAE3]'
                          }`}
                          title="Bad response"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}

            {isFetching && (
              <ThinkingIndicator hasMedia={!!activeMediaFile} />
            )}

            {streamingResponse && (
              <div className="flex gap-3 animate-message">
                <div className="w-7 h-7 rounded-lg bg-[#26242C] border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                  <Logo className="w-4 h-4" />
                </div>
                <div className="flex flex-col gap-1.5 max-w-[85%] items-start">
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#26242C] text-[#EDEAE3] shadow-sm border border-white/[0.08]">
                    <StreamingText 
                      content={streamingResponse} 
                      onIteration={handleScroll}
                      isStopped={isStoppedStreaming}
                      onComplete={handleCompleteStreaming} 
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
      <div className="bg-gradient-to-t from-[#17161B] via-[#17161B]/95 to-transparent pt-3">
        <ChatInputBar 
          ref={inputBarRef}
          onSendMessage={handleSendMessage} 
          isProcessing={isProcessing}
          isStreaming={!!streamingResponse}
          onStopStreaming={handleStopStreaming}
        />
      </div>

      {/* Image Lightbox Modal */}
      {lightboxUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={lightboxUrl} alt="expanded preview" className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl" />
            <button 
              onClick={() => setLightboxUrl(null)}
              className="absolute top-2 right-2 p-1.5 bg-[#17161B]/80 hover:bg-[#17161B] text-[#EDEAE3] rounded-lg border border-white/[0.1] transition-colors"
              aria-label="Close image preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
