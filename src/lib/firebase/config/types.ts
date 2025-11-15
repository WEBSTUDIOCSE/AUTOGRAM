/**
 * Firebase configuration interface
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
  vapidKey: string; // Add VAPID key for push notifications
}

/**
 * Environment names
 */
export type Environment = 'UAT' | 'PROD';

/**
 * Gemini AI configuration interface
 */
export interface GeminiConfig {
  apiKey: string;
  imageModel: string;
  textModel: string;
}

/**
 * Single Instagram Account
 */
export interface InstagramAccount {
  id: string;
  name: string;
  username: string;
  accessToken: string;
  accountId: string;
  profilePictureUrl?: string;
  isActive: boolean;
}

/**
 * Instagram Graph API configuration interface
 */
export interface InstagramConfig {
  appId: string;
  appSecret: string;
  accounts: InstagramAccount[];
}

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  name: Environment;
  config: FirebaseConfig;
  gemini: GeminiConfig;
  instagram: InstagramConfig;
}

/**
 * Character model for Module 2 - Character Model Generator
 */
export interface Character {
  id: string;
  userId: string;
  name: string;
  imageUrl: string;
  thumbnailUrl: string;
  imageBase64: string;
  uploadedAt: string;
  lastUsedAt: string | null;
  usageCount: number;
}

/**
 * Module types for organizing images and posts
 */
export type ModuleType = 'module1' | 'module2';

/**
 * Character post data for Module 2
 */
export interface CharacterPost {
  id: string;
  userId: string;
  moduleType: ModuleType;
  characterId: string;
  characterName: string;
  prompt: string;
  generatedImageBase64: string;
  generatedImageUrl: string;
  caption: string;
  hashtags: string;
  instagramAccountId: string;
  instagramAccountName: string;
  postedToInstagram: boolean;
  instagramPostId: string | null;
  model: string;
  timestamp: string;
}