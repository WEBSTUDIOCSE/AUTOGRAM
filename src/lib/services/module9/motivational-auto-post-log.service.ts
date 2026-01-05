/**
 * Module 9: Motivational Quote Auto-Post Log Service
 */

import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp, updateDoc, doc } from 'firebase/firestore';

export interface MotivationalAutoPostLog {
  id: string;
  userId: string;
  accountId: string;
  category: string; // Always saved: success, mindset, motivation, inspiration, life, wisdom
  style: string;
  contentType: 'image' | 'video'; // Always saved: image or video type
  language?: string; // Language of the quote (english, hindi, marathi)
  quoteText: string;
  author: string; // Always saved: author name or empty string if none
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
        author: data.author || '', // Ensure author is always a string (empty if not provided)
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
          where('status', '==', 'success'), // ✅ Only fetch successfully posted quotes
          orderBy('timestamp', 'desc'),
          limit(count)
        );
      } else {
        // Get all logs for user if no accountId specified
        q = query(
          collection(db, 'motivational_auto_post_logs'),
          where('userId', '==', userId),
          where('status', '==', 'success'), // ✅ Only fetch successfully posted quotes
          orderBy('timestamp', 'desc'),
          limit(count)
        );
      }

      const snapshot = await getDocs(q);
      const quotes = snapshot.docs
        .map(doc => doc.data().quoteText)
        .filter((text): text is string => typeof text === 'string' && !!text);
      
      // Log for debugging duplicate issues
      console.log(`📊 [Module 9 Log] Retrieved ${quotes.length} recent SUCCESSFUL quotes for deduplication check`);
      if (quotes.length > 0) {
        console.log(`   Last 3 quotes: ${quotes.slice(0, 3).map(q => `"${q.substring(0, 40)}..."`).join(', ')}`);
      }
      
      return quotes;
    } catch (error) {
      console.error('Error getting recent logs:', error);
      return [];
    }
  },

  /**
   * Check if a quote text already exists in recent logs (exact match)
   */
  async isQuoteDuplicate(userId: string, quoteText: string, accountId?: string, daysToCheck: number = 30): Promise<boolean> {
    try {
      // Calculate timestamp for X days ago
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - daysToCheck);
      const timestampLimit = Timestamp.fromDate(daysAgo);

      // Normalize quote text for comparison (remove extra spaces, lowercase)
      const normalizedQuote = quoteText.toLowerCase().trim().replace(/\s+/g, ' ');

      let q;
      if (accountId) {
        q = query(
          collection(db, 'motivational_auto_post_logs'),
          where('userId', '==', userId),
          where('accountId', '==', accountId),
          where('timestamp', '>=', timestampLimit),
          orderBy('timestamp', 'desc')
        );
      } else {
        q = query(
          collection(db, 'motivational_auto_post_logs'),
          where('userId', '==', userId),
          where('timestamp', '>=', timestampLimit),
          orderBy('timestamp', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      
      // Check for exact match (normalized)
      for (const doc of snapshot.docs) {
        const existingQuote = doc.data().quoteText;
        if (existingQuote) {
          const normalizedExisting = existingQuote.toLowerCase().trim().replace(/\s+/g, ' ');
          if (normalizedExisting === normalizedQuote) {
            console.warn(`⚠️ [Module 9 Log] Duplicate quote detected: "${quoteText.substring(0, 60)}..."`);
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking quote duplicate:', error);
      return false; // On error, allow posting (better than blocking)
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
