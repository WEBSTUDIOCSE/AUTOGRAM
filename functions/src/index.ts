/**
 * Firebase Cloud Functions for Autogram Auto-Posting
 * UNIFIED SCHEDULER - Single function handles all modules dynamically
 * Adding new modules only requires updating MODULES array - no other code changes!
 */

import {setGlobalOptions} from "firebase-functions/v2";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Set global options
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
  timeoutSeconds: 540, // 9 minutes
  memory: "512MiB",
});

// Auth token for API calls (should match process.env.AUTO_POST_SECRET_TOKEN)
const AUTH_TOKEN = "autogram-auto-post-secret-2024";
const API_BASE_URL = "https://autogram-orpin.vercel.app";

/**
 * Module Registry - Configure all auto-posting modules here
 * Adding a new module requires only adding an entry here - no other code changes needed!
 */
interface AutoPostModule {
  moduleId: string;
  moduleName: string;
  collection: string;
  apiEndpoint: string;
  getScheduledItems: (currentTime: string) => Promise<Array<{
    userId: string;
    itemId: string;
    displayName: string;
    payload: Record<string, any>;
  }>>;
}

const MODULES: AutoPostModule[] = [
  // Module 3: Character Auto Poster
  {
    moduleId: "module3",
    moduleName: "Character Auto Poster",
    collection: "characters",
    apiEndpoint: "/api/auto-post",
    getScheduledItems: async (currentTime: string) => {
      const results: Array<{
        userId: string;
        itemId: string;
        displayName: string;
        payload: Record<string, any>;
      }> = [];

      // Get all characters with posting times
      const charactersSnapshot = await db.collection("characters").get();

      charactersSnapshot.forEach((doc) => {
        const character = doc.data();
        const characterId = doc.id;

        // Check if character has this posting time
        if (character.postingTimes?.includes(currentTime)) {
          results.push({
            userId: character.userId,
            itemId: characterId,
            displayName: character.name || "Unknown Character",
            payload: {
              userId: character.userId,
              scheduledTime: currentTime,
              characterId: characterId,
            },
          });
        }
      });

      return results;
    },
  },

  // Module 4: Family Auto Poster
  {
    moduleId: "module4",
    moduleName: "Family Auto Poster",
    collection: "family_profiles",
    apiEndpoint: "/api/family-auto-post",
    getScheduledItems: async (currentTime: string) => {
      const results: Array<{
        userId: string;
        itemId: string;
        displayName: string;
        payload: Record<string, any>;
      }> = [];

      // Get all active family profiles with posting times
      const profilesSnapshot = await db
        .collection("family_profiles")
        .where("isActive", "==", true)
        .get();

      profilesSnapshot.forEach((doc) => {
        const profile = doc.data();
        const profileId = doc.id;

        // Check if profile has this posting time
        if (profile.postingTimes?.includes(currentTime)) {
          results.push({
            userId: profile.userId,
            itemId: profileId,
            displayName: profile.profileName || "Unknown Profile",
            payload: {
              userId: profile.userId,
              scheduledTime: currentTime,
              profileId: profileId,
            },
          });
        }
      });

      return results;
    },
  },

  // Module 8: Video Auto Poster
  {
    moduleId: "module8",
    moduleName: "Video Auto Poster",
    collection: "video_prompts",
    apiEndpoint: "/api/video-auto-post",
    getScheduledItems: async (currentTime: string) => {
      const results: Array<{
        userId: string;
        itemId: string;
        displayName: string;
        payload: Record<string, any>;
      }> = [];

      // Get all active video prompts with posting times
      const promptsSnapshot = await db
        .collection("video_prompts")
        .where("isActive", "==", true)
        .get();

      // Check each prompt
      for (const doc of promptsSnapshot.docs) {
        const prompt = doc.data();
        const promptId = doc.id;

        // Check if prompt has this posting time
        if (prompt.postingTimes?.includes(currentTime)) {
          // Check if auto-posting is enabled for this user
          const configDoc = await db
            .collection("video_auto_post_configs")
            .doc(prompt.userId)
            .get();
          
          const config = configDoc.data();
          
          // Only add if auto-posting is enabled
          if (config?.isEnabled === true) {
            results.push({
              userId: prompt.userId,
              itemId: promptId,
              displayName: `${prompt.videoType === 'text-to-video' ? 'Text' : 'Image'}-to-Video: ${prompt.basePrompt?.substring(0, 30)}...` || "Unknown Video Prompt",
              payload: {
                userId: prompt.userId,
                scheduledTime: currentTime,
                promptId: promptId,
                videoType: prompt.videoType,
                basePrompt: prompt.basePrompt,
                characterId: prompt.characterId,
                assignedAccountId: prompt.assignedAccountId,
              },
            });
          }
        }
      }

      return results;
    },
  },
];

/**
 * Unified Scheduled Auto-Post Function
 * Single scheduler that handles ALL modules dynamically
 * Runs every 5 minutes for testing
 */
export const scheduledUnifiedAutoPost = onSchedule(
  {
    schedule: "*/5 * * * *", // Every 5 minutes for testing
    timeZone: "Asia/Kolkata", // India Standard Time (IST)
  },
  async (event) => {
    logger.info("🚀 Starting Unified Auto-Post Scheduler", {timestamp: event.scheduleTime});

    try {
      // Get current time in IST
      const now = new Date();
      const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      const currentTime = `${istTime.getHours().toString().padStart(2, "0")}:${istTime.getMinutes().toString().padStart(2, "0")}`;

      logger.info("⏰ Current time:", {
        currentTime,
        utcTime: now.toISOString(),
        istTime: istTime.toISOString(),
      });

      let totalScheduledItems = 0;
      let totalSuccessful = 0;
      let totalFailed = 0;

      // Process each module
      for (const module of MODULES) {
        logger.info(`\n📦 Processing ${module.moduleName} (${module.moduleId})`);

        try {
          // Get scheduled items for this module
          const scheduledItems = await module.getScheduledItems(currentTime);

          logger.info(`Found ${scheduledItems.length} scheduled item(s) in ${module.moduleName}`);
          totalScheduledItems += scheduledItems.length;

          if (scheduledItems.length === 0) {
            logger.info(`✓ No items scheduled for ${currentTime} in ${module.moduleName}`);
            continue;
          }

          // Execute auto-post for each scheduled item
          const promises = scheduledItems.map(async (item) => {
            logger.info(`\n▶ Executing: ${item.displayName} (${item.itemId})`);

            try {
              await executeAutoPost(module, item.payload);
              logger.info(`✅ SUCCESS: ${item.displayName}`);
              totalSuccessful++;
            } catch (error) {
              logger.error(`❌ FAILED: ${item.displayName}`, error);
              totalFailed++;

              // Log error to Firestore
              await logError(module, item, error);
            }
          });

          await Promise.all(promises);
        } catch (error) {
          logger.error(`❌ Error processing ${module.moduleName}:`, error);
        }
      }

      // Summary
      logger.info("\n📊 Execution Summary:", {
        totalScheduledItems,
        totalSuccessful,
        totalFailed,
        successRate: totalScheduledItems > 0 ? `${((totalSuccessful / totalScheduledItems) * 100).toFixed(1)}%` : "N/A",
      });

      logger.info("✅ Unified Auto-Post Scheduler completed");
    } catch (error) {
      logger.error("❌ Critical error in Unified Scheduler:", error);
      throw error;
    }
  }
);

/**
 * Execute auto-post by calling the module's API endpoint
 */
async function executeAutoPost(module: AutoPostModule, payload: Record<string, any>) {
  const apiUrl = `${API_BASE_URL}${module.apiEndpoint}`;

  logger.info(`🌐 Calling API: ${apiUrl}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 540000); // 9 minutes timeout

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        authToken: AUTH_TOKEN,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    logger.info(`📡 API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`API Error Response: ${errorText}`);
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    logger.info(`📥 API Response:`, JSON.stringify(result, null, 2));

    if (!result.success) {
      throw new Error(`Auto-post failed: ${result.error}`);
    }

    logger.info(`✅ Auto-post completed successfully`);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Log error to Firestore
 */
async function logError(
  module: AutoPostModule,
  item: { userId: string; itemId: string; displayName: string },
  error: any
) {
  try {
    const errorLog = {
      moduleId: module.moduleId,
      moduleName: module.moduleName,
      userId: item.userId,
      itemId: item.itemId,
      displayName: item.displayName,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      status: "failed",
    };

    await db.collection("unified_auto_post_errors").add(errorLog);
    logger.info("📝 Error logged to Firestore");
  } catch (logError) {
    logger.error("Failed to log error to Firestore:", logError);
  }
}

/**
 * Manual trigger endpoint for testing
 * Call with: POST /triggerUnifiedAutoPost?moduleId=module3&userId=USER_ID
 */
export const triggerUnifiedAutoPost = onRequest(async (req, res) => {
  try {
    const moduleId = req.query.moduleId as string;
    const userId = req.query.userId as string;

    if (!moduleId || !userId) {
      res.status(400).json({error: "Missing moduleId or userId parameter"});
      return;
    }

    // Find module
    const module = MODULES.find((m) => m.moduleId === moduleId);
    if (!module) {
      res.status(404).json({error: `Module not found: ${moduleId}`});
      return;
    }

    logger.info(`🧪 Manual trigger for ${module.moduleName}, user: ${userId}`);

    // Get current time
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const currentTime = `${istTime.getHours().toString().padStart(2, "0")}:${istTime.getMinutes().toString().padStart(2, "0")}`;

    // Get scheduled items
    const scheduledItems = await module.getScheduledItems(currentTime);

    // Filter by userId
    const userItems = scheduledItems.filter((item) => item.userId === userId);

    if (userItems.length === 0) {
      res.status(404).json({
        error: `No scheduled items found for user ${userId} at ${currentTime}`,
        currentTime,
      });
      return;
    }

    // Execute first item
    const item = userItems[0];
    await executeAutoPost(module, item.payload);

    res.json({
      success: true,
      message: "Auto-post triggered successfully",
      module: module.moduleName,
      item: item.displayName,
      currentTime,
    });
  } catch (error) {
    logger.error("❌ Error in manual trigger:", error);
    res.status(500).json({
      error: "Failed to trigger auto-post",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

