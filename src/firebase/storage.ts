'use client';

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useStorage } from './provider';

/**
 * Uploads an image file to Firebase Storage.
 *
 * @param file The image file to upload.
 * @param path The path in Firebase Storage where the image will be stored.
 * @returns A promise that resolves with the public download URL of the uploaded image.
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  // We can't use the useStorage() hook here directly as this is not a component.
  // Instead, we assume that Firebase has been initialized and get the storage instance manually.
  // This is a bit of a workaround but necessary for utility functions.
  const { getStorage } = await import('firebase/storage');
  const storage = getStorage();
  
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
