/**
 * User Preferences Service
 * Handles storing and retrieving user preferences in Firestore
 */

import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { firebaseHandler, type ApiResponse } from '../handler';

export interface UserPreferences {
  aiProvider?: 'gemini' | 'kieai';
  
  // Model selection
  textToImageModel?: string;    // Model for new image generation
  imageToImageModel?: string;   // Model for character consistency
  
  // Legacy fields (kept for backward compatibility)
  geminiImageModel?: string;
  geminiTextModel?: string;
  kieaiModel?: string;
  
  theme?: 'light' | 'dark' | 'system';
  updatedAt?: Timestamp;
}

/**
 * User Preferences Service
 */
export const UserPreferencesService = {
  /**
   * Get user preferences from Firestore
   */
  getPreferences: async (userId?: string): Promise<ApiResponse<UserPreferences>> => {
    return firebaseHandler(async () => {
      const uid = userId || auth.currentUser?.uid;
      
      if (!uid) {
        throw new Error('User not authenticated');
      }

      const prefsDoc = await getDoc(doc(db, 'users', uid, 'preferences', 'settings'));
      
      if (prefsDoc.exists()) {
        return prefsDoc.data() as UserPreferences;
      }

      // Return default preferences
      return {
        aiProvider: 'gemini'
      };
    }, 'user-preferences/get');
  },

  /**
   * Save user preferences to Firestore
   */
  savePreferences: async (
    preferences: Partial<UserPreferences>,
    userId?: string
  ): Promise<ApiResponse<UserPreferences>> => {
    return firebaseHandler(async () => {
      const uid = userId || auth.currentUser?.uid;
      
      if (!uid) {
        throw new Error('User not authenticated');
      }

      const prefsRef = doc(db, 'users', uid, 'preferences', 'settings');
      
      const updatedPrefs = {
        ...preferences,
        updatedAt: serverTimestamp()
      };

      await setDoc(prefsRef, updatedPrefs, { merge: true });
      
      return updatedPrefs as UserPreferences;
    }, 'user-preferences/save');
  },

  /**
   * Update AI provider preference
   */
  updateAIProvider: async (
    provider: 'gemini' | 'kieai',
    userId?: string
  ): Promise<ApiResponse<UserPreferences>> => {
    return UserPreferencesService.savePreferences(
      { aiProvider: provider },
      userId
    );
  },

  /**
   * Update AI model preferences
   */
  updateAIModels: async (
    models: {
      geminiImageModel?: string;
      geminiTextModel?: string;
      kieaiModel?: string;
    },
    userId?: string
  ): Promise<ApiResponse<UserPreferences>> => {
    return UserPreferencesService.savePreferences(models, userId);
  }
};
