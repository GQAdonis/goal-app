# Goal Setting Assistant

This project is a Next.js application that serves as a goal-setting and achievement assistant. It uses AI-powered conversations to help users set clear, actionable goals and create personalized action plans.

## Purpose

The Goal Setting Assistant aims to:

1. Guide users through the process of identifying and clarifying their goals.
2. Ask relevant questions to gather necessary information about the user's goal.
3. Generate a personalized action plan based on the user's responses.
4. Provide motivation and encouragement throughout the goal-setting process.

## Features

- Interactive chat interface
- AI-powered conversations using Claude API
- Step-by-step goal-setting process
- Personalized action plan generation
- Follow-up questions for further guidance

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- Anthropic Claude API

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file in the root directory and add your Claude API key:
   ```
   CLAUDE_API_KEY=your_api_key_here
   ```
4. Run the development server:
   ```
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. When you open the application, you'll be greeted by the chat interface.
2. Start by entering your goal when prompted.
3. The AI assistant will guide you through a series of questions to gather more information about your goal.
4. Answer each question thoughtfully to help create a more personalized action plan.
5. Once all questions are answered, the assistant will generate an action plan for you.
6. You can ask follow-up questions or seek clarification at any point in the process.

## Project Structure

- `src/app/`: Contains the main application code
  - `components/`: React components for the chat interface
  - `context/`: React context for managing chat state
  - `types/`: TypeScript type definitions
  - `api/`: API routes for handling chat requests
- `public/`: Static assets, including avatar images

## Key Components

1. ChatComponent (
```1:190:src/app/components/chat/ChatComponent.tsx
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
```
)
   - Main chat interface component

2. MessageBubble (
```1:58:src/app/components/chat/MessageBubble.tsx
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
```
)
   - Renders individual chat messages with markdown support

3. ChatContext (
```1:59:src/app/context/ChatContext.tsx
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
```
)
   - Manages chat state and provides context to components

4. API Route (
```1:101:src/app/api/chat/route.ts
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Message, ConversationState, ConversationStep } from '../../types/chat';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const systemPrompt = `
You are a goal-setting and achievement assistant designed to help users set clear, actionable goals. Follow these steps:

1. Goal Identification:
   - If the user hasn't provided a clear goal, ask them to state their goal. Do not proceed until a clear goal is established.
   - Once a goal is identified, explicitly state: "Goal identified: [restate the goal]". Then proceed to step 2.

2. Generate Questions:
   - After a goal is identified, generate a set of 5-7 specific questions to gather necessary information for creating an action plan.
   - Present only one question at a time, prefaced with "Question: ".

3. Collect Answers:
   - After presenting a question, wait for the user to provide an answer.
   - If the user's response doesn't answer the question, politely ask them to provide a relevant answer or type "continue" to see the question again.
   - Once a question is answered, move to the next question until all questions are answered.

4. Generate Action Plan:
   - Once all questions have been answered, create a personalized action plan in markdown format that:
     - Outlines specific, realistic, and measurable steps to achieve the goal.
     - Incorporates the user's responses to tailor the plan.
     - Offers guidance and encouragement.

5. Conclude:
   - Provide motivational words to encourage the user on their journey.

Maintain a supportive and positive tone throughout the interaction. If the user asks questions or makes comments unrelated to the current step, answer them appropriately and then gently guide them back to the current step in the process.

Always begin your response by stating the current step of the process (e.g., "Step 1: Goal Identification", "Step 2: Generating Questions", etc.) to help maintain context.
`;
export async function POST(request: Request) {
  try {
    const { messages, conversationState }: { messages: Message[], conversationState: ConversationState } = await request.json();

    const formattedMessages = messages.map((msg: Message) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content
    }));

    // Add conversation state to the system prompt
    const fullSystemPrompt = `${systemPrompt}\n\nCurrent conversation state: ${JSON.stringify(conversationState)}`;

    const completion = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 4096,
      system: fullSystemPrompt,
      messages: formattedMessages,
    });
    
    let reply = 'No response received from the AI';
    if (completion?.content?.[0]?.type === 'text') {
      reply = completion.content[0].text;
    }

    // Analyze the reply to update the conversation state
    let newState: Partial<ConversationState> = {};
    if (reply.includes("Goal identified:")) {
      newState.currentStep = 'generatingQuestions';
      newState.goal = reply.split("Goal identified:")[1].split("\n")[0].trim();
    } else if (reply.includes("Question:")) {
      newState.currentStep = 'collectingAnswers';
      const question = reply.split("Question:")[1].split("\n")[0].trim();
      newState.questions = [...(conversationState.questions || []), question];
      newState.currentQuestionIndex = (conversationState.questions || []).length;
    } else if (reply.includes("Action Plan:")) {
      newState.currentStep = 'generatingActionPlan';
      newState.actionPlan = reply;
    }
    // Handle transitions between steps
    if (conversationState.currentStep === 'collectingAnswers' && !reply.includes("Question:")) {
      if (conversationState.currentQuestionIndex === conversationState.questions.length - 1) {
        newState.currentStep = 'generatingActionPlan';
      } else {
        newState.currentQuestionIndex = (conversationState.currentQuestionIndex || 0) + 1;
      }
    }

    // Update answers
    if (conversationState.currentStep === 'collectingAnswers' && messages[messages.length - 1].role === 'user') {
      const currentQuestion = conversationState.questions[conversationState.currentQuestionIndex];
      newState.answers = {
        ...conversationState.answers,
        [currentQuestion]: messages[messages.length - 1].content
      };
    }

    return NextResponse.json({ message: reply, newState });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```
)
   - Handles chat requests and interacts with the Claude API

## Customization

You can customize the appearance of the chat interface by modifying the Tailwind CSS classes in the component files. The global styles are defined in `src/app/globals.css`.

## Deployment

This Next.js application can be easily deployed to platforms like Vercel or Netlify. Make sure to set up the environment variables (CLAUDE_API_KEY) in your deployment platform's settings.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open-source and available under the MIT License.