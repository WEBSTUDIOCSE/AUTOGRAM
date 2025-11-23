import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { AutoPostConfig } from '@/lib/firebase/config/types';

const COLLECTION_NAME = 'auto_post_configs';

/**
 * Service for managing auto-post configuration for Module 3
 */
export class AutoPostConfigService {
  /**
   * Get user's auto-post configuration
   */
  static async getConfig(userId: string): Promise<AutoPostConfig | null> {
    try {
      const configRef = doc(db, COLLECTION_NAME, userId);
      const configSnap = await getDoc(configRef);

      if (!configSnap.exists()) {
        return null;
      }

      const data = configSnap.data();
      return {
        id: configSnap.id,
        userId: data.userId,
        isEnabled: data.isEnabled,
        postingTimes: data.postingTimes,
        timezone: data.timezone,
        instagramAccounts: data.instagramAccounts,
        minCharacters: data.minCharacters,
        accountRotationStrategy: data.accountRotationStrategy,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      };
    } catch (error) {
      console.error('Error getting auto-post config:', error);
      throw new Error('Failed to get auto-post configuration');
    }
  }

  /**
   * Create default auto-post configuration for new users
   */
  static async createDefaultConfig(userId: string): Promise<AutoPostConfig> {
    try {
      const configRef = doc(db, COLLECTION_NAME, userId);
      
      const defaultConfig = {
        userId,
        isEnabled: false,
        postingTimes: ['10:00', '18:00'],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        instagramAccounts: [],
        minCharacters: 1,
        accountRotationStrategy: 'rotate' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(configRef, defaultConfig);

      return {
        id: userId,
        userId,
        isEnabled: false,
        postingTimes: ['10:00', '18:00'],
        timezone: defaultConfig.timezone,
        instagramAccounts: [],
        minCharacters: 1,
        accountRotationStrategy: 'rotate',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating default config:', error);
      throw new Error('Failed to create default configuration');
    }
  }

  /**
   * Get or create user's auto-post configuration
   */
  static async getOrCreateConfig(userId: string): Promise<AutoPostConfig> {
    const config = await this.getConfig(userId);
    if (config) {
      return config;
    }
    return this.createDefaultConfig(userId);
  }

  /**
   * Update auto-post configuration
   */
  static async updateConfig(
    userId: string,
    updates: Partial<Omit<AutoPostConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    try {
      const configRef = doc(db, COLLECTION_NAME, userId);
      
      await updateDoc(configRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating auto-post config:', error);
      throw new Error('Failed to update auto-post configuration');
    }
  }

  /**
   * Enable auto-posting
   */
  static async enableAutoPosting(userId: string): Promise<void> {
    await this.updateConfig(userId, { isEnabled: true });
  }

  /**
   * Disable auto-posting
   */
  static async disableAutoPosting(userId: string): Promise<void> {
    await this.updateConfig(userId, { isEnabled: false });
  }

  /**
   * Update posting times
   */
  static async updatePostingTimes(userId: string, times: string[]): Promise<void> {
    // Validate time format (HH:mm)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    for (const time of times) {
      if (!timeRegex.test(time)) {
        throw new Error(`Invalid time format: ${time}. Use HH:mm format.`);
      }
    }

    await this.updateConfig(userId, { postingTimes: times });
  }

  /**
   * Update Instagram accounts
   */
  static async updateInstagramAccounts(userId: string, accountIds: string[]): Promise<void> {
    await this.updateConfig(userId, { instagramAccounts: accountIds });
  }

  /**
   * Update timezone
   */
  static async updateTimezone(userId: string, timezone: string): Promise<void> {
    await this.updateConfig(userId, { timezone });
  }

  /**
   * Update minimum characters requirement
   */
  static async updateMinCharacters(userId: string, minCharacters: number): Promise<void> {
    if (minCharacters < 1) {
      throw new Error('Minimum characters must be at least 1');
    }
    await this.updateConfig(userId, { minCharacters });
  }

  /**
   * Update account rotation strategy
   */
  static async updateRotationStrategy(
    userId: string,
    strategy: 'rotate' | 'random'
  ): Promise<void> {
    await this.updateConfig(userId, { accountRotationStrategy: strategy });
  }

  /**
   * Check if user can enable auto-posting
   */
  static async canEnableAutoPosting(
    userId: string,
    characterCount: number
  ): Promise<{ canEnable: boolean; reason?: string }> {
    const config = await this.getOrCreateConfig(userId);

    if (characterCount < config.minCharacters) {
      return {
        canEnable: false,
        reason: `You need at least ${config.minCharacters} characters uploaded to enable auto-posting`,
      };
    }

    if (config.instagramAccounts.length === 0) {
      return {
        canEnable: false,
        reason: 'Please select at least one Instagram account',
      };
    }

    if (config.postingTimes.length === 0) {
      return {
        canEnable: false,
        reason: 'Please set at least one posting time',
      };
    }

    return { canEnable: true };
  }
}
