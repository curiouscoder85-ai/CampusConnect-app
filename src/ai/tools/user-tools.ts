'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    // In a deployed Google Cloud environment (like Firebase Studio),
    // GOOGLE_APPLICATION_CREDENTIALS might be a path or a JSON string.
    // The Admin SDK can often auto-discover credentials.
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } catch (e: any) {
    console.warn(
      'Default Firebase Admin SDK initialization failed, trying explicit credential check.',
      e.message
    );
    // This explicit check is a fallback for local or misconfigured environments.
    try {
       const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS
        ? JSON.parse(Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'base64').toString('utf-8'))
        : undefined;
      
       if (serviceAccount) {
         admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: firebaseConfig.projectId,
         });
       } else if (!admin.apps.length) {
         // Final fallback if no credentials found
         console.error("Could not find Firebase Admin credentials. The 'getUserProfile' tool will not work.");
       }
    } catch (e2) {
      console.error('Fallback Firebase Admin SDK initialization failed:', e2);
    }
  }
}

let db: admin.firestore.Firestore;
try {
  db = admin.firestore();
} catch (e) {
  console.error("Firestore could not be initialized for the 'getUserProfile' tool.");
  // Assign a dummy object if initialization fails so the rest of the app can load.
  db = {} as admin.firestore.Firestore;
}

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
    // Check if db was initialized
    if (typeof db.collection !== 'function') {
      console.error("Firestore is not available for 'getUserProfile'.");
      return { firstName: 'User' };
    }
    
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
