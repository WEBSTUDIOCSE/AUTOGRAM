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
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from '@/lib/firebase/firebase';
import type { Character } from '@/lib/firebase/config/types';

const db = getFirestore(app);
const storage = getStorage(app);

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
   * @returns Created character
   */
  async uploadCharacter(file: File, name: string, userId: string): Promise<Character> {
    try {
      // Generate unique character ID
      const characterId = `char_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Convert file to base64
      const base64 = await this.fileToBase64(file);
      
      // Create thumbnail (120x120)
      const thumbnailBase64 = await this.createThumbnail(file, 120, 120);
      
      // Upload original image to Storage
      const originalRef = ref(storage, `characters/${userId}/${characterId}/original.jpg`);
      await uploadBytes(originalRef, file, {
        contentType: file.type,
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          characterName: name
        }
      });
      const imageUrl = await getDownloadURL(originalRef);
      
      // Upload thumbnail to Storage
      const thumbnailBlob = await this.base64ToBlob(thumbnailBase64);
      const thumbnailRef = ref(storage, `characters/${userId}/${characterId}/thumbnail.jpg`);
      await uploadBytes(thumbnailRef, thumbnailBlob, {
        contentType: 'image/jpeg',
        customMetadata: {
          uploadedAt: new Date().toISOString()
        }
      });
      const thumbnailUrl = await getDownloadURL(thumbnailRef);
      
      // Create character document
      const character: Character = {
        id: characterId,
        userId,
        name,
        imageUrl,
        thumbnailUrl,
        imageBase64: base64,
        uploadedAt: new Date().toISOString(),
        lastUsedAt: null,
        usageCount: 0
      };
      
      // Save to Firestore
      await setDoc(doc(db, 'characters', characterId), character);
      
      console.log('✅ Character uploaded successfully:', characterId);
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
   * Delete a character
   * @param characterId - Character ID
   * @param userId - User ID for security
   */
  async deleteCharacter(characterId: string, userId: string): Promise<void> {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'characters', characterId));
      
      // Delete images from Storage
      try {
        const originalRef = ref(storage, `characters/${userId}/${characterId}/original.jpg`);
        await deleteObject(originalRef);
      } catch (err) {
        console.warn('⚠️ Could not delete original image:', err);
      }
      
      try {
        const thumbnailRef = ref(storage, `characters/${userId}/${characterId}/thumbnail.jpg`);
        await deleteObject(thumbnailRef);
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
