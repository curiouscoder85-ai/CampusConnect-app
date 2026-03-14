'use client';

import { getDownloadURL, ref, uploadBytes, uploadBytesResumable, FirebaseStorage } from 'firebase/storage';

/**
 * Uploads an image file to Firebase Storage.
 */
export async function uploadImage(storage: FirebaseStorage, file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Image upload failed');
  }
}

/**
 * Uploads a file to Firebase Storage with resumable progress tracking.
 */
export function uploadFileWithProgress(
  storage: FirebaseStorage,
  file: File,
  path: string,
  onProgress: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Prevent division by zero if file is somehow empty or bytes not yet reported
        const total = snapshot.totalBytes > 0 ? snapshot.totalBytes : 1;
        const progress = (snapshot.bytesTransferred / total) * 100;
        onProgress(Math.min(progress, 100)); // Clamp at 100
      },
      (error) => {
        console.error('Upload failed:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}
