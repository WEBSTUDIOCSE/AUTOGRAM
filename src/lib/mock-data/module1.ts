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
 */
export const mockRecentPrompts: RecentPrompt[] = [
  {
    id: '1',
    text: 'A serene mountain landscape at golden hour, with dramatic clouds...',
    timestamp: 'Today at 10:30',
  },
  {
    id: '2',
    text: 'Futuristic neon city at rain, cyberpunk mood, 4K details...',
    timestamp: '2d ago',
  },
  {
    id: '3',
    text: 'Cozy minimalist living room, soft morning light, editorial tried...',
    timestamp: '3d ago',
  },
  {
    id: '4',
    text: 'Playful abstract shapes poster, warm gradient palette, bold ty...',
    timestamp: '5d ago',
  },
  {
    id: '5',
    text: 'Vintage film portrait, shallow depth of field, cinematic color gr...',
    timestamp: '1w ago',
  },
];

/**
 * Instagram accounts mock data
 */
export const mockInstagramAccounts: InstagramAccount[] = [
  {
    id: '1',
    username: '@fashionista_ai',
    displayName: 'Fashion AI',
    followers: '12.5k',
    avatarUrl: undefined,
  },
  {
    id: '2',
    username: '@artwithminds',
    displayName: 'Art With Minds',
    followers: '10.1k',
    avatarUrl: undefined,
  },
  {
    id: '3',
    username: '@travel_tales',
    displayName: 'Travel Tales',
    followers: '8.2k',
    avatarUrl: undefined,
  },
  {
    id: '4',
    username: '@foodie_shots',
    displayName: 'Foodie Shots',
    followers: '15.3k',
    avatarUrl: undefined,
  },
];

/**
 * Quick example prompts
 */
export const quickExamples = [
  'Quick examples',
  'Realistic Photo',
  'Abstract Art',
  'Digital Illustration',
];

/**
 * Hashtag suggestions
 */
export const mockHashtagSuggestions: HashtagSuggestion[] = [
  { tag: 'art', category: 'popular' },
  { tag: 'sunset', category: 'trending' },
  { tag: 'beautiful', category: 'popular' },
  { tag: 'nature', category: 'recommended' },
  { tag: 'photography', category: 'popular' },
  { tag: 'landscape', category: 'recommended' },
  { tag: 'goldenhour', category: 'trending' },
  { tag: 'explore', category: 'popular' },
  { tag: 'instagood', category: 'popular' },
  { tag: 'picoftheday', category: 'trending' },
];

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
