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