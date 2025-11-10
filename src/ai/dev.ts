'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/personalized-learning-recommendations.ts';
import '@/ai/flows/feedback-summary-for-teachers.ts';
import '@/ai/flows/curious-bot-flow.ts';
