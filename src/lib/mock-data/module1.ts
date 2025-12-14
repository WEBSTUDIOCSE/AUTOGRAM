/**
 * Mock data for Module 1: Random Image Generator
 * Used for UI development before backend integration
 */

export interface RecentPrompt {
  id: string;
  text: string;
  timestamp: string;
}

export interface InstagramAccount {
  id: string;
  username: string;
  displayName: string;
  followers: string;
  avatarUrl?: string;
}

export interface HashtagSuggestion {
  tag: string;
  category: 'popular' | 'trending' | 'recommended';
}

/**
 * Recent prompts mock data
 * No mock data - load from user's actual Firebase data
 */
export const mockRecentPrompts: RecentPrompt[] = [];

/**
 * Instagram accounts mock data
 * No mock data - load from user's actual connected accounts
 */
export const mockInstagramAccounts: InstagramAccount[] = [];

/**
 * Quick example prompts
 * No hardcoded examples - users create their own
 */
export const quickExamples: string[] = [];

/**
 * Hashtag suggestions
 * No hardcoded hashtags - AI generates contextually
 */
export const mockHashtagSuggestions: HashtagSuggestion[] = [];

/**
 * Sample generated image data
 */
export const mockGeneratedImage = {
  url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&h=1080&fit=crop',
  fileName: 'Image_001_2025-11-09_17-30-45.png',
  fileSize: '2.4 MB',
  dimensions: '1080 x 1080',
  prompt: 'Beautiful sunset over mountains with orange and purple sky, highly detailed, photorealistic',
  generatedAt: new Date(),
};
