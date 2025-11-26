import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { app } from '@/lib/firebase/firebase';
import { StorageService } from './storage.service';
import type { Character } from '@/lib/firebase/config/types';

const db = getFirestore(app);

/**
 * Character Service
 * Handles character model CRUD operations and Firebase Storage
 */
export const CharacterService = {
  /**
   * Upload a new character
   * @param file - Image file to upload
   * @param name - Character name
   * @param userId - User ID
   * @param assignedAccountId - Instagram account ID this character will post to
   * @returns Created character
   */
  async uploadCharacter(
    file: File, 
    name: string, 
    userId: string,
    assignedAccountId: string
  ): Promise<Character> {
    try {
      // Validate assigned account
      if (!assignedAccountId) {
        throw new Error('Instagram account must be assigned to character');
      }

      // Generate unique character ID
      const characterId = `char_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Convert file to base64
      const base64 = await this.fileToBase64(file);
      
      // Create thumbnail (120x120)
      const thumbnailBase64 = await this.createThumbnail(file, 120, 120);
      
      // Upload original image to Storage using StorageService
      const imageUrl = await StorageService.uploadCharacterImage(
        base64,
        userId,
        characterId,
        'original'
      );
      
      // Upload thumbnail to Storage using StorageService
      const thumbnailUrl = await StorageService.uploadCharacterImage(
        thumbnailBase64,
        userId,
        characterId,
        'thumbnail'
      );
      
      // Create character document
      const character: Character = {
        id: characterId,
        userId,
        name,
        imageUrl,
        thumbnailUrl,
        imageBase64: base64,
        assignedAccountId, // Link character to Instagram account
        postingTimes: [], // Default empty, user can set custom times
        uploadedAt: new Date().toISOString(),
        lastUsedAt: null,
        usageCount: 0,
      };
      
      // Save to Firestore
      await setDoc(doc(db, 'characters', characterId), character);
      
      console.log('✅ Character uploaded successfully:', characterId);
      console.log('📸 Assigned to account:', assignedAccountId);
      return character;
      
    } catch (error) {
      console.error('❌ Character upload error:', error);
      throw new Error('Failed to upload character');
    }
  },

  /**
   * Get all characters for a user
   * @param userId - User ID
   * @returns Array of characters
   */
  async getUserCharacters(userId: string): Promise<Character[]> {
    try {
      const q = query(
        collection(db, 'characters'),
        where('userId', '==', userId),
        orderBy('uploadedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const characters: Character[] = [];
      
      snapshot.forEach((doc) => {
        characters.push(doc.data() as Character);
      });
      
      console.log(`✅ Retrieved ${characters.length} characters for user`);
      return characters;
      
    } catch (error) {
      console.error('❌ Get characters error:', error);
      throw new Error('Failed to retrieve characters');
    }
  },

  /**
   * Get a single character by ID
   * @param characterId - Character ID
   * @returns Character or null
   */
  async getCharacter(characterId: string): Promise<Character | null> {
    try {
      const docRef = doc(db, 'characters', characterId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return docSnap.data() as Character;
      
    } catch (error) {
      console.error('❌ Get character error:', error);
      throw new Error('Failed to retrieve character');
    }
  },

  /**
   * Rename a character
   * @param characterId - Character ID
   * @param newName - New character name
   */
  async renameCharacter(characterId: string, newName: string): Promise<void> {
    try {
      const docRef = doc(db, 'characters', characterId);
      await updateDoc(docRef, {
        name: newName
      });
      
      console.log('✅ Character renamed successfully:', characterId);
      
    } catch (error) {
      console.error('❌ Rename character error:', error);
      throw new Error('Failed to rename character');
    }
  },

  /**
   * Update character's assigned Instagram account
   * @param characterId - Character ID
   * @param assignedAccountId - New Instagram account ID
   */
  async updateAssignedAccount(characterId: string, assignedAccountId: string): Promise<void> {
    try {
      if (!assignedAccountId) {
        throw new Error('Instagram account ID is required');
      }

      const docRef = doc(db, 'characters', characterId);
      await updateDoc(docRef, {
        assignedAccountId
      });
      
      console.log('✅ Character account updated:', characterId, '→', assignedAccountId);
      
    } catch (error) {
      console.error('❌ Update assigned account error:', error);
      throw new Error('Failed to update character account');
    }
  },

  /**
   * Get characters by assigned Instagram account
   * @param userId - User ID
   * @param accountId - Instagram account ID
   * @returns Array of characters assigned to this account
   */
  async getCharactersByAccount(userId: string, accountId: string): Promise<Character[]> {
    try {
      const q = query(
        collection(db, 'characters'),
        where('userId', '==', userId),
        where('assignedAccountId', '==', accountId),
        orderBy('uploadedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const characters: Character[] = [];
      
      snapshot.forEach((doc) => {
        characters.push(doc.data() as Character);
      });
      
      console.log(`✅ Found ${characters.length} characters for account:`, accountId);
      return characters;
      
    } catch (error) {
      console.error('❌ Get characters by account error:', error);
      throw new Error('Failed to retrieve characters by account');
    }
  },

  /**
   * Update character posting times
   * @param characterId - Character ID
   * @param postingTimes - Array of posting times in HH:mm format
   */
  async updatePostingTimes(characterId: string, postingTimes: string[]): Promise<void> {
    try {
      const docRef = doc(db, 'characters', characterId);
      await updateDoc(docRef, {
        postingTimes
      });
      
      console.log('✅ Character posting times updated:', characterId, postingTimes);
      
    } catch (error) {
      console.error('❌ Update posting times error:', error);
      throw new Error('Failed to update character posting times');
    }
  },

  /**
   * Delete a character
   * @param characterId - Character ID
   * @param userId - User ID for security
   */
  async deleteCharacter(characterId: string, userId: string): Promise<void> {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'characters', characterId));
      
      // Delete images from Storage using StorageService
      try {
        // Construct the storage paths and delete
        const originalPath = `users/${userId}/module2/characters/${characterId}/original.jpg`;
        await StorageService.deleteImage(originalPath);
      } catch (err) {
        console.warn('⚠️ Could not delete original image:', err);
      }
      
      try {
        const thumbnailPath = `users/${userId}/module2/characters/${characterId}/thumbnail.jpg`;
        await StorageService.deleteImage(thumbnailPath);
      } catch (err) {
        console.warn('⚠️ Could not delete thumbnail:', err);
      }
      
      console.log('✅ Character deleted successfully:', characterId);
      
    } catch (error) {
      console.error('❌ Delete character error:', error);
      throw new Error('Failed to delete character');
    }
  },

  /**
   * Update character usage statistics
   * @param characterId - Character ID
   */
  async updateCharacterUsage(characterId: string): Promise<void> {
    try {
      const docRef = doc(db, 'characters', characterId);
      await updateDoc(docRef, {
        lastUsedAt: new Date().toISOString(),
        usageCount: (await getDoc(docRef)).data()?.usageCount + 1 || 1
      });
      
      console.log('✅ Character usage updated:', characterId);
      
    } catch (error) {
      console.error('❌ Update usage error:', error);
      // Non-critical error, don't throw
    }
  },

  /**
   * Convert File to base64 string
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * Create thumbnail from image file
   */
  async createThumbnail(file: File, width: number, height: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // Calculate scaling to cover the entire thumbnail
          const scale = Math.max(width / img.width, height / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          
          // Center the image
          const x = (width - scaledWidth) / 2;
          const y = (height - scaledHeight) / 2;
          
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          
          // Convert to base64
          const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const base64 = thumbnailDataUrl.split(',')[1];
          resolve(base64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * Convert base64 to Blob
   */
  async base64ToBlob(base64: string): Promise<Blob> {
    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'image/jpeg' });
  }
};
