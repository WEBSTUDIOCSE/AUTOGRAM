import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from '@/lib/firebase/firebase';
import { ModuleType } from '@/lib/firebase/config/types';

const storage = getStorage(app);

/**
 * Storage Service
 * Handles Firebase Storage operations for images with module-based organization
 */
export const StorageService = {
  /**
   * Upload base64 image to Firebase Storage with module organization
   * @param base64Image - Base64 encoded image string
   * @param userId - User ID for organizing files
   * @param moduleType - Module type (module1 or module2)
   * @param subfolder - Optional subfolder (e.g., 'generated', 'characters', 'thumbnails')
   * @returns Public download URL
   */
  async uploadImage(
    base64Image: string, 
    userId: string, 
    moduleType: ModuleType = 'module1',
    subfolder?: string
  ): Promise<string> {
    try {
      // Convert base64 to blob
      const byteString = atob(base64Image);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: 'image/png' });

      // Create module-based path structure
      // Structure: users/{userId}/{moduleType}/{subfolder}/{filename}
      const timestamp = Date.now();
      const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.png`;
      
      let storagePath: string;
      if (subfolder) {
        storagePath = `users/${userId}/${moduleType}/${subfolder}/${filename}`;
      } else {
        storagePath = `users/${userId}/${moduleType}/${filename}`;
      }
      
      const storageRef = ref(storage, storagePath);

      // Upload with metadata
      await uploadBytes(storageRef, blob, {
        contentType: 'image/png',
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          moduleType: moduleType,
          userId: userId
        }
      });

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      console.log(`✅ Image uploaded to ${moduleType}:`, downloadURL);
      return downloadURL;

    } catch (error) {
      console.error('❌ Storage upload error:', error);
      throw new Error('Failed to upload image to storage');
    }
  },

  /**
   * Delete image from Firebase Storage
   * @param imageUrl - Full Firebase Storage URL
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      console.log('✅ Image deleted from storage');
    } catch (error) {
      console.error('❌ Storage delete error:', error);
      throw new Error('Failed to delete image from storage');
    }
  },

  /**
   * Get file size from base64 string
   * @param base64String - Base64 encoded string
   * @returns Size in bytes
   */
  getBase64Size(base64String: string): number {
    const base64Length = base64String.length;
    const padding = (base64String.match(/=/g) || []).length;
    return Math.floor((base64Length * 3) / 4) - padding;
  }
};
