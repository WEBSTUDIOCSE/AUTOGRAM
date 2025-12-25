/**
 * Video Auto-Post Log Service (Module 8)
 * Manages video auto-post history in Firestore
 */

import { db } from '../firebase';
import { doc, collection, addDoc, query, where, getDocs, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import type { VideoAutoPostLog } from '../config/types';

const VIDEO_AUTO_POST_LOGS_COLLECTION = 'video_auto_post_logs';

export const VideoAutoPostLogService = {
  /**
   * Create a new log entry
   */
  createLog: async (log: Omit<VideoAutoPostLog, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, VIDEO_AUTO_POST_LOGS_COLLECTION), log);
    return docRef.id;
  },

  /**
   * Get logs for a user
   */
  getLogsByUserId: async (userId: string, limitCount: number = 50): Promise<VideoAutoPostLog[]> => {
    const q = query(
      collection(db, VIDEO_AUTO_POST_LOGS_COLLECTION),
      where('userId', '==', userId),
      orderBy('executedAt', 'desc'),
      firestoreLimit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as VideoAutoPostLog));
  },

  /**
   * Get logs by status
   */
  getLogsByStatus: async (userId: string, status: 'success' | 'failed' | 'skipped', limitCount: number = 20): Promise<VideoAutoPostLog[]> => {
    const q = query(
      collection(db, VIDEO_AUTO_POST_LOGS_COLLECTION),
      where('userId', '==', userId),
      where('status', '==', status),
      orderBy('executedAt', 'desc'),
      firestoreLimit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as VideoAutoPostLog));
  },

  /**
   * Get logs for a specific video prompt
   */
  getLogsByPrompt: async (videoPromptId: string, limitCount: number = 20): Promise<VideoAutoPostLog[]> => {
    const q = query(
      collection(db, VIDEO_AUTO_POST_LOGS_COLLECTION),
      where('videoPromptId', '==', videoPromptId),
      orderBy('executedAt', 'desc'),
      firestoreLimit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as VideoAutoPostLog));
  },
};
