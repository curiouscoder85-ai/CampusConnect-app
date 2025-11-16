'use client';

import { getDownloadURL, ref, uploadBytes, FirebaseStorage } from 'firebase/storage';

/**
 * Uploads an image file to Firebase Storage.
 *
 * @param storage The FirebaseStorage instance.
 * @param file The image file to upload.
 * @param path The path in Firebase Storage where the image will be stored.
 * @returns A promise that resolves with the public download URL of the uploaded image.
 */
export async function uploadImage(storage: FirebaseStorage, file: File, path: string): Promise<string> {
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
