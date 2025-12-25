/**
 * Video Auto-Post Configuration Service (Module 8)
 * Manages video auto-posting configuration in Firestore
 */

import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { VideoAutoPostConfig } from '../config/types';

const VIDEO_AUTO_POST_CONFIGS_COLLECTION = 'video_auto_post_configs';

export const VideoAutoPostConfigService = {
  /**
   * Get or create config for a user
   */
  getOrCreateConfig: async (userId: string): Promise<VideoAutoPostConfig> => {
    const docRef = doc(db, VIDEO_AUTO_POST_CONFIGS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as VideoAutoPostConfig;
    }

    // Create default config
    const defaultConfig: VideoAutoPostConfig = {
      id: userId,
      userId,
      isEnabled: false,
      timezone: 'Asia/Kolkata',
      activeTextToVideoIds: [],
      activeImageToVideoIds: [],
      minPrompts: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, defaultConfig);
    return defaultConfig;
  },

  /**
   * Update config
   */
  updateConfig: async (userId: string, updates: Partial<VideoAutoPostConfig>): Promise<void> => {
    const docRef = doc(db, VIDEO_AUTO_POST_CONFIGS_COLLECTION, userId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Enable auto-posting
   */
  enableAutoPosting: async (
    userId: string,
    activeTextToVideoIds: string[],
    activeImageToVideoIds: string[]
  ): Promise<void> => {
    const docRef = doc(db, VIDEO_AUTO_POST_CONFIGS_COLLECTION, userId);
    await updateDoc(docRef, {
      isEnabled: true,
      activeTextToVideoIds,
      activeImageToVideoIds,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Disable auto-posting
   */
  disableAutoPosting: async (userId: string): Promise<void> => {
    const docRef = doc(db, VIDEO_AUTO_POST_CONFIGS_COLLECTION, userId);
    await updateDoc(docRef, {
      isEnabled: false,
      updatedAt: new Date().toISOString(),
    });
  },
};
