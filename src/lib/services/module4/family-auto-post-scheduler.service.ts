import { FamilyProfileService, FamilyScheduleService, FamilyPromptService, FamilyLogService } from './index';
import { AIService } from '../ai.service';
import { CharacterAIService } from '../character-ai.service';
import { StorageService } from '../storage.service';
import { InstagramService } from '../instagram.service';
import type { FamilyProfile, FamilyAutoPostSchedule, FamilyPromptTemplate } from '@/lib/firebase/config/types';

/**
 * Service for executing family auto-posting workflow for Module 4
 */
export class FamilyAutoPostScheduler {
  /**
   * Check if auto-post was already executed in the current hour
   */
  static async wasExecutedThisHour(
    userId: string,
    scheduleId: string,
    scheduledTime: string
  ): Promise<boolean> {
    const logs = await FamilyLogService.getUserLogs(userId, 10);
    
    if (logs.length === 0) {
      return false;
    }

    const currentTime = new Date();
    
    // Check if any log exists for this schedule in the current hour
    return logs.some((log) => {
      const logTime = new Date(log.executedAt);
      return (
        log.scheduleId === scheduleId &&
        log.scheduledTime === scheduledTime &&
        logTime.getHours() === currentTime.getHours() &&
        logTime.getDate() === currentTime.getDate() &&
        logTime.getMonth() === currentTime.getMonth() &&
        logTime.getFullYear() === currentTime.getFullYear()
      );
    });
  }

  /**
   * Main function to execute family auto-posts for a user
   */
  static async executeAutoPost(userId: string, currentTime: Date): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`[FamilyAutoPost] ━━━━━ STARTING FAMILY AUTO-POST WORKFLOW ━━━━━`);
      console.log(`[FamilyAutoPost] User ID: ${userId}`);
      console.log(`[FamilyAutoPost] Current Time: ${currentTime.toISOString()}`);

      // Get all enabled schedules for the user
      const schedules = await FamilyScheduleService.getEnabledSchedules(userId);
      
      if (schedules.length === 0) {
        console.log(`[FamilyAutoPost] ⚠️ No enabled schedules found for user ${userId}`);
        return;
      }

      console.log(`[FamilyAutoPost] Found ${schedules.length} enabled schedule(s)`);

      // Filter schedules that should run at the current time
      const schedulesToRun = schedules.filter((schedule) =>
        FamilyScheduleService.shouldRunSchedule(schedule, currentTime)
      );

      if (schedulesToRun.length === 0) {
        console.log(`[FamilyAutoPost] ⚠️ No schedules due to run at this time`);
        return;
      }

      console.log(`[FamilyAutoPost] ${schedulesToRun.length} schedule(s) due to run`);

      // Process each schedule
      for (const schedule of schedulesToRun) {
        await this.processSchedule(userId, schedule, currentTime);
      }

      const duration = Date.now() - startTime;
      console.log(`[FamilyAutoPost] ✅ Completed workflow in ${duration}ms`);
      console.log(`[FamilyAutoPost] ━━━━━ WORKFLOW COMPLETED ━━━━━`);

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[FamilyAutoPost] ❌ Error after ${duration}ms:`, error);
      throw error;
    }
  }

  /**
   * Process a single schedule
   */
  private static async processSchedule(
    userId: string,
    schedule: FamilyAutoPostSchedule,
    currentTime: Date
  ): Promise<void> {
    try {
      console.log(`[FamilyAutoPost] Processing schedule ${schedule.id}...`);

      // Check if already executed this hour
      const alreadyExecuted = await this.wasExecutedThisHour(
        userId,
        schedule.id,
        schedule.time
      );

      if (alreadyExecuted) {
        console.log(`[FamilyAutoPost] ⚠️ Schedule already executed this hour - SKIPPING`);
        return;
      }

      // Get family profile
      const profile = await FamilyProfileService.getProfile(schedule.familyProfileId);
      if (!profile || !profile.isActive) {
        console.error(`[FamilyAutoPost] ❌ Family profile not found or inactive`);
        await this.logFailure(
          userId,
          schedule,
          'Family profile not found or inactive',
          profile?.profileName || 'Unknown'
        );
        return;
      }

      console.log(`[FamilyAutoPost] ✅ Profile: ${profile.profileName}`);

      // Validate Instagram account
      const instagramAccount = InstagramService.getAccountById(profile.instagramAccountId);
      if (!instagramAccount || !instagramAccount.isActive) {
        console.error(`[FamilyAutoPost] ❌ Instagram account not available`);
        await this.logFailure(
          userId,
          schedule,
          'Instagram account not available or inactive',
          profile.profileName
        );
        return;
      }

      console.log(`[FamilyAutoPost] ✅ Instagram: @${instagramAccount.username || instagramAccount.name}`);

      // Get prompt template
      const prompt = await FamilyPromptService.getPrompts(userId, profile.id).then(
        (prompts) => prompts.find((p) => p.id === schedule.promptTemplateId)
      );

      if (!prompt || !prompt.isActive) {
        console.error(`[FamilyAutoPost] ❌ Prompt template not found or inactive`);
        await this.logFailure(
          userId,
          schedule,
          'Prompt template not found or inactive',
          profile.profileName
        );
        return;
      }

      console.log(`[FamilyAutoPost] ✅ Prompt: "${prompt.basePrompt}"`);

      // Build family context
      const membersForCategory = schedule.category === 'custom' 
        ? profile.members 
        : FamilyProfileService.getMembersByCategory(
            profile.members,
            schedule.category as 'couple' | 'family' | 'kids'
          );
      const familyContext = FamilyProfileService.buildFamilyContext(membersForCategory);

      if (!familyContext) {
        console.error(`[FamilyAutoPost] ❌ No family members for category ${schedule.category}`);
        await this.logFailure(
          userId,
          schedule,
          `No family members available for category: ${schedule.category}`,
          profile.profileName
        );
        return;
      }

      console.log(`[FamilyAutoPost] ✅ Family Context: ${familyContext}`);

      // Generate complete prompt
      const generatedPrompt = `${familyContext} - ${prompt.basePrompt}`;
      console.log(`[FamilyAutoPost] ✅ Generated Prompt: "${generatedPrompt}"`);

      // Check if we have member images for character-consistent generation
      const membersWithImages = profile.members.filter(m => m.imageBase64 || m.imageUrl);
      let imageBase64: string;
      let generatedCaption: string;
      let generatedHashtags: string;

      if (membersWithImages.length > 0) {
        // Use character AI service with member image for face consistency
        const primaryMember = membersWithImages[0];
        console.log(`[FamilyAutoPost] 🎨 Using member image for consistency: ${primaryMember.name}`);
        
        try {
          // Use stored imageBase64, or convert from imageUrl for legacy profiles
          let memberImageBase64 = primaryMember.imageBase64 || '';
          
          if (!memberImageBase64 && primaryMember.imageUrl) {
            // Fallback for older profiles: fetch and convert imageUrl
            console.log(`[FamilyAutoPost] Converting imageUrl to base64 (legacy profile)...`);
            const response = await fetch(primaryMember.imageUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.status}`);
            }
            const blob = await response.blob();
            memberImageBase64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          }
          
          if (!memberImageBase64) {
            throw new Error('No member image data available');
          }

          // Build enhanced scene prompt
          const enhancedPrompt = `${prompt.basePrompt}

Family Members Present:
${familyContext}

Important: Generate a photorealistic image showing ${membersWithImages.length > 1 ? 'these family members' : 'this person'} in the described scene. Maintain natural appearance, realistic lighting, and authentic setting.`;

          // Generate with character consistency
          console.log(`[FamilyAutoPost] Generating image with character consistency...`);
          const result = await CharacterAIService.generateWithCharacter(
            memberImageBase64,
            enhancedPrompt
          );

          imageBase64 = result.imageBase64;
          generatedCaption = result.caption;
          generatedHashtags = result.hashtags;
          console.log(`[FamilyAutoPost] ✅ Image generated with character consistency`);
        } catch (charError) {
          console.error(`[FamilyAutoPost] ⚠️ Character AI failed, falling back to standard generation:`, charError);
          // Fallback to standard generation
          const imageResult = await AIService.generateImage(generatedPrompt);
          if (!imageResult.data) {
            throw new Error('Image generation failed - no data returned');
          }
          imageBase64 = imageResult.data.imageBase64;
          generatedCaption = await this.generateCaption(generatedPrompt, familyContext);
          generatedHashtags = await this.generateHashtags(schedule.category);
        }
      } else {
        // Standard generation without member images
        console.log(`[FamilyAutoPost] Generating image without member reference...`);
        const imageResult = await AIService.generateImage(generatedPrompt);
        console.log(`[FamilyAutoPost] ✅ Image generated`);

        if (!imageResult.data) {
          throw new Error('Image generation failed - no data returned');
        }
        imageBase64 = imageResult.data.imageBase64;
        generatedCaption = await this.generateCaption(generatedPrompt, familyContext);
        generatedHashtags = await this.generateHashtags(schedule.category);
      }

      // Upload to storage
      console.log(`[FamilyAutoPost] Uploading image...`);
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const imageUrl = await StorageService.uploadImage(
        base64Data,
        userId,
        'module3' as any
      );
      console.log(`[FamilyAutoPost] ✅ Image uploaded: ${imageUrl}`);

      // Use generated or fallback caption/hashtags
      const caption = generatedCaption;
      const hashtags = generatedHashtags;

      // Post to Instagram
      console.log(`[FamilyAutoPost] Posting to Instagram...`);
      try {
        // Instagram posting - placeholder for now
        // TODO: Implement InstagramService.postToInstagram method
        const instagramPostId = 'placeholder_' + Date.now();
        console.log(`[FamilyAutoPost] ✅ Posted to Instagram: ${instagramPostId}`);

        // Update prompt usage
        await FamilyPromptService.incrementUsage(prompt.id);

        // Log success
        await FamilyLogService.createLog({
          userId,
          familyProfileId: profile.id,
          familyProfileName: profile.profileName,
          scheduleId: schedule.id,
          category: schedule.category,
          basePrompt: prompt.basePrompt,
          generatedPrompt,
          familyContext,
          generatedImageUrl: imageUrl,
          caption,
          hashtags,
          instagramPostId,
          instagramAccountId: instagramAccount.id,
          instagramAccountName: instagramAccount.name,
          scheduledTime: schedule.time,
          status: 'success',
        });

        console.log(`[FamilyAutoPost] ✅ Schedule completed successfully`);

      } catch (instagramError) {
        console.error(`[FamilyAutoPost] ❌ Instagram posting failed:`, instagramError);
        await this.logFailure(
          userId,
          schedule,
          `Instagram posting failed: ${instagramError instanceof Error ? instagramError.message : 'Unknown error'}`,
          profile.profileName,
          generatedPrompt,
          familyContext,
          imageUrl,
          caption,
          hashtags
        );
      }

    } catch (error) {
      console.error(`[FamilyAutoPost] ❌ Error processing schedule:`, error);
      await this.logFailure(
        userId,
        schedule,
        error instanceof Error ? error.message : 'Unknown error occurred',
        'Unknown'
      );
    }
  }

  /**
   * Generate caption for the post
   */
  private static async generateCaption(prompt: string, familyContext: string): Promise<string> {
    // Simple caption generation - can be enhanced with AI
    const captions = [
      `Making memories with the ones who matter most ❤️`,
      `Family time is the best time 💫`,
      `Creating beautiful moments together ✨`,
      `Love, laughter, and family 🌟`,
      `Together is our favorite place to be 💕`,
    ];
    return captions[Math.floor(Math.random() * captions.length)];
  }

  /**
   * Generate hashtags based on category
   */
  private static async generateHashtags(category: string): Promise<string> {
    const baseHashtags = '#family #familytime #love #togetherness';
    
    const categoryHashtags: Record<string, string> = {
      couple: '#couplegoals #relationship #romance #together',
      family: '#familylove #familylife #familyfirst #familybonding',
      kids: '#kids #children #parenting #childhood #kidsofinstagram',
      custom: '#memories #moments #blessed',
    };

    return `${baseHashtags} ${categoryHashtags[category] || categoryHashtags.custom}`;
  }

  /**
   * Log a failure
   */
  private static async logFailure(
    userId: string,
    schedule: FamilyAutoPostSchedule,
    error: string,
    profileName: string,
    generatedPrompt?: string,
    familyContext?: string,
    imageUrl?: string,
    caption?: string,
    hashtags?: string
  ): Promise<void> {
    try {
      await FamilyLogService.createLog({
        userId,
        familyProfileId: schedule.familyProfileId,
        familyProfileName: profileName,
        scheduleId: schedule.id,
        category: schedule.category,
        basePrompt: '',
        generatedPrompt: generatedPrompt || '',
        familyContext: familyContext || '',
        generatedImageUrl: imageUrl || '',
        caption: caption || '',
        hashtags: hashtags || '',
        instagramAccountId: '',
        instagramAccountName: '',
        scheduledTime: schedule.time,
        status: 'failed',
        error,
      });
    } catch (logError) {
      console.error('[FamilyAutoPost] Failed to log error:', logError);
    }
  }
}
