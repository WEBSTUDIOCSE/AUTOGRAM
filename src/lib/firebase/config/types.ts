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
 * Kie.ai configuration interface
 */
export interface KieAIConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;        // Default for text-to-image (fallback)
  editModel: string;           // Default for image-to-image (fallback)
  enabled: boolean;
  
  // User-selected models (override defaults)
  textToImageModel?: string;
  imageToImageModel?: string;
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
  appId: string; // Facebook App ID for this Instagram account
  appSecret: string; // Facebook App Secret for this Instagram account
  profilePictureUrl?: string;
  isActive: boolean;
}

/**
 * Instagram Graph API configuration interface
 */
export interface InstagramConfig {
  accounts: InstagramAccount[];
}

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  name: Environment;
  config: FirebaseConfig;
  gemini: GeminiConfig;
  kieai: KieAIConfig;
  instagram: InstagramConfig;
}

/**
 * Character model for Module 2 - Character Model Generator
 * Each character is assigned to a specific Instagram account
 */
export interface Character {
  id: string;
  userId: string;
  name: string;
  imageUrl: string;
  thumbnailUrl: string;
  imageBase64: string;
  assignedAccountId: string; // Instagram account ID this character posts to
  postingTimes: string[]; // Character-specific posting times in HH:mm format ['10:00', '14:00']
  uploadedAt: string;
  lastUsedAt: string | null;
  usageCount: number;
  module?: 'module2' | 'module3' | 'module7'; // Track which module uploaded this character
}

/**
 * Module types for organizing images and posts
 */
export type ModuleType = 'module1' | 'module2' | 'module3' | 'module4';

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

/**
 * Auto-Post Configuration for Module 3
 * Simplified - characters now have individual posting schedules
 */
export interface AutoPostConfig {
  id: string;
  userId: string;
  isEnabled: boolean;
  timezone: string; // e.g., 'Asia/Kolkata'
  activeCharacterIds: string[]; // Character IDs enabled for auto-posting
  minCharacters: number; // Minimum characters required to enable auto-posting
  promptVariationSettings?: {
    enabled: boolean;
    tone: 'casual' | 'professional' | 'fun' | 'elegant';
    allowTrending?: boolean; // Allow viral/trending topics
    avoidTopics?: string[];
    includeLocation?: boolean;
    trackHistory?: boolean; // Track and avoid recent themes
    avoidRepetitionDays?: number; // How many days back to check
    creativityLevel?: 'low' | 'medium' | 'high'; // How creative to be
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Prompt Template for Module 3 Auto-Posting
 */
export interface PromptTemplate {
  id: string;
  userId: string;
  basePrompt: string; // Base prompt text
  category?: string; // Optional category like 'fashion', 'outdoor', 'studio'
  usageCount: number;
  lastUsedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Auto-Post Log for Module 3
 */
export interface AutoPostLog {
  id: string;
  userId: string;
  characterId: string;
  characterName: string;
  promptTemplateId: string;
  basePrompt: string;
  generatedPrompt: string; // AI-generated variation
  generatedImageUrl: string;
  caption: string;
  hashtags: string;
  instagramPostId?: string;
  instagramAccountId: string;
  instagramAccountName: string;
  scheduledTime: string; // HH:mm format
  executedAt: string;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
}

/**
 * Family Member for Module 4 - Family Auto Poster
 */
export interface FamilyMember {
  id: string;
  name: string;
  role: 'person1' | 'person2' | 'child' | 'mother' | 'father' | 'grandmother' | 'grandfather';
  gender?: 'male' | 'female';
  age?: number;
  imageUrl?: string;
  imageBase64?: string; // Store base64 for AI generation (like Character)
  customRole?: string; // For custom roles beyond predefined ones
}

/**
 * Family Profile for Module 4 - Family Auto Poster
 */
export interface FamilyProfile {
  id: string;
  userId: string;
  profileName: string; // e.g., "Johnson Family", "My Parents"
  members: FamilyMember[];
  instagramAccountId: string; // Single Instagram account per family profile
  instagramAccountName: string;
  postingTimes: string[]; // Profile-specific posting times in HH:mm format ['10:00', '14:00']
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Prompt Category for Module 4
 */
export type FamilyPromptCategory = 'couple' | 'family' | 'kids' | 'custom';

/**
 * Family Prompt Template for Module 4
 */
export interface FamilyPromptTemplate {
  id: string;
  userId: string;
  familyProfileId: string;
  category: FamilyPromptCategory;
  basePrompt: string;
  usageCount: number;
  lastUsedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Family Auto-Post Schedule for Module 4
 */
export interface FamilyAutoPostSchedule {
  id: string;
  userId: string;
  familyProfileId: string;
  promptTemplateId: string;
  category: FamilyPromptCategory;
  frequency: 'daily' | 'weekly';
  time: string; // HH:mm format
  dayOfWeek?: number; // 0-6 for weekly (0 = Sunday)
  isEnabled: boolean;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Family Auto-Post Log for Module 4
 */
export interface FamilyAutoPostLog {
  id: string;
  userId: string;
  familyProfileId: string;
  familyProfileName: string;
  scheduleId?: string; // Optional - kept for backwards compatibility
  category: FamilyPromptCategory;
  basePrompt: string;
  generatedPrompt: string;
  familyContext: string; // "Sarah and John with their daughter Emma"
  generatedImageUrl: string;
  caption: string;
  hashtags: string;
  instagramPostId?: string;
  instagramAccountId: string;
  instagramAccountName: string;
  scheduledTime: string;
  executedAt: string;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
}

/**
 * Video Auto-Post Configuration for Module 8
 * Similar to AutoPostConfig but for video generation
 */
export interface VideoAutoPostConfig {
  id: string;
  userId: string;
  isEnabled: boolean;
  timezone: string; // e.g., 'Asia/Kolkata'
  activeTextToVideoIds: string[]; // Text-to-video prompt IDs enabled
  activeImageToVideoIds: string[]; // Image-to-video prompt IDs enabled
  minPrompts: number; // Minimum prompts required to enable auto-posting
  createdAt: string;
  updatedAt: string;
}

/**
 * Video Prompt for Module 8 Auto-Posting
 * Stores video generation prompts and scheduling
 */
export interface VideoPrompt {
  id: string;
  userId: string;
  videoType: 'text-to-video' | 'image-to-video';
  characterId?: string; // Optional character for image-to-video
  characterName?: string;
  basePrompt: string; // Base video prompt text
  category?: string; // Optional category
  assignedAccountId: string; // Instagram account ID for posting
  postingTimes: string[]; // Prompt-specific posting times in HH:mm format ['10:00', '14:00']
  usageCount: number;
  lastUsedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Video Auto-Post Log for Module 8
 */
export interface VideoAutoPostLog {
  id: string;
  userId: string;
  videoPromptId: string;
  videoType: 'text-to-video' | 'image-to-video';
  characterId?: string;
  characterName?: string;
  basePrompt: string;
  generatedPrompt: string; // AI-enhanced variation
  generatedVideoUrl: string;
  caption: string;
  hashtags: string;
  instagramPostId?: string;
  instagramAccountId: string;
  instagramAccountName: string;
  scheduledTime: string; // HH:mm format
  executedAt: string;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
  model?: string; // Video model used
}