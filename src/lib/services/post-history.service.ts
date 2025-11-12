import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { app } from '@/lib/firebase/firebase';

const db = getFirestore(app);

/**
 * Post History Record
 */
export interface PostHistory {
  id?: string;
  userId: string;
  prompt: string;
  caption: string;
  hashtags: string;
  imageUrl: string;
  instagramPostId: string;
  instagramAccountId: string;
  createdAt: Timestamp;
  model: string;
}

/**
 * Post History Service
 * Manages Instagram post history in Firestore
 */
export const PostHistoryService = {
  /**
   * Save a post to history
   */
  async savePost(data: Omit<PostHistory, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'post_history'), {
        ...data,
        createdAt: Timestamp.now()
      });
      
      console.log('✅ Post saved to history:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Failed to save post history:', error);
      throw error;
    }
  },

  /**
   * Get user's post history
   */
  async getUserPosts(userId: string, limitCount: number = 20): Promise<PostHistory[]> {
    try {
      const q = query(
        collection(db, 'post_history'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const posts: PostHistory[] = [];

      querySnapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data()
        } as PostHistory);
      });

      return posts;
    } catch (error) {
      console.error('❌ Failed to fetch post history:', error);
      throw error;
    }
  },

  /**
   * Get recent posts (for the RecentPrompts dropdown)
   */
  async getRecentPrompts(userId: string, limitCount: number = 5): Promise<string[]> {
    try {
      const posts = await this.getUserPosts(userId, limitCount);
      return posts.map(post => post.prompt);
    } catch (error) {
      console.error('❌ Failed to fetch recent prompts:', error);
      return [];
    }
  }
};
