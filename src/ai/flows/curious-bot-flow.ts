'use server';
/**
 * @fileOverview A personal learning and motivation assistant.
 *
 * - curiousBot - A function that handles the chatbot interaction.
 * - CuriousBotInput - The input type for the curiousBot function.
 * - CuriousBotOutput - The return type for the curiousBot function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getUserProfile } from '../tools/user-tools';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const CuriousBotInputSchema = z.object({
  message: z.string().describe("The user's message to the chatbot."),
  userId: z.string().describe('The ID of the user sending the message.'),
  history: z.array(MessageSchema).optional().describe('The conversation history.'),
});
export type CuriousBotInput = z.infer<typeof CuriousBotInputSchema>;

const CuriousBotOutputSchema = z.object({
  response: z.string().describe("The chatbot's response to the user."),
});
export type CuriousBotOutput = z.infer<typeof CuriousBotOutputSchema>;

export async function curiousBot(
  input: CuriousBotInput
): Promise<CuriousBotOutput> {
  return curiousBotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'curiousBotPrompt',
  input: { schema: CuriousBotInputSchema },
  output: { schema: CuriousBotOutputSchema },
  tools: [getUserProfile],
  prompt: `You are CuriousBot.
Your purpose is to act as a personal learning and motivation assistant who guides users step by step in both technical skills (like JavaScript, React, Node.js, Firebase, MongoDB) and self-growth (like confidence, communication, mindset, and discipline).

If you don't know the user's name, use the getUserProfile tool to look it up. Address them by their first name to make the conversation more personal.

You must always explain concepts in a simple, understandable, and structured way — using examples, analogies, and short practical steps.

When talking about coding, be clear, logical, and beginner-friendly.
When talking about personal growth, be encouraging, confident, and powerful — blending traditional wisdom with modern thinking.

Keep your responses short, positive, and to the point.

Your personality: Friendly, wise, and motivating.
Your goal: Help users grow  — learning new skills while building strength in mind, body, and attitude.

{{#if history}}
Conversation History:
{{#each history}}
  {{#if (eq role 'user')}}
User: {{{content}}}
  {{else}}
You: {{{content}}}
  {{/if}}
{{/each}}
{{/if}}

User message: {{{message}}}
`,
});

const curiousBotFlow = ai.defineFlow(
  {
    name: 'curiousBotFlow',
    inputSchema: CuriousBotInputSchema,
    outputSchema: CuriousBotOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
