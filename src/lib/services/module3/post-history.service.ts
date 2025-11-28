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
import { ModuleType } from '@/lib/firebase/config/types';

const db = getFirestore(app);

/**
 * Helper function to format time ago
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

/**
 * Instagram Post Record with module type
 */
export interface InstagramPost {
  id?: string;
  userId: string;
  moduleType: ModuleType;
  imageId: string; // Reference to generated_images
  prompt: string;
  caption: string;
  hashtags: string;
  imageUrl: string;
  instagramPostId: string;
  instagramAccountId: string;
  instagramAccountName: string;
  model: string;
  status: 'posted' | 'failed';
  error?: string;
  postedAt: Timestamp;
  createdAt: Timestamp;
}

/**
 * Instagram Post Service
 * Manages Instagram post history in Firestore with module tracking
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
    instagramAccountName?: string;
    model: string;
    moduleType?: ModuleType;
  }): Promise<string> {
    try {
      const moduleType = data.moduleType || 'module1';
      
      const docRef = await addDoc(collection(db, 'instagram_posts'), {
        ...data,
        moduleType,
        instagramAccountName: data.instagramAccountName || 'Instagram Account',
        status: 'posted',
        postedAt: Timestamp.now(),
        createdAt: Timestamp.now()
      });
      
      console.log(`✅ Instagram post saved to history (${moduleType}):`, docRef.id);
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
    instagramAccountName?: string;
    model: string;
    error: string;
    moduleType?: ModuleType;
  }): Promise<string> {
    try {
      const moduleType = data.moduleType || 'module1';
      
      const docRef = await addDoc(collection(db, 'instagram_posts'), {
        ...data,
        moduleType,
        instagramAccountName: data.instagramAccountName || 'Instagram Account',
        status: 'failed',
        createdAt: Timestamp.now()
      });
      
      console.log(`⚠️ Failed Instagram post saved (${moduleType}):`, docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Failed to save failed post:', error);
      throw error;
    }
  },

  /**
   * Get user's Instagram posts with optional module filter
   */
  async getUserPosts(
    userId: string, 
    limitCount: number = 20,
    moduleType?: ModuleType
  ): Promise<InstagramPost[]> {
    try {
      let q;
      
      if (moduleType) {
        q = query(
          collection(db, 'instagram_posts'),
          where('userId', '==', userId),
          where('moduleType', '==', moduleType),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      } else {
        q = query(
          collection(db, 'instagram_posts'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

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
   * Get recent prompts used (for dropdown suggestions) with optional module filter
   */
  async getRecentPrompts(
    userId: string, 
    limitCount: number = 5,
    moduleType?: ModuleType
  ): Promise<{ prompt: string; timestamp: string }[]> {
    try {
      const posts = await this.getUserPosts(userId, limitCount, moduleType);
      
      // Get unique prompts with timestamps
      const seenPrompts = new Set<string>();
      const uniquePrompts: { prompt: string; timestamp: string }[] = [];
      
      for (const post of posts) {
        if (!seenPrompts.has(post.prompt)) {
          seenPrompts.add(post.prompt);
          
          // Format timestamp
          const date = post.createdAt instanceof Timestamp 
            ? post.createdAt.toDate() 
            : new Date(post.createdAt);
          
          const timeAgo = getTimeAgo(date);
          
          uniquePrompts.push({
            prompt: post.prompt,
            timestamp: timeAgo
          });
        }
      }
      
      return uniquePrompts;
    } catch (error) {
      console.error('❌ Failed to fetch recent prompts:', error);
      return [];
    }
  },

  /**
   * Get successful posts count with optional module filter
   */
  async getSuccessfulPostsCount(userId: string, moduleType?: ModuleType): Promise<number> {
    try {
      let q;
      
      if (moduleType) {
        q = query(
          collection(db, 'instagram_posts'),
          where('userId', '==', userId),
          where('moduleType', '==', moduleType),
          where('status', '==', 'posted')
        );
      } else {
        q = query(
          collection(db, 'instagram_posts'),
          where('userId', '==', userId),
          where('status', '==', 'posted')
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('❌ Failed to count posts:', error);
      return 0;
    }
  }
};
