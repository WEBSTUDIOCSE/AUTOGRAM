import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { AutoPostLog } from '@/lib/firebase/config/types';

const COLLECTION_NAME = 'auto_post_logs';

// Re-export AutoPostLog for components
export type { AutoPostLog };

/**
 * Service for managing auto-post logs for Module 3
 */
export class AutoPostLogService {
  /**
   * Save a new auto-post log
   */
  static async saveLog(logData: Omit<AutoPostLog, 'id' | 'executedAt'>): Promise<AutoPostLog> {
    try {
      const logsRef = collection(db, COLLECTION_NAME);
      
      const docData = {
        ...logData,
        executedAt: serverTimestamp(),
      };

      const docRef = await addDoc(logsRef, docData);

      return {
        id: docRef.id,
        ...logData,
        executedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error('Failed to save auto-post log');
    }
  }

  /**
   * Get user's auto-post logs
   */
  static async getUserLogs(
    userId: string,
    limitCount: number = 50
  ): Promise<AutoPostLog[]> {
    try {
      const logsRef = collection(db, COLLECTION_NAME);
      const q = query(
        logsRef,
        where('userId', '==', userId),
        orderBy('executedAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          characterId: data.characterId,
          characterName: data.characterName,
          promptTemplateId: data.promptTemplateId,
          basePrompt: data.basePrompt,
          generatedPrompt: data.generatedPrompt,
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
      throw new Error('Failed to get auto-post logs');
    }
  }

  /**
   * Get successful posts only
   */
  static async getSuccessfulPosts(
    userId: string,
    limitCount: number = 20
  ): Promise<AutoPostLog[]> {
    try {
      const logsRef = collection(db, COLLECTION_NAME);
      const q = query(
        logsRef,
        where('userId', '==', userId),
        where('status', '==', 'success'),
        orderBy('executedAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          characterId: data.characterId,
          characterName: data.characterName,
          promptTemplateId: data.promptTemplateId,
          basePrompt: data.basePrompt,
          generatedPrompt: data.generatedPrompt,
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
      throw new Error('Failed to get successful posts');
    }
  }

  /**
   * Get failed posts only
   */
  static async getFailedPosts(
    userId: string,
    limitCount: number = 20
  ): Promise<AutoPostLog[]> {
    try {
      const logsRef = collection(db, COLLECTION_NAME);
      const q = query(
        logsRef,
        where('userId', '==', userId),
        where('status', '==', 'failed'),
        orderBy('executedAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          characterId: data.characterId,
          characterName: data.characterName,
          promptTemplateId: data.promptTemplateId,
          basePrompt: data.basePrompt,
          generatedPrompt: data.generatedPrompt,
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
      throw new Error('Failed to get failed posts');
    }
  }

  /**
   * Get logs for a specific character
   */
  static async getCharacterLogs(
    userId: string,
    characterId: string,
    limitCount: number = 20
  ): Promise<AutoPostLog[]> {
    try {
      const logsRef = collection(db, COLLECTION_NAME);
      const q = query(
        logsRef,
        where('userId', '==', userId),
        where('characterId', '==', characterId),
        orderBy('executedAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          characterId: data.characterId,
          characterName: data.characterName,
          promptTemplateId: data.promptTemplateId,
          basePrompt: data.basePrompt,
          generatedPrompt: data.generatedPrompt,
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
      throw new Error('Failed to get character logs');
    }
  }

  /**
   * Get statistics for a user's auto-posting
   */
  static async getStatistics(userId: string): Promise<{
    total: number;
    successful: number;
    failed: number;
    skipped: number;
    successRate: number;
  }> {
    try {
      const logs = await this.getUserLogs(userId, 1000);
      
      const total = logs.length;
      const successful = logs.filter((log) => log.status === 'success').length;
      const failed = logs.filter((log) => log.status === 'failed').length;
      const skipped = logs.filter((log) => log.status === 'skipped').length;
      const successRate = total > 0 ? (successful / total) * 100 : 0;

      return {
        total,
        successful,
        failed,
        skipped,
        successRate: Math.round(successRate * 10) / 10,
      };
    } catch (error) {
      throw new Error('Failed to get statistics');
    }
  }
}
