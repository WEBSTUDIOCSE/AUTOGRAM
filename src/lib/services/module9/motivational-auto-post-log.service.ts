/**
 * Module 9: Motivational Quote Auto-Post Log Service
 */

import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp, updateDoc, doc } from 'firebase/firestore';

export interface MotivationalAutoPostLog {
  id: string;
  userId: string;
  accountId: string;
  category: string;
  style: string;
  contentType: 'image' | 'video';
  quoteText: string;
  author?: string;
  generatedPrompt: string;
  mediaUrl: string;
  caption: string;
  instagramPostId?: string;
  instagramAccountName?: string;
  status: 'success' | 'failed' | 'processing' | 'instagram_failed';
  error?: string;
  timestamp: Timestamp;
}

export const MotivationalAutoPostLogService = {
  /**
   * Create a new log entry
   */
  async createLog(data: Omit<MotivationalAutoPostLog, 'id' | 'timestamp'>): Promise<string> {
    try {
      const logData = {
        ...data,
        timestamp: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'motivational_auto_post_logs'), logData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating motivational auto-post log:', error);
      throw error;
    }
  },

  /**
   * Get logs for a user
   */
  async getUserLogs(userId: string, limitCount: number = 50): Promise<MotivationalAutoPostLog[]> {
    try {
      const q = query(
        collection(db, 'motivational_auto_post_logs'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MotivationalAutoPostLog));
    } catch (error) {
      console.error('Error getting user logs:', error);
      throw error;
    }
  },

  /**
   * Get recent logs for an account (for variation)
   */
  async getRecentLogs(userId: string, accountId?: string, count: number = 10): Promise<string[]> {
    try {
      let q;
      if (accountId) {
        q = query(
          collection(db, 'motivational_auto_post_logs'),
          where('userId', '==', userId),
          where('accountId', '==', accountId),
          orderBy('timestamp', 'desc'),
          limit(count)
        );
      } else {
        // Get all logs for user if no accountId specified
        q = query(
          collection(db, 'motivational_auto_post_logs'),
          where('userId', '==', userId),
          orderBy('timestamp', 'desc'),
          limit(count)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => doc.data().quoteText)
        .filter((text): text is string => typeof text === 'string' && !!text);
    } catch (error) {
      console.error('Error getting recent logs:', error);
      return [];
    }
  },

  /**
   * Update log status
   */
  async updateLog(logId: string, data: Partial<MotivationalAutoPostLog>): Promise<void> {
    try {
      const docRef = doc(db, 'motivational_auto_post_logs', logId);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('Error updating motivational auto-post log:', error);
      throw error;
    }
  },
};
