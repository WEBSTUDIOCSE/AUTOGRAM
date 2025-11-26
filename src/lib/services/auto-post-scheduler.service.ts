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
      console.log(`[AutoPost] ✅ Config loaded - isEnabled: ${config.isEnabled}, active characters: ${config.activeCharacterIds.length}`);
      
      if (!config.isEnabled) {
        console.log(`[AutoPost] ⚠️ Auto-posting is disabled for user ${userId}`);
        return;
      }

      if (config.activeCharacterIds.length === 0) {
        console.log(`[AutoPost] ⚠️ No active characters configured for user ${userId}`);
        return;
      }

      // Step 2: Get user's active characters that should post at this time
      console.log(`[AutoPost] STEP 2: Loading characters for scheduled time ${scheduledTime}...`);
      const step2Start = Date.now();
      const allCharacters = await CharacterService.getUserCharacters(userId);
      const activeCharacters = allCharacters.filter(char => 
        config.activeCharacterIds.includes(char.id) &&
        char.postingTimes && 
        char.postingTimes.includes(scheduledTime)
      );
      stepTimer.steps.push({ step: 2, name: 'Load Characters', duration: Date.now() - step2Start, count: activeCharacters.length });
      
      console.log(`[AutoPost] ✅ Found ${activeCharacters.length} character(s) scheduled for ${scheduledTime}`);
      if (activeCharacters.length === 0) {
        console.log(`[AutoPost] ⚠️ No characters scheduled for time ${scheduledTime}`);
        return; // Not an error, just no characters scheduled for this time
      }

      // Step 3: Select character (weighted by usage - prefer less-used)
      console.log(`[AutoPost] STEP 3: Selecting character (weighted by usage)...`);
      const selectedCharacter = this.selectCharacterWeighted(activeCharacters);
      console.log(`[AutoPost] ✅ Selected: ${selectedCharacter.name} (Usage: ${selectedCharacter.usageCount} times)`);

      // Step 4: Get character's assigned Instagram account
      console.log(`[AutoPost] STEP 4: Getting character's assigned account...`);
      const assignedAccount = InstagramService.getAccountById(selectedCharacter.assignedAccountId);
      if (!assignedAccount || !assignedAccount.isActive) {
        console.error(`[AutoPost] ❌ Character's assigned account not available: ${selectedCharacter.assignedAccountId}`);
        await this.logFailure(
          userId,
          scheduledTime,
          `Character "${selectedCharacter.name}" is assigned to an inactive or missing Instagram account. Please reassign the character in the Characters section.`,
          selectedCharacter
        );
        return;
      }
      console.log(`[AutoPost] ✅ Will post to: @${assignedAccount.username || assignedAccount.name} (${assignedAccount.accountId})`);

      // Step 5: Get random active prompt template
      console.log(`[AutoPost] STEP 5: Loading prompt template...`);
      const step5Start = Date.now();
      const promptTemplate = await PromptLibraryService.getRandomPrompt(userId);
      stepTimer.steps.push({ step: 5, name: 'Load Prompt', duration: Date.now() - step5Start, found: !!promptTemplate });
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

      // Step 6: Generate prompt variation
      console.log(`[AutoPost] STEP 6: Generating prompt variation...`);
      const step6Start = Date.now();
      const generatedPrompt = await PromptVariationService.generateVariation(
        promptTemplate.basePrompt
      );
      stepTimer.steps.push({ step: 6, name: 'Generate Variation', duration: Date.now() - step6Start });
      console.log(`[AutoPost] ✅ Variation: "${generatedPrompt.substring(0, 50)}..."`);

      // Step 7: Generate image with character
      console.log(`[AutoPost] STEP 7: Generating image with AI...`);
      const step7Start = Date.now();
      const result = await CharacterAIService.generateWithCharacter(
        selectedCharacter.imageBase64,
        generatedPrompt
      );
      stepTimer.steps.push({ step: 7, name: 'AI Image Generation', duration: Date.now() - step7Start });
      console.log(`[AutoPost] ✅ Image generated (${result.imageBase64.length} bytes)`);

      // Step 8: Upload to Firebase Storage
      console.log(`[AutoPost] STEP 8: Uploading to Firebase Storage...`);
      const step8Start = Date.now();
      const base64 = result.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const imageUrl = await StorageService.uploadImage(
        base64,
        userId,
        'module3',
        'auto-generated'
      );
      stepTimer.steps.push({ step: 8, name: 'Upload Storage', duration: Date.now() - step8Start });
      console.log(`[AutoPost] ✅ Uploaded: ${imageUrl}`);

      // Step 9: Post to Instagram (character's assigned account)
      console.log(`[AutoPost] STEP 9: Posting to Instagram...`);
      const step9Start = Date.now();
      const fullCaption = `${result.caption}\n\n${result.hashtags}`;
      console.log(`[AutoPost] Caption: "${result.caption.substring(0, 50)}..."`);
      console.log(`[AutoPost] Hashtags: ${result.hashtags}`);
      console.log(`[AutoPost] Posting to: @${assignedAccount.username || assignedAccount.name}`);
      
      const instagramPostId = await InstagramService.postImage(
        imageUrl,
        fullCaption,
        assignedAccount.accountId
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
        instagramAccountId: assignedAccount.accountId,
        instagramAccountName: assignedAccount.username || assignedAccount.name,
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
        console.log(`[AutoPost] Weighted selection: ${characters[i].name} (weight: ${weights[i]}/${totalWeight})`);
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
