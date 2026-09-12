import { useState, useRef, useEffect, useImperativeHandle } from 'react';
import { ArrowUp, Paperclip, FileVideo, Mic, Camera, X, Square } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { compressImage } from '../utils/imageCompressor';

export default function ChatInputBar({ 
  onSendMessage, 
  isProcessing, 
  isStreaming,
  onStopStreaming,
  ref 
}) {
  const [text, setText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const { videoRef, startCamera, stopCamera, captureFrame } = useCamera();
  const recognitionRef = useRef(null);

  // Expose imperative methods for suggestion chips
  useImperativeHandle(ref, () => ({
    setText: (val) => {
      setText(val);
      textareaRef.current?.focus();
    },
    focus: () => {
      textareaRef.current?.focus();
    }
  }));

  // Handle Voice Recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');
        
        if (event.results[0].isFinal) {
          setText((prev) => prev + (prev.length > 0 ? ' ' : '') + transcript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const handleMicClick = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
      } else {
        alert("Voice recognition is not supported in this browser.");
      }
    }
  };

  const handleCameraToggle = () => {
    if (isCameraActive) {
      stopCamera();
      setIsCameraActive(false);
    } else {
      setIsCameraActive(true);
      startCamera();
    }
  };

  const takePhoto = async () => {
    const dataUrl = captureFrame();
    if (dataUrl) {
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
        const compressedFile = await compressImage(file);
        const previewUrl = URL.createObjectURL(compressedFile);
        handleFileAttachment(compressedFile, previewUrl);
        handleCameraToggle();
      } catch (err) {
        console.error("Failed to capture and compress camera image:", err);
      }
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const compressedFile = await compressImage(file);
        const previewUrl = URL.createObjectURL(compressedFile);
        handleFileAttachment(compressedFile, previewUrl);
      } catch (err) {
        console.error("Failed to compress uploaded image:", err);
        const previewUrl = URL.createObjectURL(file);
        handleFileAttachment(file, previewUrl);
      }
    }
  };

  const handleFileAttachment = (file, previewUrl) => {
    setMediaFile(file);
    setMediaPreview(previewUrl);
  };

  const clearAttachment = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((!text.trim() && !mediaFile) || isProcessing) return;

    onSendMessage({
      text: text.trim(),
      media: mediaFile
    });

    setText('');
    clearAttachment();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto px-4 pb-6">
      
      {/* Camera Overlay */}
      {isCameraActive && (
        <div className="absolute bottom-full left-4 right-4 sm:left-auto sm:right-4 mb-3 p-3 bg-[#26242C] rounded-2xl border border-white/[0.1] shadow-2xl z-30">
          <div className="flex justify-between items-center mb-2 px-1 text-xs text-[#A6A2AE]">
            <span className="flex items-center gap-1.5 font-medium text-[#EDEAE3]">
              <span className="h-2 w-2 rounded-full bg-[#C97B4A]" />
              Webcam Live
            </span>
            <button 
              onClick={handleCameraToggle} 
              className="text-[#A6A2AE] hover:text-[#EDEAE3] p-1 rounded-md hover:bg-white/[0.06] transition-colors"
              aria-label="Close camera"
            >
              <X size={15} />
            </button>
          </div>
          <video 
            ref={videoRef} 
            className="w-full sm:w-80 h-auto rounded-xl bg-black object-cover aspect-video border border-white/[0.08]" 
            autoPlay playsInline muted
          />
          <button 
            onClick={takePhoto}
            className="w-full mt-2.5 py-2 bg-[#C97B4A] hover:bg-[#DA8E5D] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Capture Photo
          </button>
        </div>
      )}

      {/* Main Composer Box */}
      <div className="bg-[#26242C] border border-white/[0.08] rounded-2xl p-3 flex flex-col shadow-lg transition-all focus-within:border-[#C97B4A] focus-within:ring-1 focus-within:ring-[#C97B4A]">
        
        {/* Attachment Thumbnail */}
        {mediaPreview && (
          <div className="mb-2 relative inline-block w-fit">
            {mediaFile?.type.startsWith('video') ? (
              <div className="w-40 h-24 bg-[#1D1C22] rounded-lg overflow-hidden flex items-center justify-center border border-white/[0.08] relative">
                <FileVideo className="w-8 h-8 text-[#A6A2AE]" />
                <span className="absolute bottom-1 right-1.5 text-[9px] bg-black/70 px-1.5 py-0.5 rounded text-[#EDEAE3] font-mono">Video</span>
              </div>
            ) : (
              <img src={mediaPreview} alt="attachment" className="w-36 h-auto rounded-lg border border-white/[0.08] max-h-36 object-cover" />
            )}
            <button 
              onClick={clearAttachment}
              className="absolute -top-1.5 -right-1.5 bg-[#D9695F] hover:bg-[#c7584e] text-white rounded-full p-1 shadow transition-transform hover:scale-110"
              aria-label="Remove attachment"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Space anything..."
          className="w-full bg-transparent text-[#EDEAE3] placeholder-[#716D7A] outline-none resize-none max-h-48 overflow-y-auto px-1 py-1 text-sm md:text-base leading-relaxed font-sans"
          rows={Math.min(Math.max(text.split('\n').length, 1), 6)}
        />

        {/* Composer Toolbar */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.04]">
          <div className="flex items-center gap-1">
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              accept="image/*,video/*"
            />
            
            {/* Flat Neutral Action Buttons */}
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-[#A6A2AE] hover:text-[#EDEAE3] hover:bg-white/[0.06] rounded-lg transition-colors"
              title="Attach media"
              aria-label="Attach media"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button 
              type="button"
              onClick={handleCameraToggle}
              className={`p-1.5 rounded-lg transition-colors ${
                isCameraActive 
                  ? 'text-[#C97B4A] bg-[#C97B4A]/10' 
                  : 'text-[#A6A2AE] hover:text-[#EDEAE3] hover:bg-white/[0.06]'
              }`}
              title="Camera capture"
              aria-label="Toggle camera"
            >
              <Camera className="w-4 h-4" />
            </button>

            <button 
              type="button"
              onClick={handleMicClick}
              className={`flex items-center gap-1 p-1.5 rounded-lg transition-colors ${
                isRecording 
                  ? 'text-[#D9695F] bg-[#D9695F]/10' 
                  : 'text-[#A6A2AE] hover:text-[#EDEAE3] hover:bg-white/[0.06]'
              }`}
              title="Voice input"
              aria-label="Voice input"
            >
              <Mic className="w-4 h-4" />
              {isRecording && <span className="w-1.5 h-1.5 rounded-full bg-[#D9695F] animate-ping" />}
            </button>
          </div>

          {/* Send or Stop Generation Button */}
          {isStreaming ? (
            <button
              type="button"
              onClick={onStopStreaming}
              className="p-2 bg-[#1D1C22] hover:bg-[#2C2A33] text-[#EDEAE3] border border-white/[0.1] rounded-xl transition-colors cursor-pointer"
              title="Stop generating"
              aria-label="Stop generating"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={(!text.trim() && !mediaFile) || isProcessing}
              className="p-2 bg-[#C97B4A] hover:bg-[#DA8E5D] text-white disabled:bg-[#1D1C22] disabled:text-[#716D7A] rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
              title="Send prompt"
              aria-label="Send prompt"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>

      </div>

      <div className="text-center mt-2.5 text-[11px] text-[#716D7A] cursor-default tracking-wide">
        AI can make mistakes. Consider verifying important information.
      </div>
    </div>
  );
}
