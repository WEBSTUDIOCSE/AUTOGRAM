import { AutoPostConfigService } from './auto-post-config.service';
import { PromptLibraryService } from './prompt-library.service';
import { PromptVariationService } from './prompt-variation.service';
import { AutoPostLogService } from './auto-post-log.service';
import { CharacterService } from './character.service';
import { CharacterAIService } from './character-ai.service';
import { StorageService } from './storage.service';
import { InstagramService } from './instagram.service';
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
    try {
      console.log(`[AutoPost] Starting auto-post for user ${userId} at ${scheduledTime}`);

      // Step 0: Check if already executed this hour
      const alreadyExecuted = await this.wasExecutedThisHour(userId, scheduledTime);
      if (alreadyExecuted) {
        console.log(`[AutoPost] Auto-post already executed this hour for user ${userId} at ${scheduledTime}`);
        return;
      }

      // Step 1: Get and validate configuration
      const config = await AutoPostConfigService.getConfig(userId);
      if (!config || !config.isEnabled) {
        console.log(`[AutoPost] Auto-posting is disabled for user ${userId}`);
        return;
      }

      // Step 2: Get user's characters
      const characters = await CharacterService.getUserCharacters(userId);
      if (characters.length < config.minCharacters) {
        await this.logFailure(
          userId,
          scheduledTime,
          `Not enough characters (${characters.length}/${config.minCharacters})`
        );
        return;
      }

      // Step 3: Select random character
      const selectedCharacter = this.selectRandomCharacter(characters);
      console.log(`[AutoPost] Selected character: ${selectedCharacter.name}`);

      // Step 4: Get random active prompt template
      const promptTemplate = await PromptLibraryService.getRandomPrompt(userId);
      if (!promptTemplate) {
        await this.logFailure(
          userId,
          scheduledTime,
          'No active prompt templates found',
          selectedCharacter
        );
        return;
      }
      console.log(`[AutoPost] Selected prompt template: ${promptTemplate.basePrompt}`);

      // Step 5: Generate prompt variation
      const generatedPrompt = await PromptVariationService.generateVariation(
        promptTemplate.basePrompt
      );
      console.log(`[AutoPost] Generated prompt variation: ${generatedPrompt}`);

      // Step 6: Generate image with character
      const result = await CharacterAIService.generateWithCharacter(
        selectedCharacter.imageBase64,
        generatedPrompt
      );
      console.log(`[AutoPost] Image generated successfully`);

      // Step 7: Upload to Firebase Storage
      const base64 = result.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const imageUrl = await StorageService.uploadImage(
        base64,
        userId,
        'module3',
        'auto-generated'
      );
      console.log(`[AutoPost] Image uploaded to storage: ${imageUrl}`);

      // Step 8: Select Instagram account
      const accountId = this.selectInstagramAccount(config);
      const account = InstagramService.getAccountById(accountId);
      if (!account) {
        await this.logFailure(
          userId,
          scheduledTime,
          `Instagram account not found: ${accountId}`,
          selectedCharacter,
          promptTemplate,
          generatedPrompt
        );
        return;
      }
      console.log(`[AutoPost] Selected Instagram account: ${account.name}`);

      // Step 9: Post to Instagram
      const fullCaption = `${result.caption}\n\n${result.hashtags}`;
      const instagramPostId = await InstagramService.postImage(
        imageUrl,
        fullCaption,
        accountId
      );
      console.log(`[AutoPost] Posted to Instagram: ${instagramPostId}`);

      // Step 10: Save log
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
        instagramAccountId: accountId,
        instagramAccountName: account.name,
        scheduledTime,
        status: 'success',
      });

      // Step 11: Update usage statistics
      await CharacterService.updateCharacterUsage(selectedCharacter.id);
      await PromptLibraryService.incrementUsage(promptTemplate.id);

      console.log(`[AutoPost] Auto-post completed successfully for user ${userId}`);
    } catch (error) {
      console.error('[AutoPost] Error during auto-post execution:', error);
      
      // Log the failure
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
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Select a random character from the list
   */
  private static selectRandomCharacter(characters: Character[]): Character {
    const randomIndex = Math.floor(Math.random() * characters.length);
    return characters[randomIndex];
  }

  /**
   * Select Instagram account based on rotation strategy
   */
  private static selectInstagramAccount(config: AutoPostConfig): string {
    if (config.instagramAccounts.length === 0) {
      throw new Error('No Instagram accounts configured');
    }

    if (config.instagramAccounts.length === 1) {
      return config.instagramAccounts[0];
    }

    if (config.accountRotationStrategy === 'random') {
      // Random selection
      const randomIndex = Math.floor(Math.random() * config.instagramAccounts.length);
      return config.instagramAccounts[randomIndex];
    } else {
      // Rotate strategy: use current time to determine which account
      // This ensures consistent rotation across function invocations
      const now = new Date();
      const dayOfYear = Math.floor(
        (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
      );
      const postNumber = config.postingTimes.indexOf(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      );
      const rotationIndex = (dayOfYear + postNumber) % config.instagramAccounts.length;
      return config.instagramAccounts[rotationIndex];
    }
  }

  /**
   * Log a failure with detailed information
   */
  private static async logFailure(
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
      postingTimes: string[];
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

      // Check Instagram accounts
      if (config.instagramAccounts.length === 0) {
        return {
          success: false,
          message: 'No Instagram accounts configured',
        };
      }

      // Select resources
      const selectedCharacter = this.selectRandomCharacter(characters);
      const selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      const selectedAccountId = this.selectInstagramAccount(config);
      const selectedAccount = InstagramService.getAccountById(selectedAccountId);

      return {
        success: true,
        message: 'Auto-post configuration is valid and ready',
        details: {
          character: selectedCharacter.name,
          promptTemplate: selectedPrompt.basePrompt,
          instagramAccount: selectedAccount?.name || 'Unknown',
          totalCharacters: characters.length,
          totalPrompts: prompts.length,
          postingTimes: config.postingTimes,
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
   * Get next scheduled post time
   */
  static getNextScheduledTime(config: AutoPostConfig): Date | null {
    if (!config.isEnabled || config.postingTimes.length === 0) {
      return null;
    }

    const now = new Date();
    const today = new Date(now.toLocaleDateString('en-US', { timeZone: config.timezone }));

    // Sort posting times
    const sortedTimes = [...config.postingTimes].sort();

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
