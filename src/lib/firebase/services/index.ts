/**
 * Firebase Services APIBook
 * Central export point for Firebase services
 */

// Import auth service
export { AuthService } from './auth.service';

// Import payment service
export { PaymentService } from './payment.service';

// Import AI service
export { AIService } from '@/lib/services/ai.service';

// Import Instagram service
export { InstagramService } from '@/lib/services/instagram.service';

// Import Storage service
export { StorageService } from '@/lib/services/storage.service';

// Import Image service
export { ImageService } from '@/lib/services/image.service';

// Import Instagram Post service
export { InstagramPostService } from '@/lib/services/post-history.service';

// Import Character services
export { CharacterService } from '@/lib/services/character.service';
export { CharacterAIService } from '@/lib/services/character-ai.service';
export { CharacterPostService } from '@/lib/services/character-post.service';
export { PromptRefinerService } from '@/lib/services/prompt-refiner.service';

// Import Auto-Post services (Module 3)
export { AutoPostConfigService } from '@/lib/services/auto-post-config.service';
export { PromptLibraryService } from '@/lib/services/prompt-library.service';
export { PromptVariationService } from '@/lib/services/prompt-variation.service';
export { AutoPostLogService } from '@/lib/services/auto-post-log.service';
export { AutoPostSchedulerService } from '@/lib/services/auto-post-scheduler.service';

// Import types
export type { AppUser } from './auth.service';
export type { PaymentRecord } from './payment.service';
export type { GeneratedImage } from '@/lib/services/ai.service';
export type { InstagramAccount, InstagramPostResponse } from '@/lib/services/instagram.service';
export type { GeneratedImage as SavedImage } from '@/lib/services/image.service';
export type { InstagramPost } from '@/lib/services/post-history.service';
export type { Character, CharacterPost, AutoPostConfig, PromptTemplate, AutoPostLog } from '@/lib/firebase/config/types';
export type { ApiResponse } from '../handler';

// Re-export for convenience
import { AuthService } from './auth.service';
import { PaymentService } from './payment.service';
import { AIService } from '@/lib/services/ai.service';
import { InstagramService } from '@/lib/services/instagram.service';
import { StorageService } from '@/lib/services/storage.service';
import { ImageService } from '@/lib/services/image.service';
import { InstagramPostService } from '@/lib/services/post-history.service';
import { CharacterService } from '@/lib/services/character.service';
import { CharacterAIService } from '@/lib/services/character-ai.service';
import { CharacterPostService } from '@/lib/services/character-post.service';
import { PromptRefinerService } from '@/lib/services/prompt-refiner.service';
import { AutoPostConfigService } from '@/lib/services/auto-post-config.service';
import { PromptLibraryService } from '@/lib/services/prompt-library.service';
import { PromptVariationService } from '@/lib/services/prompt-variation.service';
import { AutoPostLogService } from '@/lib/services/auto-post-log.service';
import { AutoPostSchedulerService } from '@/lib/services/auto-post-scheduler.service';

/**
 * Centralized APIBook for Firebase services
 * 
 * Usage:
 * import { APIBook } from '@/lib/firebase/services';
 * const result = await APIBook.auth.loginWithEmail(email, password);
 * const payment = await APIBook.payment.createPayment(paymentData);
 * const image = await APIBook.ai.generateImage(prompt);
 * const post = await APIBook.instagram.postImage(imageUrl, caption);
 * const savedImage = await APIBook.image.saveImage(imageData);
 * const postHistory = await APIBook.instagramPost.getUserPosts(userId);
 * const character = await APIBook.character.uploadCharacter(file, name, userId);
 * const generated = await APIBook.characterAI.generateWithCharacter(base64, prompt);
 * const characterPost = await APIBook.characterPost.saveCharacterPost(postData);
 * const refined = await APIBook.promptRefiner.refinePrompt(rawPrompt);
 * const autoPostConfig = await APIBook.autoPostConfig.getConfig(userId);
 * const prompts = await APIBook.promptLibrary.getUserPrompts(userId);
 * const variation = await APIBook.promptVariation.generateVariation(basePrompt);
 * const logs = await APIBook.autoPostLog.getUserLogs(userId);
 * await APIBook.autoPostScheduler.executeAutoPost(userId, scheduledTime);
 */
export const APIBook = {
  auth: AuthService,
  payment: PaymentService,
  ai: AIService,
  instagram: InstagramService,
  storage: StorageService,
  image: ImageService,
  instagramPost: InstagramPostService,
  character: CharacterService,
  characterAI: CharacterAIService,
  characterPost: CharacterPostService,
  promptRefiner: PromptRefinerService,
  autoPostConfig: AutoPostConfigService,
  promptLibrary: PromptLibraryService,
  promptVariation: PromptVariationService,
  autoPostLog: AutoPostLogService,
  autoPostScheduler: AutoPostSchedulerService,
} as const;

/**
 * Default export for direct service access
 */
export default APIBook;
