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
    profileId: string,
    scheduledTime: string
  ): Promise<boolean> {
    const logs = await FamilyLogService.getUserLogs(userId, 10);
    
    if (logs.length === 0) {
      return false;
    }

    const currentTime = new Date();
    
    // Check if any log exists for this profile in the current hour
    return logs.some((log) => {
      const logTime = new Date(log.executedAt);
      return (
        log.familyProfileId === profileId &&
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

      // Get current time in HH:mm format
      const hours = currentTime.getHours().toString().padStart(2, '0');
      const minutes = currentTime.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}`;
      
      console.log(`[FamilyAutoPost] Current Time String: ${currentTimeStr}`);

      // Get all active family profiles for this user
      const profiles = await FamilyProfileService.getUserProfiles(userId);
      const activeProfiles = profiles.filter(p => 
        p.isActive && 
        p.postingTimes && 
        p.postingTimes.includes(currentTimeStr)
      );

      if (activeProfiles.length === 0) {
        console.log(`[FamilyAutoPost] ⚠️ No active profiles with posting time ${currentTimeStr} for user ${userId}`);
        return;
      }

      console.log(`[FamilyAutoPost] Found ${activeProfiles.length} profile(s) scheduled for ${currentTimeStr}`);

      // Process each profile
      for (const profile of activeProfiles) {
        await this.processProfile(userId, profile, currentTimeStr);
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
   * Process a single profile
   */
  private static async processProfile(
    userId: string,
    profile: FamilyProfile,
    scheduledTime: string
  ): Promise<void> {
    try {
      console.log(`[FamilyAutoPost] Processing profile: ${profile.profileName} (${profile.id})...`);

      // Check if already executed this hour
      const alreadyExecuted = await this.wasExecutedThisHour(
        userId,
        profile.id,
        scheduledTime
      );

      if (alreadyExecuted) {
        console.log(`[FamilyAutoPost] ⚠️ Profile already posted this hour - SKIPPING`);
        return;
      }

      // Validate Instagram account
      const instagramAccount = InstagramService.getAccountById(profile.instagramAccountId);
      if (!instagramAccount || !instagramAccount.isActive) {
        console.error(`[FamilyAutoPost] ❌ Instagram account not available`);
        await this.logFailure(
          userId,
          profile.id,
          scheduledTime,
          'Instagram account not available or inactive',
          profile.profileName
        );
        return;
      }

      console.log(`[FamilyAutoPost] ✅ Instagram: @${instagramAccount.username || instagramAccount.name}`);

      // Get a random prompt (prompts are now dynamic, no schedule needed)
      const allPrompts = await FamilyPromptService.getPrompts(userId, profile.id);
      const activePrompts = allPrompts.filter(p => p.isActive);

      if (activePrompts.length === 0) {
        console.error(`[FamilyAutoPost] ❌ No active prompts found`);
        await this.logFailure(
          userId,
          profile.id,
          scheduledTime,
          'No active prompts found. Please add prompts in the Family Auto Poster settings.',
          profile.profileName
        );
        return;
      }

      // Select a random prompt
      const prompt = activePrompts[Math.floor(Math.random() * activePrompts.length)];
      console.log(`[FamilyAutoPost] ✅ Selected Prompt: "${prompt.basePrompt}"`);

      // Build family context from all members
      const familyContext = FamilyProfileService.buildFamilyContext(profile.members);

      if (!familyContext) {
        console.error(`[FamilyAutoPost] ❌ No family members available`);
        await this.logFailure(
          userId,
          profile.id,
          scheduledTime,
          'No family members available in profile',
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
          generatedHashtags = await this.generateHashtags(prompt.category);
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
        generatedHashtags = await this.generateHashtags(prompt.category);
      }

      // Upload to storage
      console.log(`[FamilyAutoPost] Uploading image...`);
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const imageUrl = await StorageService.uploadImage(
        base64Data,
        userId,
        'module4'
      );
      console.log(`[FamilyAutoPost] ✅ Image uploaded: ${imageUrl}`);

      // Use generated or fallback caption/hashtags
      const caption = generatedCaption;
      const hashtags = generatedHashtags;

      // Post to Instagram
      console.log(`[FamilyAutoPost] Posting to Instagram...`);
      try {
        const instagramPostId = await InstagramService.postImage(
          imageUrl,
          `${caption}\n\n${hashtags}`,
          profile.instagramAccountId
        );
        console.log(`[FamilyAutoPost] ✅ Posted to Instagram: ${instagramPostId}`);

        // Update prompt usage
        await FamilyPromptService.incrementUsage(prompt.id);

        // Log success
        await FamilyLogService.createLog({
          userId,
          familyProfileId: profile.id,
          familyProfileName: profile.profileName,
          scheduleId: profile.id, // Use profile ID as schedule ID
          category: prompt.category,
          basePrompt: prompt.basePrompt,
          generatedPrompt,
          familyContext,
          generatedImageUrl: imageUrl,
          caption,
          hashtags,
          instagramPostId,
          instagramAccountId: instagramAccount.id,
          instagramAccountName: instagramAccount.name,
          scheduledTime: scheduledTime,
          status: 'success',
        });

        console.log(`[FamilyAutoPost] ✅ Profile completed successfully`);

      } catch (instagramError) {
        console.error(`[FamilyAutoPost] ❌ Instagram posting failed:`, instagramError);
        await this.logFailure(
          userId,
          profile.id,
          scheduledTime,
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
      console.error(`[FamilyAutoPost] ❌ Error processing profile:`, error);
      await this.logFailure(
        userId,
        profile.id,
        scheduledTime,
        error instanceof Error ? error.message : 'Unknown error occurred',
        profile.profileName
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
    profileId: string,
    scheduledTime: string,
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
        familyProfileId: profileId,
        familyProfileName: profileName,
        scheduleId: profileId, // Use profile ID as schedule ID
        category: 'family', // Default category
        basePrompt: '',
        generatedPrompt: generatedPrompt || '',
        familyContext: familyContext || '',
        generatedImageUrl: imageUrl || '',
        caption: caption || '',
        hashtags: hashtags || '',
        instagramAccountId: '',
        instagramAccountName: '',
        scheduledTime: scheduledTime,
        status: 'failed',
        error,
      });
    } catch (logError) {
      console.error('[FamilyAutoPost] Failed to log error:', logError);
    }
  }
}
