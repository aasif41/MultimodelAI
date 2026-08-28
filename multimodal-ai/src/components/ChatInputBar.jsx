import { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, FileVideo, Mic, Camera, X, Loader2 } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { compressImage } from '../utils/imageCompressor';

export default function ChatInputBar({ onSendMessage, isProcessing }) {
  const [text, setText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const fileInputRef = useRef(null);
  const { videoRef, startCamera, stopCamera, captureFrame } = useCamera();
  const recognitionRef = useRef(null);

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
        
        // Only set text if result is final, otherwise you can show intermediate, but final is cleaner.
        // For simplicity, we just inject text at the end when done
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
        alert("Voice recognition not supported in this browser.");
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
      // Convert data url to file object
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
        const compressedFile = await compressImage(file);
        const previewUrl = URL.createObjectURL(compressedFile);
        handleFileAttachment(compressedFile, previewUrl);
        handleCameraToggle(); // Turn off camera
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
    <div className="relative w-full max-w-4xl mx-auto px-4 pb-6">
      
      {/* Camera Overlay */}
      {isCameraActive && (
        <div className="absolute bottom-full left-0 mb-4 p-3 bg-[#13141a]/95 rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 z-30 backdrop-blur-lg">
          <div className="flex justify-between items-center mb-2.5 px-1 text-xs font-semibold text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-ping" />
              Webcam Feed Active
            </span>
            <button onClick={handleCameraToggle} className="text-gray-400 hover:text-white p-0.5 hover:bg-white/5 rounded-lg transition-colors"><X size={16} /></button>
          </div>
          <video 
            ref={videoRef} 
            className="w-80 h-auto rounded-xl bg-black object-cover aspect-video border border-white/5" 
            autoPlay playsInline muted
          />
          <button 
            onClick={takePhoto}
            className="w-full mt-3 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-white text-xs font-bold transition-all shadow-md active:scale-[0.98]"
          >
            Capture Photo
          </button>
        </div>
      )}

      {/* Input Container */}
      <div className="bg-[#13141a]/85 border border-white/10 rounded-3xl p-3.5 flex flex-col shadow-2xl transition-all focus-within:border-purple-500/40 focus-within:shadow-[0_0_25px_rgba(139,92,246,0.12)] ring-1 ring-white/5">
        
        {/* Attachments Preview Area */}
        {mediaPreview && (
          <div className="mb-3 relative inline-block w-fit group-preview">
            {mediaFile?.type.startsWith('video') ? (
              <div className="w-48 h-32 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-white/10 shadow-lg relative">
                <FileVideo className="w-10 h-10 text-purple-400" />
                <span className="absolute bottom-1 right-2 text-[10px] bg-black/60 px-2 py-0.5 rounded-md text-white font-mono font-semibold">Video</span>
              </div>
            ) : (
              <img src={mediaPreview} alt="attachment" className="w-48 h-auto rounded-xl border border-white/10 max-h-48 object-cover shadow-lg" />
            )}
            <button 
              onClick={clearAttachment}
              className="absolute -top-2 -right-2 bg-red-500/90 hover:bg-red-500 text-white rounded-full p-1 shadow-lg transition-all hover:scale-105"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Multimodal AI..."
          className="w-full bg-transparent text-gray-100 placeholder-gray-500 outline-none resize-none max-h-48 overflow-y-auto px-2 py-1.5 text-sm md:text-base leading-relaxed"
          rows={Math.min(Math.max(text.split('\n').length, 1), 6)}
        />

        <div className="flex items-center justify-between mt-3 px-1 border-t border-white/[0.03] pt-2.5">
          <div className="flex items-center gap-1.5">
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              accept="image/*,video/*"
            />
            {/* Attach File Button */}
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl transition-all"
              title="Attach File"
            >
              <ImageIcon className="w-4.5 h-4.5" />
            </button>

            {/* Camera Button */}
            <button 
              type="button"
              onClick={handleCameraToggle}
              className={`p-2 rounded-xl transition-all ${isCameraActive ? 'text-purple-400 bg-purple-500/20 shadow-inner' : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'}`}
              title="Camera"
            >
              <Camera className="w-4.5 h-4.5" />
            </button>

            {/* Mic Button */}
            <button 
              type="button"
              onClick={handleMicClick}
              className={`p-2 rounded-xl transition-all ${isRecording ? 'text-rose-400 bg-rose-500/20 animate-pulse shadow-inner' : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'}`}
              title="Voice Dictation"
            >
              <Mic className="w-4.5 h-4.5" />
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={(!text.trim() && !mediaFile) || isProcessing}
            className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white disabled:from-[#1b1c24] disabled:to-[#1b1c24] disabled:text-gray-600 rounded-xl transition-all hover:scale-[1.05] active:scale-[0.98] shadow-md disabled:shadow-none hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] cursor-pointer disabled:cursor-not-allowed"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

      </div>
      <div className="text-center mt-3 text-[10px] text-gray-500 cursor-default tracking-wide">
        AI can make mistakes. Consider verifying important information.
      </div>
    </div>
  );
}
