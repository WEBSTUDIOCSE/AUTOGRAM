import { AutoPostConfigService } from './auto-post-config.service';
import { PromptLibraryService } from './prompt-library.service';
import { PromptVariationService } from './prompt-variation.service';
import { AutoPostLogService } from './auto-post-log.service';
import { CharacterService } from './character.service';
import { CharacterAIService } from './character-ai.service';
import { StorageService } from './storage.service';
import { InstagramService } from './instagram.service';
import { ErrorNotificationService } from './error-notification.service';
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
      console.log(`[AutoPost] ━━━━━ STARTING AUTO-POST WORKFLOW ━━━━━`);
      console.log(`[AutoPost] User ID: ${userId}`);
      console.log(`[AutoPost] Scheduled Time: ${scheduledTime}`);
      console.log(`[AutoPost] Current Time: ${new Date().toISOString()}`);

      // Step 0: Check if already executed this hour
      console.log(`[AutoPost] STEP 0: Checking duplicate execution...`);
      const stepStart = Date.now();
      const alreadyExecuted = await this.wasExecutedThisHour(userId, scheduledTime);
      stepTimer.steps.push({ step: 0, name: 'Duplicate Check', duration: Date.now() - stepStart, success: true });
      
      if (alreadyExecuted) {
        console.log(`[AutoPost] ⚠️ Auto-post already executed this hour - SKIPPING`);
        return;
      }
      console.log(`[AutoPost] ✅ No duplicate found, proceeding...`);

      // Step 1: Get and validate configuration
      console.log(`[AutoPost] STEP 1: Loading configuration...`);
      const step1Start = Date.now();
      const config = await AutoPostConfigService.getConfig(userId);
      stepTimer.steps.push({ step: 1, name: 'Load Config', duration: Date.now() - step1Start, success: !!config });
      if (!config) {
        console.error(`[AutoPost] ❌ No configuration found for user ${userId}`);
        return;
      }
      console.log(`[AutoPost] ✅ Config loaded - isEnabled: ${config.isEnabled}, accounts: ${config.instagramAccounts.length}, times: ${config.postingTimes.length}`);
      
      if (!config.isEnabled) {
        console.log(`[AutoPost] ⚠️ Auto-posting is disabled for user ${userId}`);
        return;
      }

      // Step 2: Get user's characters
      console.log(`[AutoPost] STEP 2: Loading user characters...`);
      const step2Start = Date.now();
      const characters = await CharacterService.getUserCharacters(userId);
      stepTimer.steps.push({ step: 2, name: 'Load Characters', duration: Date.now() - step2Start, count: characters.length });
      console.log(`[AutoPost] ✅ Found ${characters.length} character(s), need ${config.minCharacters}`);
      if (characters.length < config.minCharacters) {
        console.error(`[AutoPost] ❌ Not enough characters: ${characters.length}/${config.minCharacters}`);
        await this.logFailure(
          userId,
          scheduledTime,
          `Not enough characters: You have ${characters.length} character(s), but need at least ${config.minCharacters}. Upload more characters in the Generate tab.`
        );
        return;
      }

      // Step 3: Select random character
      console.log(`[AutoPost] STEP 3: Selecting random character...`);
      const selectedCharacter = this.selectRandomCharacter(characters);
      console.log(`[AutoPost] ✅ Selected: ${selectedCharacter.name} (ID: ${selectedCharacter.id})`);

      // Step 4: Get random active prompt template
      console.log(`[AutoPost] STEP 4: Loading prompt template...`);
      const step4Start = Date.now();
      const promptTemplate = await PromptLibraryService.getRandomPrompt(userId);
      stepTimer.steps.push({ step: 4, name: 'Load Prompt', duration: Date.now() - step4Start, found: !!promptTemplate });
      if (!promptTemplate) {
        console.error(`[AutoPost] ❌ No active prompt templates found`);
        await this.logFailure(
          userId,
          scheduledTime,
          'No active prompt templates found. Generate an image in the Generate tab to create your first prompt template.',
          selectedCharacter
        );
        return;
      }
      console.log(`[AutoPost] ✅ Selected: "${promptTemplate.basePrompt.substring(0, 50)}..."`);

      // Step 5: Generate prompt variation
      console.log(`[AutoPost] STEP 5: Generating prompt variation...`);
      const step5Start = Date.now();
      const generatedPrompt = await PromptVariationService.generateVariation(
        promptTemplate.basePrompt
      );
      stepTimer.steps.push({ step: 5, name: 'Generate Variation', duration: Date.now() - step5Start });
      console.log(`[AutoPost] ✅ Variation: "${generatedPrompt.substring(0, 50)}..."`);

      // Step 6: Generate image with character
      console.log(`[AutoPost] STEP 6: Generating image with AI...`);
      const step6Start = Date.now();
      const result = await CharacterAIService.generateWithCharacter(
        selectedCharacter.imageBase64,
        generatedPrompt
      );
      stepTimer.steps.push({ step: 6, name: 'AI Image Generation', duration: Date.now() - step6Start });
      console.log(`[AutoPost] ✅ Image generated (${result.imageBase64.length} bytes)`);

      // Step 7: Upload to Firebase Storage
      console.log(`[AutoPost] STEP 7: Uploading to Firebase Storage...`);
      const step7Start = Date.now();
      const base64 = result.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const imageUrl = await StorageService.uploadImage(
        base64,
        userId,
        'module3',
        'auto-generated'
      );
      stepTimer.steps.push({ step: 7, name: 'Upload Storage', duration: Date.now() - step7Start });
      console.log(`[AutoPost] ✅ Uploaded: ${imageUrl}`);

      // Step 8: Select Instagram account
      console.log(`[AutoPost] STEP 8: Selecting Instagram account...`);
      const accountId = this.selectInstagramAccount(config);
      const account = InstagramService.getAccountById(accountId);
      if (!account) {
        console.error(`[AutoPost] ❌ Instagram account not found: ${accountId}`);
        await this.logFailure(
          userId,
          scheduledTime,
          `Instagram account not found or disconnected (ID: ${accountId}). Please check your Instagram account connection in Settings and ensure the account is still active.`,
          selectedCharacter,
          promptTemplate,
          generatedPrompt
        );
        return;
      }
      console.log(`[AutoPost] ✅ Selected: ${account.name} (${accountId})`);

      // Step 9: Post to Instagram
      console.log(`[AutoPost] STEP 9: Posting to Instagram...`);
      const step9Start = Date.now();
      const fullCaption = `${result.caption}\n\n${result.hashtags}`;
      console.log(`[AutoPost] Caption: "${result.caption.substring(0, 50)}..."`);
      console.log(`[AutoPost] Hashtags: ${result.hashtags}`);
      
      const instagramPostId = await InstagramService.postImage(
        imageUrl,
        fullCaption,
        accountId
      );
      stepTimer.steps.push({ step: 9, name: 'Instagram Post', duration: Date.now() - step9Start });
      console.log(`[AutoPost] ✅ Posted! Instagram ID: ${instagramPostId}`);

      // Step 10: Save log
      console.log(`[AutoPost] STEP 10: Saving execution log...`);
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
        instagramAccountId: accountId,
        instagramAccountName: account.name,
        scheduledTime,
        status: 'success',
      });

      stepTimer.steps.push({ step: 10, name: 'Save Log', duration: Date.now() - step10Start });
      console.log(`[AutoPost] ✅ Log saved`);

      // Step 11: Update usage statistics
      console.log(`[AutoPost] STEP 11: Updating usage statistics...`);
      await CharacterService.updateCharacterUsage(selectedCharacter.id);
      await PromptLibraryService.incrementUsage(promptTemplate.id);
      console.log(`[AutoPost] ✅ Statistics updated`);

      const totalDuration = Date.now() - stepTimer.start;
      console.log(`[AutoPost] ━━━━━ WORKFLOW COMPLETED SUCCESSFULLY ━━━━━`);
      console.log(`[AutoPost] Total time: ${totalDuration}ms (${(totalDuration/1000).toFixed(2)}s)`);
      console.log(`[AutoPost] Step timings:`);
      stepTimer.steps.forEach(s => {
        console.log(`[AutoPost]   Step ${s.step} (${s.name}): ${s.duration}ms`);
      });
    } catch (error) {
      console.error('[AutoPost] ━━━━━ WORKFLOW FAILED ━━━━━');
      console.error('[AutoPost] Error during auto-post execution:', error);
      if (error instanceof Error) {
        console.error('[AutoPost] Error type:', error.constructor.name);
        console.error('[AutoPost] Error message:', error.message);
        console.error('[AutoPost] Stack trace:', error.stack);
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
