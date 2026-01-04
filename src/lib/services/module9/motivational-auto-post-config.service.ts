/**
 * Module 9: Motivational Quote Auto-Post Configuration Service
 */

import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';

export interface AccountConfig {
  accountId: string;
  category: string;
  style: string;
  contentType: 'image' | 'video';
  postingTimes: string[];
  language?: 'english' | 'hindi' | 'marathi'; // Language preference for quote generation
}

export interface ModuleAIModelConfig {
  textToImageModel?: string;
  imageToImageModel?: string;
  textToVideoModel?: string;
  imageToVideoModel?: string;
}

export interface MotivationalAutoPostConfig {
  userId: string;
  isEnabled: boolean;
  accountConfigs: AccountConfig[];
  // Module-specific AI model settings
  aiModelConfig?: ModuleAIModelConfig;
  updatedAt: Timestamp;
}

export const MotivationalAutoPostConfigService = {
  /**
   * Get config for a user
   */
  async getConfig(userId: string): Promise<MotivationalAutoPostConfig | null> {
    try {
      const docRef = doc(db, 'users', userId, 'motivational_auto_post_configs', 'default');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as MotivationalAutoPostConfig;
      }

      return null;
    } catch (error) {
      console.error('Error getting motivational auto-post config:', error);
      throw error;
    }
  },

  /**
   * Create or update config
   */
  async updateConfig(userId: string, data: Partial<MotivationalAutoPostConfig>): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId, 'motivational_auto_post_configs', 'default');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          ...data,
          updatedAt: Timestamp.now(),
        });
      } else {
        await setDoc(docRef, {
          userId,
          isEnabled: false,
          accountConfigs: [],
          ...data,
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('Error updating motivational auto-post config:', error);
      throw error;
    }
  },

  /**
   * Enable auto-posting
   */
  async enable(userId: string): Promise<void> {
    await this.updateConfig(userId, { isEnabled: true });
  },

  /**
   * Disable auto-posting
   */
  async disable(userId: string): Promise<void> {
    await this.updateConfig(userId, { isEnabled: false });
  },
};
