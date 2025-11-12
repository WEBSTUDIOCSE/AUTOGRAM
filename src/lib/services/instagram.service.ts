import { getInstagramConfig } from '@/lib/firebase/config/environments';

const INSTAGRAM_API_URL = 'https://graph.facebook.com/v18.0';

/**
 * Instagram Account Info
 */
export interface InstagramAccount {
  id: string;
  username: string;
  profile_picture_url?: string;
}

/**
 * Instagram Post Response
 */
export interface InstagramPostResponse {
  id: string;
}

/**
 * Instagram Service
 * Handles Instagram Graph API interactions
 */
export const InstagramService = {
  /**
   * Test Instagram connection
   * @returns Instagram account info
   */
  testConnection: async (): Promise<InstagramAccount> => {
    const config = getInstagramConfig();
    
    try {
      const response = await fetch(
        `${INSTAGRAM_API_URL}/${config.accountId}?fields=id,username,profile_picture_url&access_token=${config.accessToken}`
      );
      
      const data = await response.json();
      
      if (data.error) {
        console.error('❌ Instagram API Error:', data.error);
        throw new Error(data.error.message);
      }
      
      console.log('✅ Instagram Connected:', data);
      return data;
    } catch (error) {
      console.error('Failed to connect to Instagram:', error);
      throw error;
    }
  },

  /**
   * Create an Instagram container (step 1 of posting)
   * @param imageUrl - Public URL of the image
   * @param caption - Post caption with hashtags
   * @returns Container ID
   */
  createContainer: async (imageUrl: string, caption: string): Promise<string> => {
    const config = getInstagramConfig();
    
    const params = new URLSearchParams({
      image_url: imageUrl,
      caption: caption,
      access_token: config.accessToken
    });

    try {
      const response = await fetch(
        `${INSTAGRAM_API_URL}/${config.accountId}/media`,
        {
          method: 'POST',
          body: params
        }
      );
      
      const data = await response.json();
      
      if (data.error) {
        console.error('❌ Failed to create container:', data.error);
        throw new Error(data.error.message);
      }
      
      console.log('✅ Container created:', data.id);
      return data.id;
    } catch (error) {
      console.error('Failed to create Instagram container:', error);
      throw error;
    }
  },

  /**
   * Publish the Instagram container (step 2 of posting)
   * @param containerId - Container ID from createContainer
   * @returns Post ID
   */
  publishContainer: async (containerId: string): Promise<string> => {
    const config = getInstagramConfig();
    
    const params = new URLSearchParams({
      creation_id: containerId,
      access_token: config.accessToken
    });

    try {
      const response = await fetch(
        `${INSTAGRAM_API_URL}/${config.accountId}/media_publish`,
        {
          method: 'POST',
          body: params
        }
      );
      
      const data = await response.json();
      
      if (data.error) {
        console.error('❌ Failed to publish post:', data.error);
        throw new Error(data.error.message);
      }
      
      console.log('✅ Post published:', data.id);
      return data.id;
    } catch (error) {
      console.error('Failed to publish Instagram post:', error);
      throw error;
    }
  },

  /**
   * Complete workflow: Upload image and post to Instagram
   * @param imageUrl - Public URL of the image (must be publicly accessible)
   * @param caption - Post caption with hashtags
   * @returns Post ID
   */
  postImage: async (imageUrl: string, caption: string): Promise<string> => {
    console.log('📸 Starting Instagram post workflow...');
    
    // Step 1: Create container
    const containerId = await InstagramService.createContainer(imageUrl, caption);
    
    // Step 2: Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Publish the post
    const postId = await InstagramService.publishContainer(containerId);
    
    console.log('🎉 Instagram post successful!');
    return postId;
  },

  /**
   * Get Instagram account info
   * @returns Account details
   */
  getAccountInfo: async (): Promise<InstagramAccount> => {
    return InstagramService.testConnection();
  }
};
