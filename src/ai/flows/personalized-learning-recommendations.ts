'use server';

/**
 * @fileOverview Provides personalized learning material recommendations based on student progress.
 *
 * - getPersonalizedRecommendations - A function to retrieve personalized learning recommendations.
 * - PersonalizedRecommendationsInput - The input type for the getPersonalizedRecommendations function.
 * - PersonalizedRecommendationsOutput - The return type for the getPersonalizedRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedRecommendationsInputSchema = z.object({
  courseName: z.string().describe('The name of the course.'),
  studentProgress: z
    .string()
    .describe(
      'A description of the student\'s progress in the course, including completed topics and areas of difficulty.'
    ),
  learningMaterials: z
    .string()
    .describe('A list of available learning materials for the course.'),
});
export type PersonalizedRecommendationsInput = z.infer<
  typeof PersonalizedRecommendationsInputSchema
>;

const PersonalizedRecommendationsOutputSchema = z.object({
  recommendations: z
    .string()
    .describe(
      'A list of personalized learning material recommendations based on the student\'s progress.'
    ),
});
export type PersonalizedRecommendationsOutput = z.infer<
  typeof PersonalizedRecommendationsOutputSchema
>;

export async function getPersonalizedRecommendations(
  input: PersonalizedRecommendationsInput
): Promise<PersonalizedRecommendationsOutput> {
  return personalizedRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedRecommendationsPrompt',
  input: {schema: PersonalizedRecommendationsInputSchema},
  output: {schema: PersonalizedRecommendationsOutputSchema},
  prompt: `You are an AI learning assistant that provides personalized learning material recommendations to students based on their progress in a course.

  Course Name: {{{courseName}}}
  Student Progress: {{{studentProgress}}}
  Available Learning Materials: {{{learningMaterials}}}

  Based on the student's progress and the available learning materials, provide a list of personalized recommendations. Return only the list of recommendations, do not add any extra explanation.
  `,
});

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: PersonalizedRecommendationsInputSchema,
    outputSchema: PersonalizedRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
