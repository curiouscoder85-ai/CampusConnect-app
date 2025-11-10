'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  // When running in a Google Cloud environment, the SDK can automatically
  // find the service account credentials. For local development, especially
  // in environments like Firebase Studio's web-based VS Code, we may need
  // to provide the configuration explicitly.
  try {
    const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS
      ? JSON.parse(Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'base64').toString('utf-8'))
      : undefined;

    admin.initializeApp({
      credential: serviceAccount ? admin.credential.cert(serviceAccount) : admin.credential.applicationDefault(),
      projectId: firebaseConfig.projectId,
    });
  } catch (e) {
      console.error('Firebase Admin SDK initialization failed:', e);
      // Fallback for environments where default credentials might work
      // but the explicit credential load fails.
      if (!admin.apps.length) {
        admin.initializeApp({
            projectId: firebaseConfig.projectId,
        });
      }
  }
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
