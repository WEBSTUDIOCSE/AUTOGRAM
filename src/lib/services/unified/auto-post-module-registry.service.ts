/**
 * Unified Auto-Post Module Registry
 * Dynamic registration system for all auto-posting modules
 * Eliminates duplicate code and enables easy addition of new modules
 */

import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase/firebase';

const db = getFirestore(app);

/**
 * Module definition interface
 */
export interface AutoPostModule {
  moduleId: string; // e.g., 'module3', 'module4'
  moduleName: string; // e.g., 'Character Auto Poster', 'Family Auto Poster'
  firestoreCollection: string; // e.g., 'characters', 'family_profiles'
  apiEndpoint: string; // e.g., '/api/auto-post', '/api/family-auto-post'
  
  // Function to check if item is scheduled for given time
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isScheduledForTime: (item: any, scheduledTime: string) => boolean;
  
  // Function to get userId from item
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getUserId: (item: any) => string;
  
  // Function to get display name for logging
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDisplayName: (item: any) => string;
  
  // Additional data needed for API call
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAdditionalPayload?: (item: any) => Record<string, any>;
}

/**
 * Module Registry - Register all auto-posting modules here
 */
const MODULE_REGISTRY: AutoPostModule[] = [
  // Module 3: Character Auto Poster
  {
    moduleId: 'module3',
    moduleName: 'Character Auto Poster',
    firestoreCollection: 'characters',
    apiEndpoint: '/api/auto-post',
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isScheduledForTime: (character: any, scheduledTime: string) => {
      // Check if character has posting times and includes this time
      return character.postingTimes?.includes(scheduledTime) || false;
    },
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getUserId: (character: any) => character.userId,
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getDisplayName: (character: any) => character.name || 'Unknown Character',
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAdditionalPayload: (character: any) => ({
      characterId: character.id,
    }),
  },
  
  // Module 4: Family Auto Poster
  {
    moduleId: 'module4',
    moduleName: 'Family Auto Poster',
    firestoreCollection: 'family_profiles',
    apiEndpoint: '/api/family-auto-post',
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isScheduledForTime: (profile: any, scheduledTime: string) => {
      // Check if profile is active and has posting times
      return profile.isActive && profile.postingTimes?.includes(scheduledTime);
    },
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getUserId: (profile: any) => profile.userId,
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getDisplayName: (profile: any) => profile.profileName || 'Unknown Profile',
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAdditionalPayload: (profile: any) => ({
      profileId: profile.id,
    }),
  },
];

/**
 * Unified Auto-Post Module Registry Service
 */
export const AutoPostModuleRegistry = {
  /**
   * Get all registered modules
   */
  getModules(): AutoPostModule[] {
    return MODULE_REGISTRY;
  },

  /**
   * Get module by ID
   */
  getModule(moduleId: string): AutoPostModule | undefined {
    return MODULE_REGISTRY.find((m) => m.moduleId === moduleId);
  },

  /**
   * Find all items scheduled for a specific time across all modules
   * Returns array of { module, item, userId, displayName, payload }
   */
  async findScheduledItems(scheduledTime: string): Promise<Array<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    module: AutoPostModule;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    item: any;
    userId: string;
    displayName: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: Record<string, any>;
  }>> {
    const results: Array<{
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      module: AutoPostModule;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      item: any;
      userId: string;
      displayName: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload: Record<string, any>;
    }> = [];

    // Process each module
    for (const moduleConfig of MODULE_REGISTRY) {
      console.log(`[${moduleConfig.moduleId}] Checking ${moduleConfig.moduleName} for time ${scheduledTime}`);

      try {
        // Query Firestore for items from this module
        const collectionRef = collection(db, moduleConfig.firestoreCollection);
        const snapshot = await getDocs(collectionRef);

        console.log(`[${moduleConfig.moduleId}] Found ${snapshot.size} total items`);

        // Check each item
        snapshot.forEach((doc) => {
          const item = { id: doc.id, ...doc.data() };
          
          // Check if this item is scheduled for the given time
          if (moduleConfig.isScheduledForTime(item, scheduledTime)) {
            const userId = moduleConfig.getUserId(item);
            const displayName = moduleConfig.getDisplayName(item);
            
            console.log(`[${moduleConfig.moduleId}] ✅ "${displayName}" is scheduled for ${scheduledTime}`);
            
            // Build payload
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payload: Record<string, any> = {
              userId,
              scheduledTime,
            };
            
            // Add module-specific data
            if (moduleConfig.getAdditionalPayload) {
              Object.assign(payload, moduleConfig.getAdditionalPayload(item));
            }
            
            results.push({
              module: moduleConfig,
              item,
              userId,
              displayName,
              payload,
            });
          }
        });
      } catch (error) {
        console.error(`[${moduleConfig.moduleId}] Error checking scheduled items:`, error);
      }
    }

    console.log(`Found ${results.length} total scheduled items across all modules`);
    return results;
  },

  /**
   * Execute auto-post for a specific item
   */
  async executeAutoPost(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    moduleConfig: AutoPostModule,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: Record<string, any>,
    authToken: string,
    baseUrl: string = 'https://autogram-orpin.vercel.app'
  ): Promise<{ success: boolean; error?: string }> {
    const apiUrl = `${baseUrl}${moduleConfig.apiEndpoint}`;
    
    console.log(`[${moduleConfig.moduleId}] Executing auto-post via ${apiUrl}`);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          authToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API call failed: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(`Auto-post failed: ${result.error}`);
      }

      console.log(`[${moduleConfig.moduleId}] ✅ Auto-post completed successfully`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[${moduleConfig.moduleId}] ❌ Auto-post failed:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  },
};
