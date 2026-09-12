import { useState } from 'react';
import { X, Trash2, Check, AlertTriangle } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, onClearAllChats }) {
  const [confirmingClear, setConfirmingClear] = useState(false);

  if (!isOpen) return null;

  const handleClear = async () => {
    await onClearAllChats();
    setConfirmingClear(false);
    onClose();
  };

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
            Settings
          </h2>
          <button
            onClick={() => {
              setConfirmingClear(false);
              onClose();
            }}
            className="p-1.5 text-[#A6A2AE] hover:text-[#EDEAE3] rounded-lg hover:bg-white/[0.04] transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-6">
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#716D7A] mb-3">
              Data Management
            </h3>
            
            <div className="p-4 bg-[#1D1C22] border border-white/[0.06] rounded-xl flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium text-[#EDEAE3]">Clear Conversations</div>
                  <div className="text-xs text-[#A6A2AE] mt-0.5">
                    Permanently delete all conversation history and stored media.
                  </div>
                </div>
              </div>

              {!confirmingClear ? (
                <button
                  type="button"
                  onClick={() => setConfirmingClear(true)}
                  className="self-start mt-1 flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#D9695F] border border-[#D9695F]/30 hover:bg-[#D9695F]/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Conversations</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[#D9695F] font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Are you sure?
                  </span>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-[#D9695F] text-white hover:bg-[#c7584e] rounded-lg transition-colors cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    <span>Yes, delete all</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingClear(false)}
                    className="px-2.5 py-1 text-xs font-medium text-[#A6A2AE] hover:text-[#EDEAE3] rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#716D7A] mb-2">
              About
            </h3>
            <p className="text-xs text-[#A6A2AE] leading-relaxed">
              Space is a multimodal workspace for text, vision, audio, and documents. Powered by Groq LPU inference.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/[0.08] flex justify-end">
          <button
            type="button"
            onClick={() => {
              setConfirmingClear(false);
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-[#EDEAE3] rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
