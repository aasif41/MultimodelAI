import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ErrorBoundary } from './ErrorBoundary';

export default function StreamingText({ content, speed = 12, onComplete, onIteration }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let currentIdx = 0;
    // Split keeping whitespace tokens so spacing is correct
    const tokens = content.split(/(\s+)/);
    let accumulatedText = '';
    
    const interval = setInterval(() => {
      if (currentIdx >= tokens.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      } else {
        accumulatedText += tokens[currentIdx];
        setDisplayedText(accumulatedText);
        currentIdx++;
        if (onIteration) onIteration();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [content, speed, onComplete, onIteration]);

  return (
    <ErrorBoundary>
      <div className="prose prose-invert max-w-none text-sm md:text-base leading-relaxed break-words markdown-body">
        <ReactMarkdown>{displayedText}</ReactMarkdown>
        <span className="inline-block w-1.5 h-4 ml-1 bg-purple-500 rounded animate-pulse align-middle" />
      </div>
    </ErrorBoundary>
  );
}
