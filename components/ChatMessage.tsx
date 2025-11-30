
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Message } from '../types';
import { Icons } from './Icons';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in group`}>
      <div 
        className={`
          relative max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-md
          ${isUser 
            ? 'bg-blue-600 text-white rounded-br-none' 
            : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'}
        `}
      >
        <div className="flex items-start gap-2">
           {!isUser && <Icons.Jarvis className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />}
           <div className="prose prose-invert prose-sm max-w-none break-words">
              {message.isLoading ? (
                <div className="flex space-x-2 h-6 items-center">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              ) : (
                <ReactMarkdown 
                  remarkPlugins={[remarkMath]} 
                  rehypePlugins={[rehypeKatex]}
                >
                  {message.text}
                </ReactMarkdown>
              )}
           </div>
        </div>
        
        {/* Footer Actions for Model Messages */}
        {!isUser && !message.isLoading && (
          <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between">
            {/* Audio Indicator */}
            {message.audioData ? (
              <div className="flex items-center text-xs text-cyan-400 gap-1 opacity-75">
                  <Icons.Speaker size={12} />
                  <span>Voice Response</span>
              </div>
            ) : <div></div>}

            {/* Copy Button */}
            <button 
              onClick={handleCopy}
              className="text-slate-400 hover:text-white transition-colors p-1"
              title="Copy answer"
            >
              {copied ? <Icons.Check size={14} className="text-green-400" /> : <Icons.Copy size={14} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
