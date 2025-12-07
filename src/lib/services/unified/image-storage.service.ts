/**
 * Unified Image Storage Service
 * Handles both Firebase Storage upload AND base64 encoding
 * Eliminates the issue of base64 data loss by managing both formats consistently
 */

import { 
  getStorage, 
  ref, 
  uploadString, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { app } from '@/lib/firebase/firebase';

const storage = getStorage(app);

export interface ImageUploadResult {
  imageUrl: string; // Firebase Storage URL for display
  imageBase64: string; // Base64 data for AI processing
  fileName: string;
  fileSize: number;
}

/**
 * Unified Image Storage Service
 * Ensures both imageUrl and imageBase64 are always available
 */
export const UnifiedImageStorageService = {
  /**
   * Upload image and return both Storage URL and base64
   * This ensures we never lose base64 data
   */
  async uploadImage(
    imageBase64: string,
    userId: string,
    folder: string, // e.g., 'characters', 'family_members'
    fileName?: string
  ): Promise<ImageUploadResult> {
    try {
      // Normalize base64 format - add data URI prefix if missing
      let normalizedBase64 = imageBase64;
      if (!imageBase64.startsWith('data:image/')) {
        // Assume JPEG if no prefix (most common)
        normalizedBase64 = `data:image/jpeg;base64,${imageBase64}`;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const finalFileName = fileName || `image_${timestamp}_${randomId}`;
      const storagePath = `users/${userId}/${folder}/${finalFileName}`;

      console.log(`📤 Uploading image to: ${storagePath}`);

      // Upload to Firebase Storage
      const storageRef = ref(storage, storagePath);
      await uploadString(storageRef, normalizedBase64, 'data_url');

      // Get download URL
      const imageUrl = await getDownloadURL(storageRef);

      // Calculate file size
      const fileSize = this.getBase64Size(normalizedBase64);

      console.log(`✅ Image uploaded successfully: ${imageUrl}`);
      console.log(`📊 File size: ${(fileSize / 1024).toFixed(2)} KB`);

      return {
        imageUrl,
        imageBase64: normalizedBase64, // Return normalized base64 with data URI
        fileName: finalFileName,
        fileSize,
      };
    } catch (error) {
      console.error('❌ Failed to upload image:', error);
      throw error;
    }
  },

  /**
   * Upload multiple images (e.g., for family members)
   */
  async uploadMultipleImages(
    images: Array<{ imageBase64: string; fileName?: string }>,
    userId: string,
    folder: string
  ): Promise<ImageUploadResult[]> {
    try {
      console.log(`📤 Uploading ${images.length} images to ${folder}`);

      const uploadPromises = images.map((img, index) => 
        this.uploadImage(
          img.imageBase64,
          userId,
          folder,
          img.fileName || `image_${index}`
        )
      );

      const results = await Promise.all(uploadPromises);

      console.log(`✅ All ${results.length} images uploaded successfully`);
      return results;
    } catch (error) {
      console.error('❌ Failed to upload multiple images:', error);
      throw error;
    }
  },

  /**
   * Convert File to base64 (for browser uploads)
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as base64'));
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  },

  /**
   * Upload from File object (browser upload)
   * Returns both URL and base64
   */
  async uploadFromFile(
    file: File,
    userId: string,
    folder: string,
    fileName?: string
  ): Promise<ImageUploadResult> {
    try {
      console.log(`📤 Converting file to base64: ${file.name}`);
      const imageBase64 = await this.fileToBase64(file);
      
      return await this.uploadImage(imageBase64, userId, folder, fileName);
    } catch (error) {
      console.error('❌ Failed to upload from file:', error);
      throw error;
    }
  },

  /**
   * Delete image from Firebase Storage
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting image: ${imageUrl}`);
      
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
      
      console.log('✅ Image deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete image:', error);
      throw error;
    }
  },

  /**
   * Get base64 file size in bytes
   */
  getBase64Size(base64String: string): number {
    // Remove data URL prefix
    const base64Data = base64String.split(',')[1] || base64String;
    
    // Calculate size (base64 is ~4/3 of original size)
    const padding = (base64Data.match(/=/g) || []).length;
    return (base64Data.length * 3) / 4 - padding;
  },

  /**
   * Validate base64 image
   */
  isValidBase64Image(base64String: string): boolean {
    if (!base64String) return false;
    
    // Check if it starts with data:image/
    if (!base64String.startsWith('data:image/')) return false;
    
    // Check if it has base64 data
    const parts = base64String.split(',');
    return parts.length === 2 && parts[1].length > 0;
  },

  /**
   * Compress base64 image (optional - for reducing storage)
   */
  async compressBase64Image(
    base64String: string,
    maxWidth: number = 1024,
    maxHeight: number = 1024,
    quality: number = 0.8
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        // Create canvas and compress
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = base64String;
    });
  },

  /**
   * Get image metadata from base64
   */
  async getImageMetadata(base64String: string): Promise<{
    width: number;
    height: number;
    size: number;
    type: string;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const size = this.getBase64Size(base64String);
        const type = base64String.split(';')[0].split(':')[1] || 'image/jpeg';
        
        resolve({
          width: img.width,
          height: img.height,
          size,
          type,
        });
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = base64String;
    });
  },
};
