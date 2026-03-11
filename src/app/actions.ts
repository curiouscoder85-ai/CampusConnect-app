'use server';

import {
  getPersonalizedRecommendations,
  PersonalizedRecommendationsInput,
} from '@/ai/flows/personalized-learning-recommendations';
import { curiousBot, CuriousBotInput } from '@/ai/flows/curious-bot-flow';

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
