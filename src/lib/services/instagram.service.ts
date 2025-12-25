import { getInstagramConfig } from '@/lib/firebase/config/environments';
import type { InstagramAccount } from '@/lib/firebase/config/types';

const INSTAGRAM_API_URL = 'https://graph.facebook.com/v18.0';

// Re-export InstagramAccount for components
export type { InstagramAccount };

/**
 * Instagram Post Response
 */
export interface InstagramPostResponse {
  id: string;
}

/**
 * Instagram Service
 * Handles Instagram Graph API interactions with multi-account support
 */
export const InstagramService = {
  /**
   * Get all available Instagram accounts
   * @returns Array of Instagram accounts
   */
  getAccounts: (): InstagramAccount[] => {
    const config = getInstagramConfig();
    return config.accounts.filter(account => account.isActive);
  },

  /**
   * Get account by ID
   * @param accountId - Instagram account ID (accountId field) or internal id
   * @returns Instagram account or null
   */
  getAccountById: (accountId: string): InstagramAccount | null => {
    console.log('[InstagramService] getAccountById called with:', accountId);
    
    const accounts = InstagramService.getAccounts();
    console.log('[InstagramService] Available accounts:', accounts.map(a => ({
      id: a.id,
      accountId: a.accountId,
      name: a.name,
      isActive: a.isActive
    })));
    
    // Look up by accountId field (Instagram's ID) OR by internal id (for backwards compatibility)
    const found = accounts.find(account => 
      account.accountId === accountId || account.id === accountId
    );
    console.log('[InstagramService] Account found:', found ? {
      id: found.id,
      accountId: found.accountId,
      name: found.name
    } : 'null');
    
    return found || null;
  },

  /**
   * Test Instagram connection for specific account
   * @param accountId - Instagram account ID to test
   * @returns Instagram account info
   */
  testConnection: async (accountId: string): Promise<InstagramAccount> => {
    const account = InstagramService.getAccountById(accountId);
    
    if (!account) {
      throw new Error(`Instagram account ${accountId} not found`);
    }
    
    try {
      const response = await fetch(
        `${INSTAGRAM_API_URL}/${account.accountId}?fields=id,username,profile_picture_url&access_token=${account.accessToken}`
      );
      
      const data = await response.json();
      
      if (data.error) {
        console.error('❌ Instagram API Error:', data.error);
        throw new Error(data.error.message);
      }
      
      console.log('✅ Instagram Connected:', data);
      return {
        ...account,
        username: data.username,
        profilePictureUrl: data.profile_picture_url
      };
    } catch (error) {
      console.error('Failed to connect to Instagram:', error);
      throw error;
    }
  },

  /**
   * Create an Instagram container (step 1 of posting)
   * @param imageUrl - Public URL of the image or video
   * @param caption - Post caption with hashtags
   * @param accountId - Instagram account ID to post to
   * @param isVideo - Whether the media is a video (default: false)
   * @returns Container ID
   */
  createContainer: async (imageUrl: string, caption: string, accountId: string, isVideo: boolean = false): Promise<string> => {
    const account = InstagramService.getAccountById(accountId);
    
    if (!account) {
      throw new Error(`Instagram account ${accountId} not found`);
    }
    
    const params = new URLSearchParams({
      caption: caption,
      access_token: account.accessToken
    });

    // Use video_url for videos, image_url for images
    if (isVideo) {
      params.append('video_url', imageUrl);
      params.append('media_type', 'REELS'); // Use REELS instead of VIDEO (VIDEO is deprecated)
    } else {
      params.append('image_url', imageUrl);
    }

    try {
      console.log(`📦 Creating container with ${isVideo ? 'video' : 'image'} URL:`, imageUrl);
      console.log(`📦 Media type: ${isVideo ? 'REELS' : 'IMAGE'}`);
      
      const response = await fetch(
        `${INSTAGRAM_API_URL}/${account.accountId}/media`,
        {
          method: 'POST',
          body: params
        }
      );
      
      const data = await response.json();
      
      if (data.error) {
        console.error('❌ Failed to create container:', data.error);
        throw new Error(JSON.stringify(data.error));
      }
      
      console.log(`✅ Container created for ${account.name}:`, data.id);
      return data.id;
    } catch (error) {
      console.error('Failed to create Instagram container:', error);
      throw error;
    }
  },

  /**
   * Check container status
   * @param containerId - Container ID from createContainer
   * @param accountId - Instagram account ID
   * @returns Container status data
   */
  checkContainerStatus: async (containerId: string, accountId: string): Promise<{ id: string; status_code: string }> => {
    const account = InstagramService.getAccountById(accountId);
    
    if (!account) {
      throw new Error(`Instagram account ${accountId} not found`);
    }

    try {
      const response = await fetch(
        `${INSTAGRAM_API_URL}/${containerId}?fields=id,status_code&access_token=${account.accessToken}`
      );
      
      const data = await response.json();
      
      if (data.error) {
        console.error('❌ Failed to check container status:', data.error);
        throw new Error(data.error.message);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to check container status:', error);
      throw error;
    }
  },

  /**
   * Publish the Instagram container (step 2 of posting)
   * @param containerId - Container ID from createContainer
   * @param accountId - Instagram account ID
   * @returns Post ID
   */
  publishContainer: async (containerId: string, accountId: string): Promise<string> => {
    const account = InstagramService.getAccountById(accountId);
    
    if (!account) {
      throw new Error(`Instagram account ${accountId} not found`);
    }
    
    const params = new URLSearchParams({
      creation_id: containerId,
      access_token: account.accessToken
    });

    try {
      const response = await fetch(
        `${INSTAGRAM_API_URL}/${account.accountId}/media_publish`,
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
      
      console.log(`✅ Post published on ${account.name}:`, data.id);
      return data.id;
    } catch (error) {
      console.error('Failed to publish Instagram post:', error);
      throw error;
    }
  },

  /**
   * Complete workflow: Upload image/video and post to Instagram
   * @param imageUrl - Public URL of the image or video (must be publicly accessible)
   * @param caption - Post caption with hashtags
   * @param accountId - Instagram account ID to post to
   * @param isVideo - Whether the media is a video (default: false)
   * @returns Post ID
   */
  postImage: async (imageUrl: string, caption: string, accountId: string = 'account1', isVideo: boolean = false): Promise<string> => {
    console.log(`📸 Starting Instagram post workflow for account: ${accountId}...`);
    console.log(`📦 Media type: ${isVideo ? 'REELS' : 'IMAGE'}`);
    
    // Step 1: Create container
    const containerId = await InstagramService.createContainer(imageUrl, caption, accountId, isVideo);
    
    // Step 2: Wait for container to be ready (especially important for REELS/videos)
    if (isVideo) {
      console.log('⏳ Waiting for REELS video to be processed by Instagram...');
      const maxAttempts = 60; // 60 attempts × 5 seconds = 5 minutes max
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between checks
        attempts++;
        
        try {
          const status = await InstagramService.checkContainerStatus(containerId, accountId);
          console.log(`📊 Container status (attempt ${attempts}/${maxAttempts}):`, status.status_code);
          
          if (status.status_code === 'FINISHED') {
            console.log('✅ Container is ready for publishing!');
            break;
          } else if (status.status_code === 'ERROR') {
            throw new Error('Container processing failed on Instagram');
          }
          // Continue polling if status is IN_PROGRESS or other intermediate states
        } catch (error) {
          console.error('Error checking container status:', error);
          // Continue polling even on error, might be temporary
        }
      }
      
      if (attempts >= maxAttempts) {
        throw new Error('Container processing timeout - Instagram took too long to process the video');
      }
    } else {
      // For images, just wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Step 3: Publish the post
    const postId = await InstagramService.publishContainer(containerId, accountId);
    
    console.log('🎉 Instagram post successful!');
    return postId;
  },

  /**
   * Get Instagram account info
   * @param accountId - Instagram account ID
   * @returns Account details
   */
  getAccountInfo: async (accountId: string): Promise<InstagramAccount> => {
    return InstagramService.testConnection(accountId);
  },

  /**
   * Fetch usernames for all available accounts
   * @returns Array of Instagram accounts with usernames populated
   */
  fetchAccountsWithUsernames: async (): Promise<InstagramAccount[]> => {
    const accounts = InstagramService.getAccounts();
    
    const accountsWithUsernames = await Promise.all(
      accounts.map(async (account) => {
        try {
          const accountInfo = await InstagramService.getAccountInfo(account.id);
          return accountInfo;
        } catch (error) {
          console.error(`Failed to fetch username for ${account.id}:`, error);
          // Return account as-is if fetch fails
          return account;
        }
      })
    );
    
    return accountsWithUsernames;
  }
};
