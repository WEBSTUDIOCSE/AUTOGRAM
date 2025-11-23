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
    schedule: "0 * * * *", // Every hour at :00
    timeZone: "Asia/Kolkata", // India Standard Time (IST)
  },
  async (event) => {
    logger.info("Starting scheduled auto-post check", {timestamp: event.scheduleTime});

    try {
      // Get current time in IST (Asia/Kolkata timezone)
      const now = new Date();
      const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      const currentTime = `${istTime.getHours().toString().padStart(2, "0")}:${istTime.getMinutes().toString().padStart(2, "0")}`;
      
      logger.info("Current time:", {currentTime, utcTime: now.toISOString(), istTime: istTime.toISOString()});

      // Query all enabled auto-post configs with matching posting time
      const configsSnapshot = await db
        .collection("auto_post_configs")
        .where("isEnabled", "==", true)
        .where("postingTimes", "array-contains", currentTime)
        .get();

      logger.info(`Found ${configsSnapshot.size} enabled configs for time ${currentTime}`);

      if (configsSnapshot.empty) {
        logger.info("No users scheduled for auto-post at this time");
        return;
      }

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
 * Execute auto-post for a user by calling the Next.js API endpoint
 */
async function executeAutoPost(userId: string, scheduledTime: string, config: any) {
  logger.info(`Executing auto-post for user ${userId} at ${scheduledTime}`);

  try {
    // Call the Next.js API endpoint on Vercel
    const apiUrl = "https://autogram-orpin.vercel.app/api/auto-post";
    const authToken = "autogram-auto-post-secret-2024"; // Should match process.env.AUTO_POST_SECRET_TOKEN

    logger.info(`Calling API endpoint: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        scheduledTime,
        authToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API call failed: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    logger.info(`API response:`, result);

    if (!result.success) {
      throw new Error(`Auto-post failed: ${result.error}`);
    }

    logger.info(`Auto-post completed successfully for user ${userId}`);
  } catch (error) {
    logger.error("Error executing auto-post:", error);
    
    // Save error log
    await db.collection("auto_post_logs").add({
      userId,
      scheduledTime,
      executedAt: new Date().toISOString(),
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
      characterId: "",
      characterName: "",
      basePrompt: "",
      generatedPrompt: "",
      instagramAccountId: "",
      instagramAccountName: "",
      generatedImageUrl: "",
      caption: "",
      hashtags: "",
      instagramPostId: "",
    });

    throw error;
  }
}
