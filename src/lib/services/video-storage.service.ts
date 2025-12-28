import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase/firebase';

const storage = getStorage(app);

/**
 * Video Storage Service
 * Handles Firebase Storage operations for videos
 */
export const VideoStorageService = {
  /**
   * Download video from URL and upload to Firebase Storage
   * @param videoUrl - Public URL of the video to download
   * @param userId - User ID for organizing files
   * @param moduleType - Module type (module6, module7, or module9)
   * @returns Firebase Storage download URL
   */
  async uploadVideoFromUrl(
    videoUrl: string,
    userId: string,
    moduleType: 'module6' | 'module7' | 'module9'
  ): Promise<string> {
    try {
      console.log('📥 Downloading video from:', videoUrl);
      
      // Download the video from the URL
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }

      const videoBlob = await response.blob();
      console.log('✅ Video downloaded, size:', (videoBlob.size / 1024 / 1024).toFixed(2), 'MB');

      // Create storage path
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const storagePath = `users/${userId}/${moduleType}/videos/video_${timestamp}_${randomId}.mp4`;
      
      const storageRef = ref(storage, storagePath);

      // Upload with metadata
      console.log('📤 Uploading to Firebase Storage...');
      await uploadBytes(storageRef, videoBlob, {
        contentType: 'video/mp4',
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          moduleType: moduleType,
          userId: userId,
          originalUrl: videoUrl
        }
      });

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      console.log(`✅ Video uploaded to Firebase Storage:`, downloadURL);
      return downloadURL;

    } catch (error) {
      console.error('❌ Video upload error:', error);
      throw new Error(`Failed to upload video to storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Upload video blob directly to Firebase Storage
   * @param videoBlob - Video blob
   * @param userId - User ID
   * @param moduleType - Module type
   * @returns Firebase Storage download URL
   */
  async uploadVideoBlob(
    videoBlob: Blob,
    userId: string,
    moduleType: 'module6' | 'module7' | 'module9'
  ): Promise<string> {
    try {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const storagePath = `users/${userId}/${moduleType}/videos/video_${timestamp}_${randomId}.mp4`;
      
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, videoBlob, {
        contentType: 'video/mp4',
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          moduleType: moduleType,
          userId: userId
        }
      });

      const downloadURL = await getDownloadURL(storageRef);
      console.log(`✅ Video blob uploaded:`, downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('❌ Video blob upload error:', error);
      throw new Error('Failed to upload video blob to storage');
    }
  }
};
