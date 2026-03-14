'use client';

import { getDownloadURL, ref, uploadBytes, uploadBytesResumable, FirebaseStorage } from 'firebase/storage';

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

/**
 * Uploads a file to Firebase Storage with progress tracking.
 *
 * @param storage The FirebaseStorage instance.
 * @param file The file to upload.
 * @param path The path in Firebase Storage where the file will be stored.
 * @param onProgress Callback function that receives the upload progress percentage.
 * @returns A promise that resolves with the public download URL of the uploaded file.
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
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
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
