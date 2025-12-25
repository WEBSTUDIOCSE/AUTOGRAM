/**
 * Video Prompt Library Service (Module 8)
 * Manages base video prompts for auto-posting
 */

import { db } from '@/lib/firebase/firebase';
import { doc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, orderBy, Timestamp } from 'firebase/firestore';

export interface VideoPrompt {
  id: string;
  userId: string;
  videoType: 'text-to-video' | 'image-to-video';
  characterId?: string; // For image-to-video
  characterName?: string;
  basePrompt: string;
  category?: string;
  assignedAccountId: string; // Instagram account
  postingTimes: string[]; // HH:mm format
  usageCount: number;
  lastUsedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const VIDEO_PROMPTS_COLLECTION = 'video_prompts';

export const VideoPromptLibraryService = {
  /**
   * Get all video prompts for a user
   */
  getUserPrompts: async (userId: string): Promise<VideoPrompt[]> => {
    const q = query(
      collection(db, VIDEO_PROMPTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as VideoPrompt));
  },

  /**
   * Get prompts by video type
   */
  getPromptsByType: async (userId: string, videoType: 'text-to-video' | 'image-to-video'): Promise<VideoPrompt[]> => {
    const q = query(
      collection(db, VIDEO_PROMPTS_COLLECTION),
      where('userId', '==', userId),
      where('videoType', '==', videoType),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as VideoPrompt));
  },

  /**
   * Create a new video prompt
   */
  createPrompt: async (prompt: Omit<VideoPrompt, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const docRef = await addDoc(collection(db, VIDEO_PROMPTS_COLLECTION), {
      ...prompt,
      usageCount: 0,
      lastUsedAt: null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  /**
   * Update a video prompt
   */
  updatePrompt: async (promptId: string, updates: Partial<VideoPrompt>): Promise<void> => {
    const docRef = doc(db, VIDEO_PROMPTS_COLLECTION, promptId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Delete a video prompt
   */
  deletePrompt: async (promptId: string): Promise<void> => {
    const docRef = doc(db, VIDEO_PROMPTS_COLLECTION, promptId);
    await deleteDoc(docRef);
  },

  /**
   * Increment usage count
   */
  incrementUsageCount: async (promptId: string): Promise<void> => {
    const docRef = doc(db, VIDEO_PROMPTS_COLLECTION, promptId);
    const docSnap = await getDocs(query(collection(db, VIDEO_PROMPTS_COLLECTION), where('__name__', '==', promptId)));
    
    if (!docSnap.empty) {
      const data = docSnap.docs[0].data();
      const currentCount = data.usageCount || 0;
      await updateDoc(docRef, {
        usageCount: currentCount + 1,
        lastUsedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  },

  /**
   * Toggle active status
   */
  toggleActive: async (promptId: string, isActive: boolean): Promise<void> => {
    const docRef = doc(db, VIDEO_PROMPTS_COLLECTION, promptId);
    await updateDoc(docRef, {
      isActive,
      updatedAt: new Date().toISOString(),
    });
  },
};
