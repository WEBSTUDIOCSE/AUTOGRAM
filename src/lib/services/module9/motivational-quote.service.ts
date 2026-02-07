/**
 * Module 9: Motivational Quotes Service
 * Handles CRUD operations for generated motivational quotes
 */

import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, orderBy, limit, Timestamp, getDoc } from 'firebase/firestore';

export interface MotivationalQuote {
  id: string;
  userId: string;
  quoteText: string;
  author?: string;
  category: string;
  contentType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  prompt: string;
  style?: string;
  backgroundColor?: string;
  textColor?: string;
  fontStyle?: string;
  instagramPostId?: string;
  instagramAccountId?: string;
  postedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const MotivationalQuoteService = {
  /**
   * Create a new motivational quote
   */
  async createQuote(data: Omit<MotivationalQuote, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const quoteData = {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'motivational_quotes'), quoteData);
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all motivational quotes for a user
   */
  async getUserQuotes(userId: string, limitCount?: number): Promise<MotivationalQuote[]> {
    try {
      let q = query(
        collection(db, 'motivational_quotes'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MotivationalQuote));
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get quotes by category
   */
  async getQuotesByCategory(userId: string, category: string): Promise<MotivationalQuote[]> {
    try {
      const q = query(
        collection(db, 'motivational_quotes'),
        where('userId', '==', userId),
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MotivationalQuote));
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get a single quote by ID
   */
  async getQuoteById(quoteId: string): Promise<MotivationalQuote | null> {
    try {
      const docRef = doc(db, 'motivational_quotes', quoteId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as MotivationalQuote;
      }

      return null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a motivational quote
   */
  async updateQuote(quoteId: string, data: Partial<MotivationalQuote>): Promise<void> {
    try {
      const docRef = doc(db, 'motivational_quotes', quoteId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a motivational quote
   */
  async deleteQuote(quoteId: string): Promise<void> {
    try {
      const docRef = doc(db, 'motivational_quotes', quoteId);
      await deleteDoc(docRef);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get posted quotes (with Instagram post ID)
   */
  async getPostedQuotes(userId: string): Promise<MotivationalQuote[]> {
    try {
      const q = query(
        collection(db, 'motivational_quotes'),
        where('userId', '==', userId),
        where('instagramPostId', '!=', null),
        orderBy('instagramPostId'),
        orderBy('postedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MotivationalQuote));
    } catch (error) {
      throw error;
    }
  },
};
