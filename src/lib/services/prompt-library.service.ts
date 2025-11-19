import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { PromptTemplate } from '@/lib/firebase/config/types';

const COLLECTION_NAME = 'prompt_templates';

/**
 * Service for managing prompt templates for Module 3
 */
export class PromptLibraryService {
  /**
   * Get all active prompt templates for a user
   */
  static async getUserPrompts(userId: string): Promise<PromptTemplate[]> {
    try {
      const promptsRef = collection(db, COLLECTION_NAME);
      const q = query(
        promptsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          basePrompt: data.basePrompt,
          category: data.category,
          usageCount: data.usageCount,
          lastUsedAt: data.lastUsedAt instanceof Timestamp ? data.lastUsedAt.toDate().toISOString() : data.lastUsedAt,
          isActive: data.isActive,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
      });
    } catch (error) {
      console.error('Error getting user prompts:', error);
      throw new Error('Failed to get prompt templates');
    }
  }

  /**
   * Get only active prompts
   */
  static async getActivePrompts(userId: string): Promise<PromptTemplate[]> {
    const prompts = await this.getUserPrompts(userId);
    return prompts.filter((prompt) => prompt.isActive);
  }

  /**
   * Get a single prompt template by ID
   */
  static async getPrompt(promptId: string): Promise<PromptTemplate | null> {
    try {
      const promptRef = doc(db, COLLECTION_NAME, promptId);
      const promptSnap = await getDoc(promptRef);

      if (!promptSnap.exists()) {
        return null;
      }

      const data = promptSnap.data();
      return {
        id: promptSnap.id,
        userId: data.userId,
        basePrompt: data.basePrompt,
        category: data.category,
        usageCount: data.usageCount,
        lastUsedAt: data.lastUsedAt instanceof Timestamp ? data.lastUsedAt.toDate().toISOString() : data.lastUsedAt,
        isActive: data.isActive,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      };
    } catch (error) {
      console.error('Error getting prompt:', error);
      throw new Error('Failed to get prompt template');
    }
  }

  /**
   * Create a new prompt template
   */
  static async createPrompt(
    userId: string,
    basePrompt: string,
    category?: string
  ): Promise<PromptTemplate> {
    try {
      if (!basePrompt.trim()) {
        throw new Error('Prompt cannot be empty');
      }

      const promptData = {
        userId,
        basePrompt: basePrompt.trim(),
        category: category?.trim() || null,
        usageCount: 0,
        lastUsedAt: null,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const promptsRef = collection(db, COLLECTION_NAME);
      const docRef = await addDoc(promptsRef, promptData);

      return {
        id: docRef.id,
        userId,
        basePrompt: basePrompt.trim(),
        category: category?.trim(),
        usageCount: 0,
        lastUsedAt: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating prompt:', error);
      throw new Error('Failed to create prompt template');
    }
  }

  /**
   * Update a prompt template
   */
  static async updatePrompt(
    promptId: string,
    updates: {
      basePrompt?: string;
      category?: string;
      isActive?: boolean;
    }
  ): Promise<void> {
    try {
      const promptRef = doc(db, COLLECTION_NAME, promptId);
      
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };

      if (updates.basePrompt !== undefined) {
        if (!updates.basePrompt.trim()) {
          throw new Error('Prompt cannot be empty');
        }
        updateData.basePrompt = updates.basePrompt.trim();
      }

      if (updates.category !== undefined) {
        updateData.category = updates.category?.trim() || null;
      }

      if (updates.isActive !== undefined) {
        updateData.isActive = updates.isActive;
      }

      await updateDoc(promptRef, updateData);
    } catch (error) {
      console.error('Error updating prompt:', error);
      throw new Error('Failed to update prompt template');
    }
  }

  /**
   * Delete a prompt template
   */
  static async deletePrompt(promptId: string): Promise<void> {
    try {
      const promptRef = doc(db, COLLECTION_NAME, promptId);
      await deleteDoc(promptRef);
    } catch (error) {
      console.error('Error deleting prompt:', error);
      throw new Error('Failed to delete prompt template');
    }
  }

  /**
   * Toggle prompt active status
   */
  static async toggleActive(promptId: string, isActive: boolean): Promise<void> {
    await this.updatePrompt(promptId, { isActive });
  }

  /**
   * Increment usage count and update last used timestamp
   */
  static async incrementUsage(promptId: string): Promise<void> {
    try {
      const promptRef = doc(db, COLLECTION_NAME, promptId);
      const promptSnap = await getDoc(promptRef);

      if (!promptSnap.exists()) {
        throw new Error('Prompt not found');
      }

      const currentUsageCount = promptSnap.data().usageCount || 0;

      await updateDoc(promptRef, {
        usageCount: currentUsageCount + 1,
        lastUsedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error incrementing prompt usage:', error);
      throw new Error('Failed to update prompt usage');
    }
  }

  /**
   * Get prompts by category
   */
  static async getPromptsByCategory(
    userId: string,
    category: string
  ): Promise<PromptTemplate[]> {
    try {
      const promptsRef = collection(db, COLLECTION_NAME);
      const q = query(
        promptsRef,
        where('userId', '==', userId),
        where('category', '==', category),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          basePrompt: data.basePrompt,
          category: data.category,
          usageCount: data.usageCount,
          lastUsedAt: data.lastUsedAt instanceof Timestamp ? data.lastUsedAt.toDate().toISOString() : data.lastUsedAt,
          isActive: data.isActive,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
      });
    } catch (error) {
      console.error('Error getting prompts by category:', error);
      throw new Error('Failed to get prompts by category');
    }
  }

  /**
   * Get a random active prompt for auto-posting
   */
  static async getRandomPrompt(userId: string): Promise<PromptTemplate | null> {
    const activePrompts = await this.getActivePrompts(userId);
    
    if (activePrompts.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * activePrompts.length);
    return activePrompts[randomIndex];
  }

  /**
   * Create default prompts for new users
   */
  static async createDefaultPrompts(userId: string): Promise<void> {
    const defaultPrompts = [
      { prompt: 'wearing elegant dress in a modern cafe', category: 'fashion' },
      { prompt: 'standing by the beach at golden sunset', category: 'outdoor' },
      { prompt: 'in professional studio with dramatic lighting', category: 'studio' },
      { prompt: 'walking through city streets at night', category: 'urban' },
      { prompt: 'relaxing in a cozy home environment', category: 'lifestyle' },
    ];

    try {
      for (const { prompt, category } of defaultPrompts) {
        await this.createPrompt(userId, prompt, category);
      }
    } catch (error) {
      console.error('Error creating default prompts:', error);
      // Don't throw error, just log it
    }
  }
}
