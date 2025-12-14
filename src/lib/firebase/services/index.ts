/**
 * Firebase Services APIBook
 * Central export point for Firebase services
 */

// Import auth service
export { AuthService } from './auth.service';

// Import payment service
export { PaymentService } from './payment.service';

// Import user preferences service
export { UserPreferencesService } from './user-preferences.service';
export type { UserPreferences } from './user-preferences.service';

// Import AI service
export { AIService } from '@/lib/services/ai.service';

// Import Instagram service
export { InstagramService } from '@/lib/services/instagram.service';

// Import Storage service
export { StorageService } from '@/lib/services/storage.service';

// Import Unified Services (cross-module)
export { UnifiedImageStorageService } from '@/lib/services/unified/image-storage.service';
export { AutoPostModuleRegistry } from '@/lib/services/unified/auto-post-module-registry.service';

// Import Image service
export { ImageService } from '@/lib/services/image.service';

// Import Instagram Post service
export { InstagramPostService } from '@/lib/services/module3/post-history.service';

// Import Character services
export { CharacterService } from '@/lib/services/character.service';
export { CharacterAIService } from '@/lib/services/character-ai.service';
export { CharacterPostService } from '@/lib/services/character-post.service';

// Import Auto-Post services (Module 3)
export { AutoPostConfigService } from '@/lib/services/module3/auto-post-config.service';
export { PromptLibraryService } from '@/lib/services/prompt-library.service';
export { Module3PromptGenerator } from '@/lib/services/module3/prompt-generator.service';
export { AutoPostLogService } from '@/lib/services/module3/auto-post-log.service';
export { AutoPostSchedulerService } from '@/lib/services/module3/auto-post-scheduler.service';
export { ErrorNotificationService } from '@/lib/services/error-notification.service';

// Import types
export type { AppUser } from './auth.service';
export type { PaymentRecord } from './payment.service';
export type { GeneratedImage } from '@/lib/services/ai.service';
export type { InstagramAccount, InstagramPostResponse } from '@/lib/services/instagram.service';
export type { GeneratedImage as SavedImage } from '@/lib/services/image.service';
export type { InstagramPost } from '@/lib/services/module3/post-history.service';
export type { Character, CharacterPost, AutoPostConfig, PromptTemplate, AutoPostLog } from '@/lib/firebase/config/types';
export type { ApiResponse } from '../handler';

// Re-export for convenience
import { AuthService } from './auth.service';
import { PaymentService } from './payment.service';
import { AIService } from '@/lib/services/ai.service';
import { InstagramService } from '@/lib/services/instagram.service';
import { StorageService } from '@/lib/services/storage.service';
import { UnifiedImageStorageService } from '@/lib/services/unified/image-storage.service';
import { AutoPostModuleRegistry } from '@/lib/services/unified/auto-post-module-registry.service';
import { ImageService } from '@/lib/services/image.service';
import { InstagramPostService } from '@/lib/services/module3/post-history.service';
import { CharacterService } from '@/lib/services/character.service';
import { CharacterAIService } from '@/lib/services/character-ai.service';
import { CharacterPostService } from '@/lib/services/character-post.service';
import { AutoPostConfigService } from '@/lib/services/module3/auto-post-config.service';
import { PromptLibraryService } from '@/lib/services/prompt-library.service';
import { Module3PromptGenerator } from '@/lib/services/module3/prompt-generator.service';
import { AutoPostLogService } from '@/lib/services/module3/auto-post-log.service';
import { AutoPostSchedulerService } from '@/lib/services/module3/auto-post-scheduler.service';
import { ErrorNotificationService } from '@/lib/services/error-notification.service';

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
 * const errorInfo = APIBook.errorNotification.formatForDisplay(errorMessage);
 * const upload = await APIBook.unifiedImage.uploadFromFile(file, userId, 'module3');
 * const modules = APIBook.moduleRegistry.findScheduledItems(userId, currentTime);
 */
export const APIBook = {
  auth: AuthService,
  payment: PaymentService,
  ai: AIService,
  instagram: InstagramService,
  storage: StorageService,
  unifiedImage: UnifiedImageStorageService, // ⭐ Unified image uploader for all modules
  moduleRegistry: AutoPostModuleRegistry,   // ⭐ Cross-module scheduler registry
  image: ImageService,
  instagramPost: InstagramPostService,
  character: CharacterService,
  characterAI: CharacterAIService,
  characterPost: CharacterPostService,
  autoPostConfig: AutoPostConfigService,
  promptLibrary: PromptLibraryService,
  module3PromptGenerator: Module3PromptGenerator,
  autoPostLog: AutoPostLogService,
  autoPostScheduler: AutoPostSchedulerService,
  errorNotification: ErrorNotificationService,
} as const;

/**
 * Default export for direct service access
 */
export default APIBook;
