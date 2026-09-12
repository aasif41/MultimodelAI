import Logo from './Logo';

export default function ThinkingIndicator({ hasMedia }) {
  return (
    <div className="flex gap-3.5 w-full animate-message">
      {/* Assistant Avatar */}
      <div className="w-7 h-7 rounded-lg bg-[#26242C] border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
        <Logo className="w-4 h-4" />
      </div>

      {/* Bubble with 3-dot pulse */}
      <div className="flex flex-col gap-1.5">
        <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#26242C] border border-white/[0.06] flex items-center gap-2 shadow-sm">
          <div className="flex items-center gap-1 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A6A2AE] animate-dot-1 inline-block" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#A6A2AE] animate-dot-2 inline-block" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#A6A2AE] animate-dot-3 inline-block" />
          </div>
          <span className="text-xs text-[#716D7A] font-medium ml-1">
            {hasMedia ? 'Analyzing visual data' : 'Thinking'}
          </span>
        </div>
      </div>
    </div>
  );
}
