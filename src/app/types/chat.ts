'use client'

export interface Message {
    id: string;
    sender: string;
    role: string;
    content: string;
    followUpQuestions?: string[];
}

export type ConversationStep = 'goalIdentification' | 'generatingQuestions' | 'collectingAnswers' | 'generatingActionPlan' | 'followUp';

export interface ConversationState {
  currentStep: ConversationStep;
  goal: string | null;
  questions: string[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  actionPlan: string | null;
}

export interface ChatContextType {
  messages: Message[];
  isTyping: boolean;
  conversationState: ConversationState;
  sendMessage: (message: Message) => void;
  setTyping: (isTyping: boolean) => void;
  updateConversationState: (newState: Partial<ConversationState>) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}