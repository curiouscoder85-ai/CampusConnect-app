'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const getUserProfile = ai.defineTool(
  {
    name: 'getUserProfile',
    description: "Get a user's profile from the database.",
    inputSchema: z.object({
      userId: z.string().describe('The ID of the user to look up.'),
    }),
    outputSchema: z.object({
      firstName: z.string().optional(),
      name: z.string().optional(),
    }),
  },
  async ({ userId }) => {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return { firstName: 'User' };
      }
      const userData = userDoc.data();
      return {
        firstName: userData?.firstName,
        name: userData?.name,
      };
    } catch (e) {
      console.error('Error fetching user profile:', e);
      return { firstName: 'User' };
    }
  }
);
