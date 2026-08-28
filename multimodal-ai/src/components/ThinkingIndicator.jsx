import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

export default function ThinkingIndicator({ hasMedia }) {
  const [step, setStep] = useState(0);

  const steps = hasMedia 
    ? ["Scanning uploaded media...", "Analyzing visual data...", "Thinking...", "Formulating response..."]
    : ["Processing request...", "Consulting Groq LLM...", "Synthesizing answer...", "Polishing markdown..."];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2000);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="flex gap-4 w-full animate-message">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
        <Sparkles className="w-4 h-4 text-white animate-spin-slow" />
      </div>
      <div className="flex-1 max-w-[85%] flex flex-col gap-2">
        <div className="px-5 py-4 rounded-2xl bg-[#212121] border border-white/5 space-y-3 shadow-md w-full">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold tracking-wider uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <span>{steps[step]}</span>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-4/5 rounded bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_auto] animate-shimmer"></div>
            <div className="h-3 w-2/3 rounded bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_auto] animate-shimmer"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
