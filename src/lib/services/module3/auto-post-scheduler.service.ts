import { AutoPostConfigService } from './auto-post-config.service';
import { PromptLibraryService } from '../prompt-library.service';
import { Module3PromptGenerator } from './prompt-generator.service';
import { AutoPostLogService } from './auto-post-log.service';
import { CharacterService } from '../character.service';
import { CharacterAIService } from '../character-ai.service';
import { UnifiedImageStorageService } from '../unified/image-storage.service';
import { InstagramService } from '../instagram.service';
import { CharacterPostService } from '../character-post.service';
import { ErrorNotificationService } from '../error-notification.service';
import type { Character, AutoPostConfig, PromptTemplate } from '@/lib/firebase/config/types';

/**
 * Service for executing auto-posting workflow for Module 3
 */
export class AutoPostSchedulerService {
  /**
   * Check if auto-post was already executed in the current hour
   */
  static async wasExecutedThisHour(userId: string, scheduledTime: string): Promise<boolean> {
    const logs = await AutoPostLogService.getUserLogs(userId, 1);
    
    if (logs.length === 0) {
      return false;
    }

    const lastLog = logs[0];
    const lastLogTime = new Date(lastLog.executedAt);
    const currentTime = new Date();

    // Check if last log was in the same hour and same scheduled time
    return (
      lastLogTime.getHours() === currentTime.getHours() &&
      lastLogTime.getDate() === currentTime.getDate() &&
      lastLogTime.getMonth() === currentTime.getMonth() &&
      lastLogTime.getFullYear() === currentTime.getFullYear() &&
      lastLog.scheduledTime === scheduledTime
    );
  }

  /**
   * Main function to execute an auto-post for a user
   */
  static async executeAutoPost(userId: string, scheduledTime: string): Promise<void> {
    const stepTimer: { start: number; steps: Array<{ step: number; name: string; duration: number; success?: boolean; count?: number; found?: boolean }> } = { start: Date.now(), steps: [] };
    
    try {

      // Step 0: Check if already executed this hour
      const stepStart = Date.now();
      const alreadyExecuted = await this.wasExecutedThisHour(userId, scheduledTime);
      stepTimer.steps.push({ step: 0, name: 'Duplicate Check', duration: Date.now() - stepStart, success: true });
      
      if (alreadyExecuted) {
        return;
      }

      // Step 1: Get and validate configuration
      const step1Start = Date.now();
      const config = await AutoPostConfigService.getConfig(userId);
      stepTimer.steps.push({ step: 1, name: 'Load Config', duration: Date.now() - step1Start, success: !!config });
      if (!config) {
        return;
      }
      
      if (!config.isEnabled) {
        return;
      }

      if (config.activeCharacterIds.length === 0) {
        return;
      }

      // Step 2: Get user's active characters that should post at this time
      const step2Start = Date.now();
      const allCharacters = await CharacterService.getUserCharacters(userId);
      const activeCharacters = allCharacters.filter(char => 
        config.activeCharacterIds.includes(char.id) &&
        char.postingTimes && 
        char.postingTimes.includes(scheduledTime)
      );
      stepTimer.steps.push({ step: 2, name: 'Load Characters', duration: Date.now() - step2Start, count: activeCharacters.length });
      
      if (activeCharacters.length === 0) {
        return; // Not an error, just no characters scheduled for this time
      }

      // Step 3: Post for EACH character scheduled at this time
      
      for (const selectedCharacter of activeCharacters) {
        try {
          
          // Step 4: Get character's assigned Instagram account
          
          const assignedAccount = InstagramService.getAccountById(selectedCharacter.assignedAccountId);
          
          
          if (!assignedAccount || !assignedAccount.isActive) {
            
            // Debug: List all available accounts
            const allAccounts = InstagramService.getAccounts();
            
            await this.logFailure(
              userId,
              scheduledTime,
              `Character "${selectedCharacter.name}" is assigned to an inactive or missing Instagram account. Please reassign the character in the Characters section.`,
              selectedCharacter
            );
            continue; // Skip this character, try the next one
          }

          // Step 5: Get random active prompt template
          const step5Start = Date.now();
          const promptTemplate = await PromptLibraryService.getRandomPrompt(userId);
          stepTimer.steps.push({ step: 5, name: 'Load Prompt', duration: Date.now() - step5Start, found: !!promptTemplate });
          if (!promptTemplate) {
            await this.logFailure(
              userId,
              scheduledTime,
              'No active prompt templates found. Generate an image in the Generate tab to create your first prompt template.',
              selectedCharacter
            );
            continue; // Skip this character, try the next one
          }

          // Step 6: Generate unique prompt variation
          const step6Start = Date.now();
          
          // Get recent posts to avoid repetition
          const recentPosts = await CharacterPostService.getRecentPosts(userId, 10);
          const previousPrompts = recentPosts
            .filter(p => p.characterId === selectedCharacter.id && p.moduleType === 'module3')
            .map(p => p.prompt);
          
          
          // Generate varied prompt using new generator
          const context = Module3PromptGenerator.getGenerationContext(previousPrompts);
          const generatedPrompt = await Module3PromptGenerator.generateUniquePrompt(
            selectedCharacter,
            promptTemplate.basePrompt,
            context
          );
          
          stepTimer.steps.push({ step: 6, name: 'Generate Unique Variation', duration: Date.now() - step6Start });
          // Step 7: Generate image with character
          const step7Start = Date.now();
          const result = await CharacterAIService.generateWithCharacter(
            selectedCharacter.imageBase64,
            generatedPrompt
          );
          stepTimer.steps.push({ step: 7, name: 'AI Image Generation', duration: Date.now() - step7Start });

          // Step 8: Upload to Firebase Storage using UnifiedImageStorageService
          const step8Start = Date.now();
          const uploadResult = await UnifiedImageStorageService.uploadImage(
            result.imageBase64,
            userId,
            'module3/auto_posts'
          );
          const imageUrl = uploadResult.imageUrl;
          const storedImageBase64 = uploadResult.imageBase64;
          stepTimer.steps.push({ step: 8, name: 'Upload Storage', duration: Date.now() - step8Start });

          // Step 9: Post to Instagram (character's assigned account)
          const step9Start = Date.now();
          const fullCaption = `${result.caption}\n\n${result.hashtags}`;
          
          const instagramPostId = await InstagramService.postImage(
            imageUrl,
            fullCaption,
            assignedAccount.accountId
          );
          stepTimer.steps.push({ step: 9, name: 'Instagram Post', duration: Date.now() - step9Start });

          // Save to unified character_posts for post history display
          try {
            await CharacterPostService.saveCharacterPost({
              userId,
              moduleType: 'module3',
              characterId: selectedCharacter.id,
              characterName: selectedCharacter.name,
              prompt: generatedPrompt,
              generatedImageBase64: storedImageBase64,
              generatedImageUrl: imageUrl,
              caption: result.caption,
              hashtags: result.hashtags,
              instagramAccountId: assignedAccount.accountId,
              instagramAccountName: assignedAccount.username || assignedAccount.name,
              postedToInstagram: true,
              instagramPostId,
              model: result.model,
              timestamp: new Date().toISOString()
            });
          } catch (postError) {
            // Don't throw - post was successful, this is just for history display
          }

          // Step 10: Save log
          const step10Start = Date.now();
          await AutoPostLogService.saveLog({
            userId,
            characterId: selectedCharacter.id,
            characterName: selectedCharacter.name,
            promptTemplateId: promptTemplate.id,
            basePrompt: promptTemplate.basePrompt,
            generatedPrompt,
            generatedImageUrl: imageUrl,
            caption: result.caption,
            hashtags: result.hashtags,
            instagramPostId,
            instagramAccountId: assignedAccount.accountId,
            instagramAccountName: assignedAccount.username || assignedAccount.name,
            scheduledTime,
            status: 'success',
          });

          stepTimer.steps.push({ step: 10, name: 'Save Log', duration: Date.now() - step10Start });

          // Step 11: Update usage statistics
          await CharacterService.updateCharacterUsage(selectedCharacter.id);
          await PromptLibraryService.incrementUsage(promptTemplate.id);

          
        } catch (charError) {
          
          // Log failure for this specific character
          await this.logFailure(
            userId,
            scheduledTime,
            charError instanceof Error ? charError.message : 'Unknown error occurred',
            selectedCharacter
          );
          
          // Continue with next character
          continue;
        }
      }

      const totalDuration = Date.now() - stepTimer.start;
      stepTimer.steps.forEach(s => {
      });
    } catch (error) {
      if (error instanceof Error) {
      }
      
      // Determine error category for better user feedback
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Add context to common errors using ErrorNotificationService
        const errorDisplay = ErrorNotificationService.formatForDisplay(errorMessage);
        errorMessage = `${errorDisplay.friendly.title}: ${errorDisplay.friendly.description}`;
      }
      
      // Log the failure with detailed error
      await AutoPostLogService.saveLog({
        userId,
        characterId: '',
        characterName: '',
        promptTemplateId: '',
        basePrompt: '',
        generatedPrompt: '',
        generatedImageUrl: '',
        caption: '',
        hashtags: '',
        instagramAccountId: '',
        instagramAccountName: '',
        scheduledTime,
        status: 'failed',
        error: errorMessage,
      });

      throw error;
    }
  }

  /**
   * Select character using weighted random selection
   * Characters with FEWER posts get HIGHER probability
   * This ensures balanced posting across all characters
   */
  static selectCharacterWeighted(characters: Character[]): Character {
    if (characters.length === 1) {
      return characters[0];
    }

    // Calculate weights (inverse of usage count)
    // Characters with 0 usage get maximum weight
    const maxUsage = Math.max(...characters.map(c => c.usageCount), 0);
    const weights = characters.map(c => {
      // Weight formula: (maxUsage - usageCount + 1)
      // This gives unused characters highest weight
      return maxUsage - c.usageCount + 1;
    });

    // Calculate total weight
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    // Select random character based on weights
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < characters.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return characters[i];
      }
    }

    // Fallback (should never reach here)
    return characters[0];
  }

  /**
   * Log a failure with detailed information
   */
  static async logFailure(
    userId: string,
    scheduledTime: string,
    error: string,
    character?: Character,
    promptTemplate?: PromptTemplate,
    generatedPrompt?: string
  ): Promise<void> {
    await AutoPostLogService.saveLog({
      userId,
      characterId: character?.id || '',
      characterName: character?.name || '',
      promptTemplateId: promptTemplate?.id || '',
      basePrompt: promptTemplate?.basePrompt || '',
      generatedPrompt: generatedPrompt || '',
      generatedImageUrl: '',
      caption: '',
      hashtags: '',
      instagramAccountId: '',
      instagramAccountName: '',
      scheduledTime,
      status: 'failed',
      error,
    });
  }

  /**
   * Test auto-post execution without actually posting to Instagram
   */
  static async testAutoPost(userId: string): Promise<{
    success: boolean;
    message: string;
    details?: {
      character: string;
      promptTemplate: string;
      instagramAccount: string;
      totalCharacters: number;
      totalPrompts: number;
      charactersWithPostingTimes: number;
      timezone: string;
    };
  }> {
    try {
      // Get configuration
      const config = await AutoPostConfigService.getConfig(userId);
      if (!config || !config.isEnabled) {
        return {
          success: false,
          message: 'Auto-posting is not enabled',
        };
      }

      // Check characters
      const characters = await CharacterService.getUserCharacters(userId);
      if (characters.length < config.minCharacters) {
        return {
          success: false,
          message: `Not enough characters (${characters.length}/${config.minCharacters})`,
        };
      }

      // Check prompt templates
      const prompts = await PromptLibraryService.getActivePrompts(userId);
      if (prompts.length === 0) {
        return {
          success: false,
          message: 'No active prompt templates found',
        };
      }

      // Check that at least one character has posting times configured
      const charactersWithTimes = characters.filter(c => c.postingTimes && c.postingTimes.length > 0);
      if (charactersWithTimes.length === 0) {
        return {
          success: false,
          message: 'No characters have posting times configured',
        };
      }

      // Select resources for testing
      const selectedCharacter = this.selectCharacterWeighted(characters);
      const selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      const selectedAccount = InstagramService.getAccountById(selectedCharacter.assignedAccountId);

      return {
        success: true,
        message: 'Auto-post configuration is valid and ready',
        details: {
          character: selectedCharacter.name,
          promptTemplate: selectedPrompt.basePrompt,
          instagramAccount: selectedAccount?.name || 'Unknown',
          totalCharacters: characters.length,
          totalPrompts: prompts.length,
          charactersWithPostingTimes: charactersWithTimes.length,
          timezone: config.timezone,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Test failed',
      };
    }
  }

  /**
   * Get next scheduled post time across all active characters
   */
  static async getNextScheduledTime(
    userId: string,
    config: AutoPostConfig
  ): Promise<Date | null> {
    if (!config.isEnabled) {
      return null;
    }

    // Get all characters
    const characters = await CharacterService.getUserCharacters(userId);
    
    // Get all active characters with posting times
    const activeCharsWithTimes = characters.filter(
      c => config.activeCharacterIds.includes(c.id) && c.postingTimes && c.postingTimes.length > 0
    );

    if (activeCharsWithTimes.length === 0) {
      return null;
    }

    // Collect all unique posting times from active characters
    const allPostingTimes = new Set<string>();
    activeCharsWithTimes.forEach(char => {
      char.postingTimes.forEach(time => allPostingTimes.add(time));
    });

    const sortedTimes = Array.from(allPostingTimes).sort();

    const now = new Date();
    const today = new Date(now.toLocaleDateString('en-US', { timeZone: config.timezone }));

    // Find next time today
    for (const time of sortedTimes) {
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledTime = new Date(today);
      scheduledTime.setHours(hours, minutes, 0, 0);

      if (scheduledTime > now) {
        return scheduledTime;
      }
    }

    // If no time today, return first time tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [hours, minutes] = sortedTimes[0].split(':').map(Number);
    tomorrow.setHours(hours, minutes, 0, 0);

    return tomorrow;
  }
}
