'use server';

/**
 * @fileOverview Summarizes student feedback for a teacher's course.
 *
 * - summarizeFeedback - A function that summarizes student feedback for a course.
 * - SummarizeFeedbackInput - The input type for the summarizeFeedback function.
 * - SummarizeFeedbackOutput - The return type for the summarizeFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeFeedbackInputSchema = z.object({
  courseName: z.string().describe('The name of the course.'),
  feedback: z.array(z.string()).describe('An array of student feedback strings.'),
});
export type SummarizeFeedbackInput = z.infer<typeof SummarizeFeedbackInputSchema>;

const SummarizeFeedbackOutputSchema = z.object({
  summary: z.string().describe('A summarized version of the student feedback.'),
  areasForImprovement: z
    .string()
    .describe('Key areas for improvement identified from the feedback.'),
});
export type SummarizeFeedbackOutput = z.infer<typeof SummarizeFeedbackOutputSchema>;

export async function summarizeFeedback(input: SummarizeFeedbackInput): Promise<SummarizeFeedbackOutput> {
  return summarizeFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeFeedbackPrompt',
  input: {schema: SummarizeFeedbackInputSchema},
  output: {schema: SummarizeFeedbackOutputSchema},
  prompt: `You are a helpful teaching assistant. Your job is to summarize student feedback for a given course and identify key areas for improvement.

Course Name: {{{courseName}}}

Feedback:
{{#each feedback}}
- {{{this}}}
{{/each}}

Please provide a concise summary of the feedback and highlight the main areas where the course can be improved.`,
});

const summarizeFeedbackFlow = ai.defineFlow(
  {
    name: 'summarizeFeedbackFlow',
    inputSchema: SummarizeFeedbackInputSchema,
    outputSchema: SummarizeFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
