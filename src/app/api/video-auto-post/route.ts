import { NextRequest, NextResponse } from 'next/server';
import { APIBook } from '@/lib/firebase/services';
import { Module8PromptGenerator } from '@/lib/services/module8/video-prompt-generator.service';
import { unifiedVideoGeneration } from '@/lib/services/video-generation/unified-video-generation.service';
import { InstagramService } from '@/lib/services/instagram.service';
import type { VideoGenerationOptions } from '@/lib/services/video-generation/base.provider';

// Maximum timeout for Vercel (5 minutes)
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { authToken } = body;
    
    // Validate auth token
    if (authToken !== 'autogram-auto-post-secret-2024') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { 
      userId, 
      promptId, 
      videoType, 
      basePrompt, 
      characterId, 
      assignedAccountId,
      scheduledTime 
    } = body;

    // 1. Generate unique prompt variation using AI
    const context = {
      timeOfDay: scheduledTime,
      season: getCurrentSeason(),
      recentPrompts: await getRecentPrompts(userId),
      videoType,
      characterName: characterId ? await getCharacterName(characterId) : undefined,
    };
    
    const promptVariation = await Module8PromptGenerator.generateUniquePrompt(
      basePrompt,
      context
    );

    // 2. Generate video
    let videoOptions: VideoGenerationOptions = {
      prompt: promptVariation,
      aspectRatio: '9:16', // Instagram Reels format
      duration: '10', // Changed to 10 seconds (universally supported)
      userId, // Pass userId to load AI settings
    };

    // For image-to-video, get character image
    if (videoType === 'image-to-video' && characterId) {
      const character = await APIBook.character.getCharacter(characterId);
      if (character?.imageUrl) {
        videoOptions.imageUrl = character.imageUrl;
      } else {
      }
    }

    
    const videoResult = await unifiedVideoGeneration.generateVideo(videoOptions);
    
    if (!videoResult.videoUrl) {
      throw new Error('Video generation failed - no video URL returned');
    }

    // 3. IMMEDIATELY SAVE VIDEO to Firestore (before Instagram posting)
    // This ensures we don't lose videos if Instagram posting times out or fails
    const logData: Record<string, unknown> = {
      userId,
      videoPromptId: promptId,
      videoType,
      basePrompt,
      generatedPrompt: promptVariation,
      generatedVideoUrl: videoResult.videoUrl,
      caption: promptVariation,
      hashtags: '#AI #Video #Autogram',
      instagramAccountId: assignedAccountId,
      instagramAccountName: await getAccountName(assignedAccountId),
      scheduledTime,
      executedAt: new Date().toISOString(),
      status: 'video_generated', // Initial status: video ready but not posted yet
      model: videoResult.model,
    };

    // Only include characterId and characterName if they have values
    if (characterId) {
      logData.characterId = characterId;
      logData.characterName = await getCharacterName(characterId);
    }

    // Save video log immediately
    const logId = await APIBook.videoAutoPostLog.createLog(logData as any);

    // 4. Now try to post to Instagram
    let instagramResult: string | undefined;
    let finalStatus = 'video_generated';
    
    try {
      instagramResult = await InstagramService.postImage(
        videoResult.videoUrl,
        promptVariation,
        assignedAccountId,
        true // isVideo flag for Instagram REELS
      );

      if (instagramResult) {
        finalStatus = 'success';
        
        // Update log with Instagram post ID
        await APIBook.videoAutoPostLog.updateLog(logId, {
          instagramPostId: instagramResult,
          status: 'success',
        });
      }
    } catch (instagramError) {
      finalStatus = 'instagram_failed';
      
      // Update log with error but keep the video
      await APIBook.videoAutoPostLog.updateLog(logId, {
        status: 'instagram_failed',
        error: instagramError instanceof Error ? instagramError.message : 'Instagram posting failed',
      });
    }

    // 5. Update prompt usage
    await APIBook.videoPromptLibrary.incrementUsageCount(promptId);

    return NextResponse.json({
      success: true,
      message: 'Video auto-post completed successfully',
      data: {
        promptId,
        videoUrl: videoResult.videoUrl,
        instagramPostId: instagramResult,
        generatedPrompt: promptVariation,
      }
    });

  } catch (error) {
    
    // Log failed attempt
    try {
      const body = await req.json();
      
      // Build error log object conditionally - Firestore doesn't allow undefined values
      const errorLogData: Record<string, unknown> = {
        userId: body.userId,
        videoPromptId: body.promptId,
        videoType: body.videoType,
        basePrompt: body.basePrompt,
        generatedPrompt: body.basePrompt,
        generatedVideoUrl: '',
        caption: '',
        hashtags: '',
        instagramAccountId: body.assignedAccountId,
        instagramAccountName: await getAccountName(body.assignedAccountId),
        scheduledTime: body.scheduledTime,
        executedAt: new Date().toISOString(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      // Only include characterId and characterName if they have values
      if (body.characterId) {
        errorLogData.characterId = body.characterId;
        errorLogData.characterName = await getCharacterName(body.characterId);
      }

      await APIBook.videoAutoPostLog.createLog(errorLogData as any);
    } catch (logError) {
    }

    return NextResponse.json(
      { 
        error: 'Video auto-post failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper functions
function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

async function getRecentPrompts(userId: string): Promise<string[]> {
  try {
    const logs = await APIBook.videoAutoPostLog.getLogsByUserId(userId, 20);
    return logs
      .slice(0, 10) // Last 10 posts for better variety
      .map(log => log.generatedPrompt)
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

async function getCharacterName(characterId: string): Promise<string | undefined> {
  try {
    const character = await APIBook.character.getCharacter(characterId);
    return character?.name;
  } catch (error) {
    return undefined;
  }
}

async function getAccountName(accountId: string): Promise<string> {
  try {
    const account = InstagramService.getAccountById(accountId);
    return account?.name || account?.username || accountId;
  } catch (error) {
    return accountId;
  }
}