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
   * @param accountId - Account ID
   * @returns Instagram account or null
   */
  getAccountById: (accountId: string): InstagramAccount | null => {
    const accounts = InstagramService.getAccounts();
    return accounts.find(account => account.id === accountId) || null;
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
   * @param imageUrl - Public URL of the image
   * @param caption - Post caption with hashtags
   * @param accountId - Instagram account ID to post to
   * @returns Container ID
   */
  createContainer: async (imageUrl: string, caption: string, accountId: string): Promise<string> => {
    const account = InstagramService.getAccountById(accountId);
    
    if (!account) {
      throw new Error(`Instagram account ${accountId} not found`);
    }
    
    const params = new URLSearchParams({
      image_url: imageUrl,
      caption: caption,
      access_token: account.accessToken
    });

    try {
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
        throw new Error(data.error.message);
      }
      
      console.log(`✅ Container created for ${account.name}:`, data.id);
      return data.id;
    } catch (error) {
      console.error('Failed to create Instagram container:', error);
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
   * Complete workflow: Upload image and post to Instagram
   * @param imageUrl - Public URL of the image (must be publicly accessible)
   * @param caption - Post caption with hashtags
   * @param accountId - Instagram account ID to post to
   * @returns Post ID
   */
  postImage: async (imageUrl: string, caption: string, accountId: string = 'account1'): Promise<string> => {
    console.log(`📸 Starting Instagram post workflow for account: ${accountId}...`);
    
    // Step 1: Create container
    const containerId = await InstagramService.createContainer(imageUrl, caption, accountId);
    
    // Step 2: Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
