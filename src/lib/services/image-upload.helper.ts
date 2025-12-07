/**
 * Character/Family Image Upload Helper
 * Uses UnifiedImageStorageService to ensure both imageUrl and imageBase64 are always saved
 */

import { UnifiedImageStorageService } from './unified/image-storage.service';

export interface ImageUploadResult {
  imageUrl: string;
  imageBase64: string;
  fileName: string;
  fileSize: number;
}

/**
 * Upload character or family member image
 * Returns both Storage URL and base64 data
 */
export async function uploadCharacterImage(
  file: File,
  userId: string,
  folder: 'characters' | 'family_members' = 'characters',
  fileName?: string
): Promise<ImageUploadResult> {
  try {
    console.log(`📤 Uploading ${folder} image for user ${userId}`);
    
    const result = await UnifiedImageStorageService.uploadFromFile(
      file,
      userId,
      folder,
      fileName
    );
    
    console.log(`✅ Image uploaded successfully: ${result.imageUrl}`);
    console.log(`📊 Image size: ${(result.fileSize / 1024).toFixed(2)} KB`);
    
    return result;
  } catch (error) {
    console.error(`❌ Failed to upload ${folder} image:`, error);
    throw error;
  }
}

/**
 * Upload multiple images (for family members)
 */
export async function uploadMultipleImages(
  files: Array<{ file: File; fileName?: string }>,
  userId: string,
  folder: 'characters' | 'family_members' = 'family_members'
): Promise<ImageUploadResult[]> {
  try {
    console.log(`📤 Uploading ${files.length} ${folder} images for user ${userId}`);
    
    // Convert files to base64 first
    const imagesWithBase64 = await Promise.all(
      files.map(async ({ file, fileName }) => ({
        imageBase64: await UnifiedImageStorageService.fileToBase64(file),
        fileName,
      }))
    );
    
    // Upload all images
    const results = await UnifiedImageStorageService.uploadMultipleImages(
      imagesWithBase64,
      userId,
      folder
    );
    
    console.log(`✅ All ${results.length} images uploaded successfully`);
    
    return results;
  } catch (error) {
    console.error(`❌ Failed to upload multiple ${folder} images:`, error);
    throw error;
  }
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Please select a valid image file' };
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: `Image size must be less than ${maxSize / (1024 * 1024)} MB` };
  }
  
  return { valid: true };
}

/**
 * Create image preview from File
 */
export async function createImagePreview(file: File): Promise<string> {
  return await UnifiedImageStorageService.fileToBase64(file);
}
