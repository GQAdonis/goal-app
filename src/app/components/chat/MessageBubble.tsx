'use client'

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { FiCopy } from 'react-icons/fi';
import { Message } from '@/app/types/chat';
import rehypeHighlight from 'rehype-highlight';

export interface MessageBubbleProps {
  message: Message;
  onFollowUpClick?: (question: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onFollowUpClick }) => {
  const [copied, setCopied] = useState(false);
  const bubbleClass = message.sender === 'user' ? 'bg-blue-100' : 'bg-gray-100';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`p-3 rounded-lg ${bubbleClass} max-w-3/4 ml-2 relative`}>
      <ReactMarkdown 
        rehypePlugins={[rehypeHighlight]}
        components={{
          code({inline, className, children, ...props}: React.ComponentPropsWithoutRef<'code'> & {inline?: boolean}) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <pre className={className}>
                <code {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          }
        }}
      >
        {message.content}
      </ReactMarkdown>
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        onClick={copyToClipboard}
      >
        <FiCopy />
      </button>
      {copied && <span className="absolute top-2 right-8 text-sm text-green-500">Copied!</span>}
    </div>
  );
};

export default MessageBubble;