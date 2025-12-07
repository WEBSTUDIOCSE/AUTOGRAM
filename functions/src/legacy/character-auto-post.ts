/**
 * LEGACY: Character Auto-Post (Module 3)
 * Kept for backward compatibility - Use unified scheduler instead
 * @deprecated Use scheduledUnifiedAutoPost from unified-index.ts
 */

import {onSchedule} from "firebase-functions/v2/scheduler";
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getFirestore} from "firebase-admin/firestore";

const db = getFirestore();
const AUTH_TOKEN = "autogram-auto-post-secret-2024";
const API_BASE_URL = "https://autogram-orpin.vercel.app";

export const scheduledAutoPost = onSchedule(
  {
    schedule: "0 * * * *",
    timeZone: "Asia/Kolkata",
  },
  async (event) => {
    logger.warn("⚠️ Using LEGACY scheduledAutoPost - Consider migrating to unified scheduler");
    
    try {
      const now = new Date();
      const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      const currentTime = `${istTime.getHours().toString().padStart(2, "0")}:${istTime.getMinutes().toString().padStart(2, "0")}`;

      const configsSnapshot = await db
        .collection("auto_post_configs")
        .where("isEnabled", "==", true)
        .get();

      if (configsSnapshot.empty) {
        logger.info("No enabled auto-post configs found");
        return;
      }

      const promises = configsSnapshot.docs.map(async (doc) => {
        const userId = doc.id;
        const config = doc.data();

        try {
          const charactersSnapshot = await db
            .collection("characters")
            .where("userId", "==", userId)
            .get();

          const hasMatchingCharacter = charactersSnapshot.docs.some((charDoc) => {
            const charData = charDoc.data();
            const isActive = config.activeCharacterIds?.includes(charDoc.id);
            const hasPostingTime = charData.postingTimes?.includes(currentTime);
            return isActive && hasPostingTime;
          });

          if (!hasMatchingCharacter) {
            return;
          }

          await executeAutoPost(userId, currentTime, config);
        } catch (error) {
          logger.error(`Failed to execute auto-post for user ${userId}:`, error);
        }
      });

      await Promise.all(promises);
    } catch (error) {
      logger.error("Error in scheduled auto-post:", error);
      throw error;
    }
  }
);

export const triggerAutoPost = onRequest(async (req, res) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      res.status(400).json({error: "Missing userId parameter"});
      return;
    }

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

async function executeAutoPost(userId: string, scheduledTime: string, config: any) {
  const apiUrl = `${API_BASE_URL}/api/auto-post`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        scheduledTime,
        authToken: AUTH_TOKEN,
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
  } catch (error) {
    logger.error("Error executing auto-post:", error);

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
