/**
 * Firebase Cloud Functions for Autogram Auto-Posting
 * Scheduled function that executes auto-posts at configured times
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

/**
 * Scheduled function that runs every hour to check for auto-posts
 * Runs at: 0 * * * * (every hour at minute 0)
 */
export const scheduledAutoPost = onSchedule(
  {
    schedule: "0 * * * *", // Every hour
    timeZone: "America/New_York", // Adjust to your timezone
  },
  async (event) => {
    logger.info("Starting scheduled auto-post check", {timestamp: event.scheduleTime});

    try {
      // Get current time in HH:mm format
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      
      logger.info("Current time:", {currentTime});

      // Query all enabled auto-post configs with matching posting time
      const configsSnapshot = await db
        .collection("auto_post_configs")
        .where("isEnabled", "==", true)
        .where("postingTimes", "array-contains", currentTime)
        .get();

      logger.info(`Found ${configsSnapshot.size} enabled configs for time ${currentTime}`);

      // Process each config
      const promises = configsSnapshot.docs.map(async (doc) => {
        const userId = doc.id;
        const config = doc.data();

        logger.info(`Processing auto-post for user: ${userId}`);

        try {
          // Call the auto-post execution endpoint
          await executeAutoPost(userId, currentTime, config);
          logger.info(`Successfully executed auto-post for user: ${userId}`);
        } catch (error) {
          logger.error(`Failed to execute auto-post for user ${userId}:`, error);
        }
      });

      await Promise.all(promises);
      logger.info("Completed scheduled auto-post check");
    } catch (error) {
      logger.error("Error in scheduled auto-post:", error);
      throw error;
    }
  }
);

/**
 * Manual trigger endpoint for testing auto-posts
 * Call with: POST /triggerAutoPost?userId=USER_ID
 */
export const triggerAutoPost = onRequest(async (req, res) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      res.status(400).json({error: "Missing userId parameter"});
      return;
    }

    logger.info(`Manual trigger for user: ${userId}`);

    // Get user config
    const configDoc = await db.collection("auto_post_configs").doc(userId).get();
    
    if (!configDoc.exists) {
      res.status(404).json({error: "Config not found"});
      return;
    }

    const config = configDoc.data();
    const currentTime = new Date().toTimeString().substring(0, 5);

    await executeAutoPost(userId, currentTime, config);

    res.json({
      success: true,
      message: "Auto-post triggered successfully",
      userId,
    });
  } catch (error) {
    logger.error("Error in manual trigger:", error);
    res.status(500).json({error: "Failed to trigger auto-post"});
  }
});

/**
 * Execute auto-post for a user
 */
async function executeAutoPost(userId: string, scheduledTime: string, config: any) {
  logger.info(`Executing auto-post for user ${userId} at ${scheduledTime}`);

  try {
    // 1. Select a random character
    const charactersSnapshot = await db
      .collection("characters")
      .where("userId", "==", userId)
      .get();

    if (charactersSnapshot.empty) {
      throw new Error("No characters found for user");
    }

    const characters = charactersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];
    const selectedCharacter = characters[Math.floor(Math.random() * characters.length)];

    logger.info(`Selected character: ${selectedCharacter.name}`);

    // 2. Select Instagram account based on rotation strategy
    const accountId = selectInstagramAccount(config);
    logger.info(`Selected Instagram account: ${accountId}`);

    // 3. Get a random prompt template
    const promptsSnapshot = await db
      .collection("prompt_templates")
      .where("userId", "==", userId)
      .where("isActive", "==", true)
      .get();

    if (promptsSnapshot.empty) {
      throw new Error("No active prompt templates found");
    }

    const prompts = promptsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];
    const selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    
    logger.info(`Selected prompt: ${selectedPrompt.basePrompt}`);

    // 4. Save log entry
    const logData = {
      userId,
      characterId: selectedCharacter.id,
      characterName: selectedCharacter.name,
      basePrompt: selectedPrompt.basePrompt,
      generatedPrompt: selectedPrompt.basePrompt, // Will be variation in production
      instagramAccountId: accountId,
      instagramAccountName: config.instagramAccounts?.find((a: any) => a === accountId) || accountId,
      scheduledTime,
      executedAt: new Date().toISOString(),
      status: "success",
      generatedImageUrl: "", // Will be set after generation
      caption: "",
      hashtags: "",
      instagramPostId: "",
    };

    await db.collection("auto_post_logs").add(logData);
    
    // Increment prompt usage
    await db.collection("prompt_templates").doc(selectedPrompt.id).update({
      usageCount: (selectedPrompt.usageCount || 0) + 1,
      lastUsedAt: new Date().toISOString(),
    });

    logger.info("Auto-post execution completed and logged");
  } catch (error) {
    logger.error("Error executing auto-post:", error);
    
    // Save error log
    await db.collection("auto_post_logs").add({
      userId,
      scheduledTime,
      executedAt: new Date().toISOString(),
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    throw error;
  }
}

/**
 * Select Instagram account based on rotation strategy
 */
function selectInstagramAccount(config: any): string {
  const accounts = config.instagramAccounts || [];
  
  if (accounts.length === 0) {
    throw new Error("No Instagram accounts configured");
  }

  if (config.accountRotationStrategy === "random") {
    // Random selection
    return accounts[Math.floor(Math.random() * accounts.length)];
  } else {
    // Rotate evenly - use timestamp for simple rotation
    const index = Math.floor(Date.now() / 1000) % accounts.length;
    return accounts[index];
  }
}

