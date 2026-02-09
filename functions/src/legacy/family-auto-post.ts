/**
 * LEGACY: Family Auto-Post (Module 4)
 * Kept for backward compatibility - Use unified scheduler instead
 * @deprecated Use scheduledUnifiedAutoPost from unified-index.ts
 */

import {onSchedule} from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import {getFirestore} from "firebase-admin/firestore";

const db = getFirestore();
const AUTH_TOKEN = "autogram-auto-post-secret-2024";
const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
const IS_PROD = projectId === "autogram-14ddc";
const API_BASE_URL = IS_PROD 
  ? "https://www.autograminsta.online" 
  : "https://autogram-orpin.vercel.app";

export const scheduledFamilyAutoPost = onSchedule(
  {
    schedule: "0 * * * *",
    timeZone: "Asia/Kolkata",
  },
  async (event) => {
    logger.warn("⚠️ Using LEGACY scheduledFamilyAutoPost - Consider migrating to unified scheduler");

    try {
      const now = new Date();
      const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      const currentTime = `${istTime.getHours().toString().padStart(2, "0")}:${istTime.getMinutes().toString().padStart(2, "0")}`;

      const profilesSnapshot = await db
        .collection("family_profiles")
        .where("isActive", "==", true)
        .get();

      if (profilesSnapshot.empty) {
        logger.info("No active family profiles found");
        return;
      }

      const promises = profilesSnapshot.docs.map(async (doc) => {
        const profileId = doc.id;
        const profile = doc.data();
        const userId = profile.userId;

        try {
          const hasMatchingTime = profile.postingTimes?.includes(currentTime);

          if (!hasMatchingTime) {
            return;
          }

          await executeFamilyAutoPost(userId, profileId, currentTime);
        } catch (error) {
          logger.error(`Failed to execute family auto-post for profile ${profileId}:`, error);
        }
      });

      await Promise.all(promises);
    } catch (error) {
      logger.error("Error in scheduled family auto-post:", error);
      throw error;
    }
  }
);

async function executeFamilyAutoPost(userId: string, profileId: string, scheduledTime: string) {
  const apiUrl = `${API_BASE_URL}/api/family-auto-post`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 540000);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          profileId,
          scheduledTime,
          authToken: AUTH_TOKEN,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(`Family auto-post failed: ${result.error}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    logger.error("Error executing family auto-post:", error);

    await db.collection("family_auto_post_logs").add({
      userId,
      familyProfileId: profileId,
      familyProfileName: "",
      scheduledTime,
      executedAt: new Date().toISOString(),
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
      generatedPrompt: "",
      generatedImageUrl: "",
      caption: "",
      hashtags: "",
      instagramPostId: "",
      instagramAccountId: "",
    });

    throw error;
  }
}
