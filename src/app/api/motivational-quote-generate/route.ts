import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { APIBook } from '@/lib/firebase/services';
import { unifiedImageGeneration } from '@/lib/services/image-generation';
import { UnifiedVideoGenerationService } from '@/lib/services/video-generation/unified-video-generation.service';
import { UserPreferencesService } from '@/lib/firebase/services/user-preferences.service';
import { UnifiedImageStorageService } from '@/lib/services/unified/image-storage.service';
import { VideoStorageService } from '@/lib/services/video-storage.service';
import { getModelById } from '@/lib/services/image-generation/model-registry';

/**
 * Manual Motivational Quote Generator API
 * Similar to character generation but for motivational quotes
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log(`[Manual Quote Generator] ===== NEW REQUEST =====`);

  try {
    // Get authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { category, style, contentType } = body;

    console.log(`[Manual Quote Generator] User: ${user.uid}`);
    console.log(`[Manual Quote Generator] Category: ${category}, Style: ${style}, Type: ${contentType}`);

    // Validate inputs
    if (!category || !style || !contentType) {
      return NextResponse.json({ 
        error: 'Missing required fields: category, style, contentType' 
      }, { status: 400 });
    }

    // Get module-specific AI config (for motivational quotes)
    const moduleConfig = await APIBook.motivationalAutoPostConfig.getConfig(user.uid);
    const moduleAIConfig = moduleConfig?.aiModelConfig;

    // Get global user preferences (fallback)
    const preferencesResponse = await UserPreferencesService.getPreferences(user.uid);
    const globalPreferences = preferencesResponse.data;

    // Determine which models to use (module-specific > global)
    const imageModel = moduleAIConfig?.textToImageModel || globalPreferences?.textToImageModel;
    const videoModel = moduleAIConfig?.textToVideoModel || globalPreferences?.textToVideoModel;

    console.log(`🔧 [AI Models] Image: ${imageModel || 'default'} | Video: ${videoModel || 'default'}`);
    console.log(`   Source: ${moduleAIConfig?.textToImageModel ? 'Module-specific' : 'Global settings'}`);

    // Get recent quotes to avoid duplication
    const recentLogs = await APIBook.motivationalAutoPostLog.getRecentLogs(user.uid, undefined, 20);
    const recentQuotes = recentLogs.filter((log): log is string => typeof log === 'string' && !!log);

    console.log(`📝 Generating unique quote...`);
    
    // Generate unique quote
    const quoteData = await APIBook.motivationalPromptRefiner.generateUniqueQuote({
      category,
      themeDescription: `${category.charAt(0).toUpperCase() + category.slice(1)} quotes in ${style} style`,
      contentType: contentType as 'image' | 'video',
      style,
      recentQuotes,
    });

    console.log(`✨ Quote generated: "${quoteData.quoteText.substring(0, 60)}..."`);

    let mediaUrl: string;
    let mediaType: 'image' | 'video' = contentType;

    // Generate media based on content type
    if (contentType === 'image') {
      console.log(`📸 Generating image with model: ${imageModel || 'default'}...`);
      
      // Determine provider from model
      let provider: 'gemini' | 'kieai' | undefined;
      if (imageModel) {
        const modelInfo = getModelById(imageModel);
        provider = modelInfo?.provider;
      }
      
      // Generate image using unified service with specific model/provider
      const result = await unifiedImageGeneration.generateImage({
        prompt: quoteData.visualPrompt,
        quality: 'high',
        imageSize: 'square_hd',
        model: imageModel,
      }, provider);
      
      if (!result.imageBase64) {
        return NextResponse.json({
          success: false,
          error: 'Image generation failed',
          details: 'AI returned no image data',
          quoteData: {
            quoteText: quoteData.quoteText,
            author: quoteData.author,
            visualPrompt: quoteData.visualPrompt,
          }
        }, { status: 500 });
      }

      console.log(`✅ Image generated successfully with ${result.provider}`);

      // Upload to Firebase
      console.log(`📤 Uploading to Firebase Storage...`);
      const uploadResult = await UnifiedImageStorageService.uploadImage(
        result.imageBase64,
        user.uid,
        'module9/manual-quotes',
        `quote_${Date.now()}`
      );
      
      mediaUrl = uploadResult.imageUrl;
      console.log(`✅ Image uploaded: ${mediaUrl.substring(0, 80)}...`);
      
    } else {
      console.log(`🎬 Generating video with model: ${videoModel || 'default'}...`);
      
      const videoService = new UnifiedVideoGenerationService();
      const videoResult = await videoService.generateVideo({
        prompt: quoteData.visualPrompt,
        model: videoModel,
        duration: '5',
        aspectRatio: '1:1',
      });

      if (!videoResult.videoUrl) {
        throw new Error('Failed to generate video');
      }

      // Upload to Firebase
      mediaUrl = await VideoStorageService.uploadVideoFromUrl(
        videoResult.videoUrl,
        user.uid,
        'module9'
      );
      
      console.log(`✅ Video uploaded: ${mediaUrl.substring(0, 80)}...`);
    }

    // Create caption
    const caption = `${quoteData.title}\n\n${quoteData.author ? `— ${quoteData.author}` : ''}\n\n#motivation #inspiration #quotes #motivationalquotes #success #mindset #positivevibes`;

    const duration = Date.now() - startTime;
    console.log(`[Manual Quote Generator] ===== COMPLETED in ${duration}ms =====`);

    return NextResponse.json({
      success: true,
      data: {
        quoteText: quoteData.quoteText,
        author: quoteData.author,
        visualPrompt: quoteData.visualPrompt,
        mediaUrl,
        mediaType,
        caption,
      },
      duration: `${duration}ms`,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [Manual Quote Generator] Error (${duration}ms):`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate quote',
      details: error instanceof Error ? error.message : String(error),
      duration: `${duration}ms`,
    }, { status: 500 });
  }
}
