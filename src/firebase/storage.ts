'use client';

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getApps, getApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { initializeFirebase } from '.';

/**
 * Uploads an image file to Firebase Storage.
 *
 * @param file The image file to upload.
 * @param path The path in Firebase Storage where the image will be stored.
 * @returns A promise that resolves with the public download URL of the uploaded image.
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  // Hooks can't be used in here, so we need to get the storage instance manually.
  // First, ensure Firebase is initialized if it hasn't been already.
  const app = getApps().length > 0 ? getApp() : initializeFirebase().firebaseApp;
  const storage = getStorage(app);
  
  const storageRef = ref(storage, path);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    // Depending on your error handling strategy, you might want to throw the error
    // or return a specific error message.
    throw new Error('Image upload failed');
  }
}
