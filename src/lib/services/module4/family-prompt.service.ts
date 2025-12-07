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
import { DailyContextService } from '../prompting';
import type { FamilyPromptTemplate, FamilyPromptCategory } from '@/lib/firebase/config/types';

const COLLECTION_NAME = 'family_prompt_templates';

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
   * Get dynamic prompts for a category using DailyContextService
   */
  static async getDefaultPrompts(category: FamilyPromptCategory): Promise<string[]> {
    // For custom category, return empty array
    if (category === 'custom') {
      return [];
    }

    try {
      // Get daily context opportunities
      const opportunities = await DailyContextService.getDefaultOpportunities();
      
      // Filter and adapt opportunities based on category
      const categoryPrompts = opportunities
        .filter(opp => {
          const theme = `${opp.title} ${opp.description}`.toLowerCase();
          switch (category) {
            case 'couple':
              return theme.includes('romantic') || 
                     theme.includes('date') || 
                     theme.includes('together') ||
                     theme.includes('intimate') ||
                     theme.includes('cozy') ||
                     opp.tags.some(tag => tag.toLowerCase().includes('couple'));
            case 'family':
              return theme.includes('family') || 
                     theme.includes('celebration') || 
                     theme.includes('gathering') ||
                     theme.includes('together') ||
                     opp.tags.some(tag => tag.toLowerCase().includes('family'));
            case 'kids':
              return theme.includes('play') || 
                     theme.includes('learn') || 
                     theme.includes('fun') ||
                     theme.includes('activity') ||
                     opp.tags.some(tag => tag.toLowerCase().includes('children') || tag.toLowerCase().includes('kids'));
            default:
              return false;
          }
        })
        .map(opp => opp.description)
        .slice(0, 15); // Limit to 15 prompts

      // If not enough prompts, add generic category-specific ones
      if (categoryPrompts.length < 10) {
        const genericPrompts = this.getGenericPromptsByCategory(category);
        categoryPrompts.push(...genericPrompts.slice(0, 10 - categoryPrompts.length));
      }

      return categoryPrompts;
    } catch (error) {
      console.error('Error getting default prompts:', error);
      // Fallback to generic prompts
      return this.getGenericPromptsByCategory(category);
    }
  }

  /**
   * Get generic fallback prompts when dynamic generation fails
   */
  private static getGenericPromptsByCategory(category: FamilyPromptCategory): string[] {
    switch (category) {
      case 'couple':
        return [
          'Romantic moment together',
          'Walking hand in hand',
          'Sharing a special moment',
          'Enjoying time together',
          'Cozy evening at home',
          'Adventure together',
          'Celebrating love',
          'Quality time together',
        ];
      case 'family':
        return [
          'Family time together',
          'Celebrating special moment',
          'Fun family activity',
          'Quality family time',
          'Family bonding moment',
          'Creating family memories',
          'Family celebration',
          'Enjoying together',
        ];
      case 'kids':
        return [
          'Playing and having fun',
          'Learning and exploring',
          'Creative playtime',
          'Outdoor activities',
          'Fun and games',
          'Imaginative play',
          'Learning adventure',
          'Playful moment',
        ];
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
        const defaultPrompts = await this.getDefaultPrompts(category);
        
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
      const defaultPrompts = await this.getDefaultPrompts(category);
      
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
