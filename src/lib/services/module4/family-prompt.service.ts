import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { FamilyPromptTemplate, FamilyPromptCategory } from '@/lib/firebase/config/types';

const COLLECTION_NAME = 'family_prompt_templates';

/**
 * Pre-defined prompts for different family categories
 */
export const DEFAULT_COUPLE_PROMPTS = [
  'Romantic dinner date',
  'Walking hand in hand in the park',
  'Watching sunset together',
  'Cooking together in kitchen',
  'Dancing under the stars',
  'Sharing a coffee at a cafe',
  'Beach walk at sunset',
  'Reading books together',
  'Having a picnic',
  'Celebrating anniversary',
  'Road trip adventure',
  'Movie night at home',
  'Exercising together',
  'Shopping together',
  'Cozy evening at home',
];

export const DEFAULT_FAMILY_PROMPTS = [
  'Family picnic in the garden',
  'Celebrating birthday party',
  'Family game night',
  'Cooking family dinner together',
  'Watching a movie together',
  'Family vacation at the beach',
  'Decorating for holidays',
  'Family photo session',
  'Gardening together',
  'Baking cookies together',
  'Family barbecue',
  'Playing board games',
  'Visiting amusement park',
  'Family hiking trip',
  'Celebrating festival together',
];

export const DEFAULT_KIDS_PROMPTS = [
  'Playing in the garden',
  'Drawing and coloring',
  'Building with blocks',
  'Reading bedtime story',
  'Homework time',
  'Playing with toys',
  'Bicycle riding in park',
  'Playing sports',
  'Arts and crafts time',
  'Baking with mom',
  'Playing in the playground',
  'Learning to ride a bike',
  'Making science experiments',
  'Playing dress-up',
  'Water play in summer',
];

/**
 * Service for managing family prompt templates for Module 4
 */
export class FamilyPromptService {
  /**
   * Get all prompt templates for a family profile
   */
  static async getPrompts(
    userId: string,
    familyProfileId: string
  ): Promise<FamilyPromptTemplate[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('familyProfileId', '==', familyProfileId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          familyProfileId: data.familyProfileId,
          category: data.category,
          basePrompt: data.basePrompt,
          usageCount: data.usageCount || 0,
          lastUsedAt: data.lastUsedAt instanceof Timestamp ? data.lastUsedAt.toDate().toISOString() : data.lastUsedAt,
          isActive: data.isActive,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
      });
    } catch (error) {
      console.error('Error getting family prompts:', error);
      throw new Error('Failed to get family prompts');
    }
  }

  /**
   * Get prompts by category
   */
  static async getPromptsByCategory(
    userId: string,
    familyProfileId: string,
    category: FamilyPromptCategory
  ): Promise<FamilyPromptTemplate[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('familyProfileId', '==', familyProfileId),
        where('category', '==', category),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          familyProfileId: data.familyProfileId,
          category: data.category,
          basePrompt: data.basePrompt,
          usageCount: data.usageCount || 0,
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
   * Create a new prompt template
   */
  static async createPrompt(
    userId: string,
    familyProfileId: string,
    category: FamilyPromptCategory,
    basePrompt: string
  ): Promise<FamilyPromptTemplate> {
    try {
      const promptRef = doc(collection(db, COLLECTION_NAME));

      const promptData = {
        userId,
        familyProfileId,
        category,
        basePrompt,
        usageCount: 0,
        lastUsedAt: null,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(promptRef, promptData);

      return {
        id: promptRef.id,
        userId,
        familyProfileId,
        category,
        basePrompt,
        usageCount: 0,
        lastUsedAt: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating prompt:', error);
      throw new Error('Failed to create prompt');
    }
  }

  /**
   * Update a prompt template
   */
  static async updatePrompt(
    promptId: string,
    updates: {
      basePrompt?: string;
      category?: FamilyPromptCategory;
      isActive?: boolean;
    }
  ): Promise<void> {
    try {
      const promptRef = doc(db, COLLECTION_NAME, promptId);
      
      await updateDoc(promptRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating prompt:', error);
      throw new Error('Failed to update prompt');
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
      throw new Error('Failed to delete prompt');
    }
  }

  /**
   * Increment usage count for a prompt
   */
  static async incrementUsage(promptId: string): Promise<void> {
    try {
      const promptRef = doc(db, COLLECTION_NAME, promptId);
      const promptSnap = await getDoc(promptRef);
      const currentUsage = promptSnap.data()?.usageCount || 0;
      
      await updateDoc(promptRef, {
        usageCount: currentUsage + 1,
        lastUsedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error incrementing prompt usage:', error);
      throw new Error('Failed to update prompt usage');
    }
  }

  /**
   * Get default prompts for a category
   */
  static getDefaultPrompts(category: FamilyPromptCategory): string[] {
    switch (category) {
      case 'couple':
        return DEFAULT_COUPLE_PROMPTS;
      case 'family':
        return DEFAULT_FAMILY_PROMPTS;
      case 'kids':
        return DEFAULT_KIDS_PROMPTS;
      case 'custom':
        return [];
      default:
        return [];
    }
  }

  /**
   * Initialize default prompts for a family profile
   */
  static async initializeDefaultPrompts(
    userId: string,
    familyProfileId: string
  ): Promise<void> {
    try {
      const categories: FamilyPromptCategory[] = ['couple', 'family', 'kids'];
      
      for (const category of categories) {
        const defaultPrompts = this.getDefaultPrompts(category);
        
        // Create first 5 prompts from each category as default
        for (let i = 0; i < Math.min(5, defaultPrompts.length); i++) {
          await this.createPrompt(userId, familyProfileId, category, defaultPrompts[i]);
        }
      }
    } catch (error) {
      console.error('Error initializing default prompts:', error);
      throw new Error('Failed to initialize default prompts');
    }
  }

  /**
   * Generate default prompts based on family type
   */
  static async generateDefaultPrompts(
    userId: string,
    familyProfileId: string,
    category: FamilyPromptCategory
  ): Promise<void> {
    try {
      const defaultPrompts = this.getDefaultPrompts(category);
      
      // Create all default prompts for the specified category
      for (const promptText of defaultPrompts) {
        await this.createPrompt(userId, familyProfileId, category, promptText);
      }
    } catch (error) {
      console.error('Error generating default prompts:', error);
      throw new Error('Failed to generate default prompts');
    }
  }
}
