/**
 * Module 9: Motivational Quote Prompt Library Service
 * Manages prompts for auto-posting motivational quotes
 */

import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, orderBy, Timestamp, getDoc } from 'firebase/firestore';

export interface MotivationalPrompt {
  id: string;
  userId: string;
  category: string; // 'success', 'mindset', 'motivation', 'inspiration', 'life', 'wisdom'
  quoteTemplate?: string; // Optional: predefined quote template
  themeDescription: string; // What kind of quotes to generate
  contentType: 'image' | 'video' | 'both';
  style: string; // Visual style (minimalist, bold, elegant, etc.)
  postingTimes: string[]; // ['10:00', '14:00', '18:00']
  assignedAccountId: string; // Instagram account to post to
  isActive: boolean;
  usageCount: number;
  lastUsedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const MotivationalPromptLibraryService = {
  /**
   * Create a new prompt
   */
  async createPrompt(data: Omit<MotivationalPrompt, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const promptData = {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'motivational_quote_prompts'), promptData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating motivational prompt:', error);
      throw error;
    }
  },

  /**
   * Get all prompts for a user
   */
  async getUserPrompts(userId: string): Promise<MotivationalPrompt[]> {
    try {
      const q = query(
        collection(db, 'motivational_quote_prompts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MotivationalPrompt));
    } catch (error) {
      console.error('Error getting user prompts:', error);
      throw error;
    }
  },

  /**
   * Get active prompts
   */
  async getActivePrompts(userId: string): Promise<MotivationalPrompt[]> {
    try {
      const q = query(
        collection(db, 'motivational_quote_prompts'),
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MotivationalPrompt));
    } catch (error) {
      console.error('Error getting active prompts:', error);
      throw error;
    }
  },

  /**
   * Get a prompt by ID
   */
  async getPromptById(promptId: string): Promise<MotivationalPrompt | null> {
    try {
      const docRef = doc(db, 'motivational_quote_prompts', promptId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as MotivationalPrompt;
      }

      return null;
    } catch (error) {
      console.error('Error getting prompt by ID:', error);
      throw error;
    }
  },

  /**
   * Update a prompt
   */
  async updatePrompt(promptId: string, data: Partial<MotivationalPrompt>): Promise<void> {
    try {
      const docRef = doc(db, 'motivational_quote_prompts', promptId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating motivational prompt:', error);
      throw error;
    }
  },

  /**
   * Delete a prompt
   */
  async deletePrompt(promptId: string): Promise<void> {
    try {
      const docRef = doc(db, 'motivational_quote_prompts', promptId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting motivational prompt:', error);
      throw error;
    }
  },

  /**
   * Increment usage count
   */
  async incrementUsage(promptId: string): Promise<void> {
    try {
      const docRef = doc(db, 'motivational_quote_prompts', promptId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const currentCount = docSnap.data().usageCount || 0;
        await updateDoc(docRef, {
          usageCount: currentCount + 1,
          lastUsedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('Error incrementing usage count:', error);
      throw error;
    }
  },
};
