/**
 * Module 9: Motivational Quote Auto-Post Log Service
 */

import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp, updateDoc, doc } from 'firebase/firestore';

export interface MotivationalAutoPostLog {
  id: string;
  userId: string;
  promptId: string;
  category: string;
  quoteText: string;
  author?: string;
  contentType: 'image' | 'video';
  generatedPrompt: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption: string;
  hashtags: string;
  instagramAccountId: string;
  instagramAccountName?: string;
  instagramPostId?: string;
  status: 'success' | 'failed' | 'media_generated' | 'instagram_failed' | 'skipped';
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
   * Get recent prompts (for variation)
   */
  async getRecentPrompts(userId: string, count: number = 10): Promise<string[]> {
    try {
      const q = query(
        collection(db, 'motivational_auto_post_logs'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(count)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data().generatedPrompt);
    } catch (error) {
      console.error('Error getting recent prompts:', error);
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
