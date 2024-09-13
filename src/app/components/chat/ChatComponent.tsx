import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import MessageBubble, { MessageBubbleProps } from './MessageBubble';
import UserAvatar from './UserAvatar';
import TypingIndicator from './TypingIndicator';
import { Message, ConversationState, ConversationStep } from '@/app/types/chat';

const ChatComponent: React.FC = () => {
  const [input, setInput] = useState('');
  const { messages, isTyping, sendMessage, setTyping, conversationState, updateConversationState, setMessages } = useChat();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (allQuestionsAnswered()) {
      generateActionPlan();
    }
  }, [messages]);

  const allQuestionsAnswered = (): boolean => {
    // Implement logic to check if all questions are answered
    return conversationState.currentQuestionIndex >= conversationState.questions.length;
  };

  const generateActionPlan = async () => {
    const response = await sendMessageToAPI('generate action plan');
    if (response) {
      setFollowUpQuestions(response.followUpQuestions || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || conversationState.currentStep === 'collectingAnswers') {
      await sendMessageToAPI(input.trim() || 'continue');
    }
  };

  const sendMessageToAPI = async (message: string): Promise<Message | null> => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      role: 'user',
      content: message
    };

    sendMessage(newMessage);
    setInput('');
    setTyping(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, newMessage], conversationState }),
      });
      const data = await response.json();
      const assistantMessage: Message = {
        id: Date.now().toString(),
        sender: 'assistant',
        role: 'assistant',
        content: data.message
      };
      sendMessage(assistantMessage);
      
      if (data.newState) {
        updateConversationState(data.newState);
      }
      return assistantMessage;
    } catch (error) {
      console.error('Error fetching response:', error);
      return null;
    } finally {
      setTyping(false);
    }
  };

  const handleContinue = () => {
    sendMessageToAPI('continue');
  };

  const handleFollowUpClick = (question: string) => {
    sendMessageToAPI(question);
  };

  const getHeaderText = () => {
    switch (conversationState.currentStep) {
      case 'goalIdentification':
        return "What is your goal?";
      case 'generatingQuestions':
        return "Generating questions...";
      case 'collectingAnswers':
        return "Answering questions";
      case 'generatingActionPlan':
        return "Generating action plan";
      default:
        return "Goal Setting Assistant";
    }
  };

  const getInputPlaceholder = () => {
    switch (conversationState.currentStep) {
      case 'goalIdentification':
        return "Enter your goal...";
      case 'collectingAnswers':
        return "Type your answer...";
      default:
        return "Type your message...";
    }
  };

  const getCurrentQuestion = () => {
    if (conversationState.currentStep === 'collectingAnswers' && conversationState.questions.length > 0) {
      return conversationState.questions[conversationState.currentQuestionIndex];
    }
    return null;
  };

  return (
    <>
      <h1 className="text-center text-2xl font-bold mb-4">{getHeaderText()}</h1>
      <div className="flex flex-col h-[600px] w-full max-w-2xl border rounded-lg">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((message, index) => (
            <div key={index} className="flex items-start mb-4">
              <UserAvatar sender={message.sender as "user" | "assistant"} />
              <MessageBubble 
                message={message} 
                onFollowUpClick={handleFollowUpClick} 
              />
            </div>
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={chatEndRef} />
        </div>
        <div className="p-2 bg-gray-100 text-sm text-center">
          Current step: {conversationState.currentStep}
        </div>
        {getCurrentQuestion() && (
          <div className="p-2 bg-blue-100 text-sm">
            <strong>Current Question:</strong> {getCurrentQuestion()}
          </div>
        )}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder={getInputPlaceholder()}
          />
          <div className="flex justify-between mt-2">
            <button
              type="submit"
              className="p-2 bg-blue-500 text-white rounded"
            >
              Send
            </button>
            {conversationState.currentStep === 'collectingAnswers' && (
              <button
                type="button"
                onClick={handleContinue}
                className="p-2 bg-gray-300 text-gray-700 rounded"
              >
                See Question Again
              </button>
            )}
          </div>
        </form>
      </div>
      {followUpQuestions.length > 0 && (
        <div className="mt-4">
          <h3>Follow-up questions:</h3>
          {followUpQuestions.map((question, index) => (
            <button 
              key={index} 
              onClick={() => handleFollowUpClick(question)}
              className="block mt-2 text-blue-500 hover:underline"
            >
              {question}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default ChatComponent;