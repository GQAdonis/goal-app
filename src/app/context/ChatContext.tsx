"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Message, ConversationState, ChatContextType } from '@/app/types/chat';

const initialConversationState: ConversationState = {
  currentStep: 'goalIdentification',
  goal: null,
  questions: [],
  currentQuestionIndex: -1,
  answers: {},
  actionPlan: null,
};

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Include setMessages in the useChat hook
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return {
    ...context,
    setMessages: context.setMessages,
  };
};

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>(initialConversationState);

  const sendMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const setTyping = (isTyping: boolean) => {
    setIsTyping(isTyping);
  };

  const updateConversationState = (newState: Partial<ConversationState>) => {
    setConversationState((prev) => ({ ...prev, ...newState }));
  };

  return (
    <ChatContext.Provider value={{ 
      messages, 
      setMessages, // Add this line
      isTyping, 
      conversationState, 
      sendMessage, 
      setTyping, 
      updateConversationState 
    }}>
      {children}
    </ChatContext.Provider>
  );
}