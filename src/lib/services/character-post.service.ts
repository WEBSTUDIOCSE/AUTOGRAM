import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { app } from '@/lib/firebase/firebase';
import type { CharacterPost } from '@/lib/firebase/config/types';

const db = getFirestore(app);

/**
 * Character Post Service
 * Handles character post history and tracking
 */
export const CharacterPostService = {
  /**
   * Save a character post to Firestore
   * @param postData - Character post data
   * @returns Post ID
   */
  async saveCharacterPost(postData: Omit<CharacterPost, 'id'>): Promise<string> {
    try {
      const postId = `post_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      const post: CharacterPost = {
        id: postId,
        ...postData,
      };
      
      await setDoc(doc(db, 'character_posts', postId), post);
      
      console.log('✅ Character post saved:', postId);
      return postId;
      
    } catch (error) {
      console.error('❌ Save character post error:', error);
      throw new Error('Failed to save character post');
    }
  },

  /**
   * Get recent character posts for a user
   * @param userId - User ID
   * @param limitCount - Number of posts to retrieve
   * @returns Array of character posts
   */
  async getRecentPosts(userId: string, limitCount: number = 10): Promise<CharacterPost[]> {
    try {
      const q = query(
        collection(db, 'character_posts'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      const posts: CharacterPost[] = [];
      
      snapshot.forEach((doc) => {
        posts.push(doc.data() as CharacterPost);
      });
      
      console.log(`✅ Retrieved ${posts.length} character posts`);
      return posts;
      
    } catch (error) {
      console.error('❌ Get character posts error:', error);
      throw new Error('Failed to retrieve character posts');
    }
  },

  /**
   * Get posts by character ID
   * @param characterId - Character ID
   * @param limitCount - Number of posts to retrieve
   * @returns Array of character posts
   */
  async getPostsByCharacter(
    characterId: string,
    limitCount: number = 10
  ): Promise<CharacterPost[]> {
    try {
      const q = query(
        collection(db, 'character_posts'),
        where('characterId', '==', characterId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      const posts: CharacterPost[] = [];
      
      snapshot.forEach((doc) => {
        posts.push(doc.data() as CharacterPost);
      });
      
      console.log(`✅ Retrieved ${posts.length} posts for character ${characterId}`);
      return posts;
      
    } catch (error) {
      console.error('❌ Get posts by character error:', error);
      throw new Error('Failed to retrieve character posts');
    }
  },

  /**
   * Get recent prompts for a user (for quick reuse)
   * @param userId - User ID
   * @returns Array of recent prompts with timestamps
   */
  async getRecentPrompts(
    userId: string
  ): Promise<Array<{ prompt: string; timestamp: string; characterName: string }>> {
    try {
      const posts = await this.getRecentPosts(userId, 10);
      
      // Extract unique prompts
      const uniquePrompts = new Map<string, { prompt: string; timestamp: string; characterName: string }>();
      
      posts.forEach((post) => {
        if (!uniquePrompts.has(post.prompt)) {
          uniquePrompts.set(post.prompt, {
            prompt: post.prompt,
            timestamp: this.getTimeAgo(post.timestamp),
            characterName: post.characterName,
          });
        }
      });
      
      return Array.from(uniquePrompts.values());
      
    } catch (error) {
      console.error('❌ Get recent prompts error:', error);
      return [];
    }
  },

  /**
   * Convert timestamp to relative time (e.g., "2m ago")
   */
  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  },
};
