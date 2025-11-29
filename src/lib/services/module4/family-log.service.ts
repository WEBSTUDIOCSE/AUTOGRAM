import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { FamilyAutoPostLog, FamilyPromptCategory } from '@/lib/firebase/config/types';

const COLLECTION_NAME = 'family_auto_post_logs';

/**
 * Service for managing family auto-post logs for Module 4
 */
export class FamilyLogService {
  /**
   * Get logs for a family profile
   */
  static async getProfileLogs(
    userId: string,
    familyProfileId: string,
    limitCount: number = 50
  ): Promise<FamilyAutoPostLog[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('familyProfileId', '==', familyProfileId),
        orderBy('executedAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          familyProfileId: data.familyProfileId,
          familyProfileName: data.familyProfileName,
          scheduleId: data.scheduleId,
          category: data.category,
          basePrompt: data.basePrompt,
          generatedPrompt: data.generatedPrompt,
          familyContext: data.familyContext,
          generatedImageUrl: data.generatedImageUrl,
          caption: data.caption,
          hashtags: data.hashtags,
          instagramPostId: data.instagramPostId,
          instagramAccountId: data.instagramAccountId,
          instagramAccountName: data.instagramAccountName,
          scheduledTime: data.scheduledTime,
          executedAt: data.executedAt instanceof Timestamp ? data.executedAt.toDate().toISOString() : data.executedAt,
          status: data.status,
          error: data.error,
        };
      });
    } catch (error) {
      console.error('Error getting profile logs:', error);
      throw new Error('Failed to get profile logs');
    }
  }

  /**
   * Get all logs for a user
   */
  static async getUserLogs(
    userId: string,
    limitCount: number = 50
  ): Promise<FamilyAutoPostLog[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('executedAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          familyProfileId: data.familyProfileId,
          familyProfileName: data.familyProfileName,
          scheduleId: data.scheduleId,
          category: data.category,
          basePrompt: data.basePrompt,
          generatedPrompt: data.generatedPrompt,
          familyContext: data.familyContext,
          generatedImageUrl: data.generatedImageUrl,
          caption: data.caption,
          hashtags: data.hashtags,
          instagramPostId: data.instagramPostId,
          instagramAccountId: data.instagramAccountId,
          instagramAccountName: data.instagramAccountName,
          scheduledTime: data.scheduledTime,
          executedAt: data.executedAt instanceof Timestamp ? data.executedAt.toDate().toISOString() : data.executedAt,
          status: data.status,
          error: data.error,
        };
      });
    } catch (error) {
      console.error('Error getting user logs:', error);
      throw new Error('Failed to get user logs');
    }
  }

  /**
   * Create a new log entry
   */
  static async createLog(logData: {
    userId: string;
    familyProfileId: string;
    familyProfileName: string;
    scheduleId: string;
    category: FamilyPromptCategory;
    basePrompt: string;
    generatedPrompt: string;
    familyContext: string;
    generatedImageUrl: string;
    caption: string;
    hashtags: string;
    instagramPostId?: string;
    instagramAccountId: string;
    instagramAccountName: string;
    scheduledTime: string;
    status: 'success' | 'failed' | 'skipped';
    error?: string;
  }): Promise<FamilyAutoPostLog> {
    try {
      const logRef = doc(collection(db, COLLECTION_NAME));

      const logDocument = {
        ...logData,
        executedAt: serverTimestamp(),
      };

      await setDoc(logRef, logDocument);

      return {
        id: logRef.id,
        ...logData,
        executedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating log:', error);
      throw new Error('Failed to create log');
    }
  }

  /**
   * Get success rate for a family profile
   */
  static async getSuccessRate(
    userId: string,
    familyProfileId: string,
    days: number = 30
  ): Promise<{ total: number; successful: number; failed: number; rate: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('familyProfileId', '==', familyProfileId),
        orderBy('executedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const logs = querySnapshot.docs
        .map((doc) => doc.data())
        .filter((data) => {
          const executedAt = data.executedAt instanceof Timestamp 
            ? data.executedAt.toDate() 
            : new Date(data.executedAt);
          return executedAt >= cutoffDate;
        });

      const total = logs.length;
      const successful = logs.filter((log) => log.status === 'success').length;
      const failed = logs.filter((log) => log.status === 'failed').length;
      const rate = total > 0 ? (successful / total) * 100 : 0;

      return { total, successful, failed, rate };
    } catch (error) {
      console.error('Error calculating success rate:', error);
      throw new Error('Failed to calculate success rate');
    }
  }

  /**
   * Get recent failed logs for debugging
   */
  static async getRecentFailures(
    userId: string,
    familyProfileId: string,
    limitCount: number = 10
  ): Promise<FamilyAutoPostLog[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('familyProfileId', '==', familyProfileId),
        where('status', '==', 'failed'),
        orderBy('executedAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          familyProfileId: data.familyProfileId,
          familyProfileName: data.familyProfileName,
          scheduleId: data.scheduleId,
          category: data.category,
          basePrompt: data.basePrompt,
          generatedPrompt: data.generatedPrompt,
          familyContext: data.familyContext,
          generatedImageUrl: data.generatedImageUrl,
          caption: data.caption,
          hashtags: data.hashtags,
          instagramPostId: data.instagramPostId,
          instagramAccountId: data.instagramAccountId,
          instagramAccountName: data.instagramAccountName,
          scheduledTime: data.scheduledTime,
          executedAt: data.executedAt instanceof Timestamp ? data.executedAt.toDate().toISOString() : data.executedAt,
          status: data.status,
          error: data.error,
        };
      });
    } catch (error) {
      console.error('Error getting recent failures:', error);
      throw new Error('Failed to get recent failures');
    }
  }
}
