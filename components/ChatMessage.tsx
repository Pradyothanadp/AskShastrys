import React from 'react';
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

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}>
      <div 
        className={`
          max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-md
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
        
        {/* Audio Indicator if message has audio attached (Jarvis Mode) */}
        {message.audioData && !isUser && (
           <div className="mt-2 flex items-center text-xs text-cyan-400 gap-1 opacity-75">
              <Icons.Speaker size={12} />
              <span>Voice Response</span>
           </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;