import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { ErrorBoundary } from './ErrorBoundary';

export default function StreamingText({ content, speed = 12, onComplete, onIteration, isStopped }) {
  const [displayedText, setDisplayedText] = useState('');
  const textRef = useRef('');
  const onCompleteRef = useRef(onComplete);
  const onIterationRef = useRef(onIteration);

  // Keep callback refs fresh without re-triggering streaming interval
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onIterationRef.current = onIteration;
  });

  useEffect(() => {
    if (isStopped) {
      if (onCompleteRef.current) {
        onCompleteRef.current(textRef.current || content);
      }
      return;
    }

    let currentIdx = 0;
    const tokens = content.split(/(\s+)/);
    let accumulatedText = '';
    
    const interval = setInterval(() => {
      if (currentIdx >= tokens.length) {
        clearInterval(interval);
        if (onCompleteRef.current) {
          onCompleteRef.current(accumulatedText);
        }
      } else {
        accumulatedText += tokens[currentIdx];
        textRef.current = accumulatedText;
        setDisplayedText(accumulatedText);
        currentIdx++;
        if (onIterationRef.current) {
          onIterationRef.current();
        }
      }
    }, speed);

    return () => clearInterval(interval);
  }, [content, speed, isStopped]);

  return (
    <ErrorBoundary>
      <div className="prose prose-invert max-w-none text-sm md:text-base leading-relaxed break-words markdown-body text-[#EDEAE3]">
        <ReactMarkdown>{displayedText}</ReactMarkdown>
        {!isStopped && (
          <span className="inline-block w-1.5 h-4 ml-1 bg-[#C97B4A] rounded-xs animate-pulse align-middle" />
        )}
      </div>
    </ErrorBoundary>
  );
}
