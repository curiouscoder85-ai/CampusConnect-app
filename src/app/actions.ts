'use server';

import {
  getPersonalizedRecommendations,
  PersonalizedRecommendationsInput,
} from '@/ai/flows/personalized-learning-recommendations';

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
