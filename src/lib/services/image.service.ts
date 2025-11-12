import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { app } from '@/lib/firebase/firebase';
import { StorageService } from './storage.service';

const db = getFirestore(app);

/**
 * Generated Image Document
 */
export interface GeneratedImage {
  id?: string;
  userId: string;
  prompt: string;
  imageUrl: string;
  model: string;
  status: 'generated' | 'saved' | 'posted' | 'deleted';
  isFavorite: boolean;
  metadata: {
    width: number;
    height: number;
    fileSize: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Image Service
 * Manages generated images in Firestore
 */
export const ImageService = {
  /**
   * Save generated image
   */
  async saveImage(data: {
    userId: string;
    prompt: string;
    imageBase64: string;
    model: string;
  }): Promise<string> {
    try {
      // Upload to Firebase Storage
      const imageUrl = await StorageService.uploadImage(data.imageBase64, data.userId);
      
      // Get file size
      const fileSize = StorageService.getBase64Size(data.imageBase64);

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'generated_images'), {
        userId: data.userId,
        prompt: data.prompt,
        imageUrl,
        model: data.model,
        status: 'generated',
        isFavorite: false,
        metadata: {
          width: 1024,
          height: 1024,
          fileSize
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      console.log('✅ Image saved to Firestore:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Failed to save image:', error);
      throw error;
    }
  },

  /**
   * Get image by ID
   */
  async getImage(imageId: string): Promise<GeneratedImage | null> {
    try {
      const docRef = doc(db, 'generated_images', imageId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as GeneratedImage;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to get image:', error);
      throw error;
    }
  },

  /**
   * Get user's images
   */
  async getUserImages(userId: string, limitCount: number = 50): Promise<GeneratedImage[]> {
    try {
      const q = query(
        collection(db, 'generated_images'),
        where('userId', '==', userId),
        where('status', '!=', 'deleted'),
        orderBy('status'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const images: GeneratedImage[] = [];

      querySnapshot.forEach((doc) => {
        images.push({
          id: doc.id,
          ...doc.data()
        } as GeneratedImage);
      });

      return images;
    } catch (error) {
      console.error('❌ Failed to fetch user images:', error);
      return [];
    }
  },

  /**
   * Update image status
   */
  async updateStatus(imageId: string, status: 'generated' | 'saved' | 'posted' | 'deleted'): Promise<void> {
    try {
      const docRef = doc(db, 'generated_images', imageId);
      await updateDoc(docRef, {
        status,
        updatedAt: Timestamp.now()
      });

      console.log('✅ Image status updated:', status);
    } catch (error) {
      console.error('❌ Failed to update image status:', error);
      throw error;
    }
  },

  /**
   * Toggle favorite
   */
  async toggleFavorite(imageId: string, isFavorite: boolean): Promise<void> {
    try {
      const docRef = doc(db, 'generated_images', imageId);
      await updateDoc(docRef, {
        isFavorite,
        updatedAt: Timestamp.now()
      });

      console.log('✅ Favorite toggled:', isFavorite);
    } catch (error) {
      console.error('❌ Failed to toggle favorite:', error);
      throw error;
    }
  },

  /**
   * Delete image (soft delete)
   */
  async deleteImage(imageId: string): Promise<void> {
    try {
      await this.updateStatus(imageId, 'deleted');
      console.log('✅ Image deleted (soft)');
    } catch (error) {
      console.error('❌ Failed to delete image:', error);
      throw error;
    }
  },

  /**
   * Permanently delete image (remove from Firestore and Storage)
   */
  async permanentlyDeleteImage(imageId: string): Promise<void> {
    try {
      // Get image data
      const image = await this.getImage(imageId);
      
      if (image) {
        // Delete from Storage
        await StorageService.deleteImage(image.imageUrl);
        
        // Delete from Firestore
        const docRef = doc(db, 'generated_images', imageId);
        await deleteDoc(docRef);
        
        console.log('✅ Image permanently deleted');
      }
    } catch (error) {
      console.error('❌ Failed to permanently delete image:', error);
      throw error;
    }
  }
};
