'use server';

import {
  getPersonalizedRecommendations,
  PersonalizedRecommendationsInput,
} from '@/ai/flows/personalized-learning-recommendations';
import { curiousBot, CuriousBotInput } from '@/ai/flows/curious-bot-flow';
import { summarizeFeedback, SummarizeFeedbackInput } from '@/ai/flows/feedback-summary-for-teachers';

export async function getPersonalizedRecommendationsAction(
  input: PersonalizedRecommendationsInput
) {
  try {
    const recommendations = await getPersonalizedRecommendations(input);
    return recommendations;
  } catch (error) {
    console.error('Error getting AI recommendations:', error);
    return { recommendations: 'Sorry, we could not generate recommendations at this time.' };
  }
}

export async function curiousBotAction(input: CuriousBotInput) {
  try {
    const result = await curiousBot(input);
    return result.response;
  } catch (error) {
    console.error('Error with CuriousBot:', error);
    return 'I seem to be having some trouble thinking right now. Please try again in a moment.';
  }
}

export async function summarizeFeedbackAction(input: SummarizeFeedbackInput) {
    try {
        const result = await summarizeFeedback(input);
        return result;
    } catch (error) {
        console.error('Error summarizing feedback:', error);
        return { summary: 'Could not generate summary.', areasForImprovement: 'Could not generate areas for improvement.' };
    }
}
