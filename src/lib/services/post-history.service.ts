import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { app } from '@/lib/firebase/firebase';

const db = getFirestore(app);

/**
 * Instagram Post Record
 */
export interface InstagramPost {
  id?: string;
  userId: string;
  imageId: string; // Reference to generated_images
  prompt: string;
  caption: string;
  hashtags: string;
  imageUrl: string;
  instagramPostId: string;
  instagramAccountId: string;
  model: string;
  status: 'posted' | 'failed';
  error?: string;
  postedAt: Timestamp;
  createdAt: Timestamp;
}

/**
 * Instagram Post Service
 * Manages Instagram post history in Firestore
 */
export const InstagramPostService = {
  /**
   * Save a successful Instagram post
   */
  async savePost(data: {
    userId: string;
    imageId: string;
    prompt: string;
    caption: string;
    hashtags: string;
    imageUrl: string;
    instagramPostId: string;
    instagramAccountId: string;
    model: string;
  }): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'instagram_posts'), {
        ...data,
        status: 'posted',
        postedAt: Timestamp.now(),
        createdAt: Timestamp.now()
      });
      
      console.log('✅ Instagram post saved to history:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Failed to save Instagram post:', error);
      throw error;
    }
  },

  /**
   * Save a failed Instagram post
   */
  async saveFailedPost(data: {
    userId: string;
    imageId: string;
    prompt: string;
    caption: string;
    hashtags: string;
    imageUrl: string;
    instagramAccountId: string;
    model: string;
    error: string;
  }): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'instagram_posts'), {
        ...data,
        status: 'failed',
        createdAt: Timestamp.now()
      });
      
      console.log('⚠️ Failed Instagram post saved:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Failed to save failed post:', error);
      throw error;
    }
  },

  /**
   * Get user's Instagram posts
   */
  async getUserPosts(userId: string, limitCount: number = 20): Promise<InstagramPost[]> {
    try {
      const q = query(
        collection(db, 'instagram_posts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const posts: InstagramPost[] = [];

      querySnapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data()
        } as InstagramPost);
      });

      return posts;
    } catch (error) {
      console.error('❌ Failed to fetch Instagram posts:', error);
      return [];
    }
  },

  /**
   * Get post by ID
   */
  async getPost(postId: string): Promise<InstagramPost | null> {
    try {
      const docRef = doc(db, 'instagram_posts', postId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as InstagramPost;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to get post:', error);
      throw error;
    }
  },

  /**
   * Get recent prompts (for the RecentPrompts dropdown)
   */
  async getRecentPrompts(userId: string, limitCount: number = 5): Promise<string[]> {
    try {
      const posts = await this.getUserPosts(userId, limitCount);
      return posts.map(post => post.prompt).filter((v, i, a) => a.indexOf(v) === i); // Unique prompts
    } catch (error) {
      console.error('❌ Failed to fetch recent prompts:', error);
      return [];
    }
  },

  /**
   * Get successful posts count
   */
  async getSuccessfulPostsCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'instagram_posts'),
        where('userId', '==', userId),
        where('status', '==', 'posted')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('❌ Failed to count posts:', error);
      return 0;
    }
  }
};
