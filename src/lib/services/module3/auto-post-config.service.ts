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
        timezone: data.timezone,
        activeCharacterIds: data.activeCharacterIds || [],
        minCharacters: data.minCharacters,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      };
    } catch (error) {
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
        timezone: 'Asia/Kolkata',
        activeCharacterIds: [], // No characters active by default
        minCharacters: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(configRef, defaultConfig);

      return {
        id: userId,
        userId,
        isEnabled: false,
        timezone: defaultConfig.timezone,
        activeCharacterIds: [],
        minCharacters: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
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
   * Update active character IDs for auto-posting
   */
  static async updateActiveCharacters(userId: string, characterIds: string[]): Promise<void> {
    await this.updateConfig(userId, { activeCharacterIds: characterIds });
  }

  /**
   * Add a character to active list
   */
  static async addActiveCharacter(userId: string, characterId: string): Promise<void> {
    const config = await this.getOrCreateConfig(userId);
    const activeIds = new Set(config.activeCharacterIds);
    activeIds.add(characterId);
    await this.updateConfig(userId, { activeCharacterIds: Array.from(activeIds) });
  }

  /**
   * Remove a character from active list
   */
  static async removeActiveCharacter(userId: string, characterId: string): Promise<void> {
    const config = await this.getOrCreateConfig(userId);
    const activeIds = config.activeCharacterIds.filter(id => id !== characterId);
    await this.updateConfig(userId, { activeCharacterIds: activeIds });
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
   * Check if user can enable auto-posting
   * Validates that at least one character is active and has posting times configured
   */
  static async canEnableAutoPosting(
    userId: string,
    characters: Array<{ id: string; postingTimes: string[] }>
  ): Promise<{ canEnable: boolean; reason?: string }> {
    const config = await this.getOrCreateConfig(userId);

    if (config.activeCharacterIds.length === 0) {
      return {
        canEnable: false,
        reason: 'Please select at least one character for auto-posting',
      };
    }

    // Check if at least one active character has posting times configured
    const activeCharacters = characters.filter(char => 
      config.activeCharacterIds.includes(char.id)
    );

    const hasPostingTimes = activeCharacters.some(char => 
      char.postingTimes && char.postingTimes.length > 0
    );

    if (!hasPostingTimes) {
      return {
        canEnable: false,
        reason: 'At least one active character must have posting times configured',
      };
    }

    return { canEnable: true };
  }
}
