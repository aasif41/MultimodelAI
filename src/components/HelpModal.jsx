import { X, MessageSquare, Image, Mic, ExternalLink } from 'lucide-react';

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div 
        className="w-full max-w-md bg-[#26242C] border border-white/[0.08] rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <h2 className="font-serif text-xl font-medium text-[#EDEAE3]">
            Help & Feedback
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[#A6A2AE] hover:text-[#EDEAE3] rounded-lg hover:bg-white/[0.04] transition-colors"
            aria-label="Close help modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-4 text-xs text-[#A6A2AE]">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wider font-semibold text-[#716D7A]">
              Quick Guide
            </div>
            <div className="p-3 bg-[#1D1C22] rounded-xl space-y-2 border border-white/[0.06]">
              <div className="flex items-center gap-2.5 text-[#EDEAE3]">
                <MessageSquare className="w-4 h-4 text-[#C97B4A] shrink-0" />
                <span><strong>Enter</strong> sends your prompt; <strong>Shift + Enter</strong> adds a new line.</span>
              </div>
              <div className="flex items-center gap-2.5 text-[#EDEAE3]">
                <Image className="w-4 h-4 text-[#C97B4A] shrink-0" />
                <span>Attach images or video clips for multimodal analysis.</span>
              </div>
              <div className="flex items-center gap-2.5 text-[#EDEAE3]">
                <Mic className="w-4 h-4 text-[#C97B4A] shrink-0" />
                <span>Click the microphone to dictate queries via speech-to-text.</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="text-xs uppercase tracking-wider font-semibold text-[#716D7A]">
              Feedback & Support
            </div>
            <p className="leading-relaxed">
              Have questions or encountered an issue? Send us feedback directly.
            </p>
            <a
              href="mailto:support@space-ai.example?subject=Space%20Feedback"
              className="inline-flex items-center gap-1.5 text-[#C97B4A] hover:text-[#DA8E5D] font-medium"
            >
              <span>Contact Support</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/[0.08] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-[#EDEAE3] rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
