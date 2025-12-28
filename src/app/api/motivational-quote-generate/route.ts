import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { APIBook } from '@/lib/firebase/services';
import { unifiedImageGeneration } from '@/lib/services/image-generation';
import { UnifiedVideoGenerationService } from '@/lib/services/video-generation/unified-video-generation.service';
import { UserPreferencesService } from '@/lib/firebase/services/user-preferences.service';
import { UnifiedImageStorageService } from '@/lib/services/unified/image-storage.service';
import { VideoStorageService } from '@/lib/services/video-storage.service';

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

    // Get user preferences
    const preferencesResponse = await UserPreferencesService.getPreferences(user.uid);
    const userPreferences = preferencesResponse.data;

    let mediaUrl: string;
    let mediaType: 'image' | 'video' = contentType;

    // Generate media based on content type
    if (contentType === 'image') {
      console.log(`📸 Generating image with AI settings...`);
      
      // Use AIService which properly handles model selection from user preferences
      const response = await APIBook.ai.generateImage(quoteData.visualPrompt);
      
      if (!response.success || !response.data) {
        return NextResponse.json({
          success: false,
          error: 'Image generation failed',
          details: response.error || 'AI returned no data',
          quoteData: {
            quoteText: quoteData.quoteText,
            author: quoteData.author,
            visualPrompt: quoteData.visualPrompt,
          }
        }, { status: 500 });
      }

      const imageBase64 = response.data.imageBase64;
      console.log(`✅ Image generated successfully with ${response.data.provider}`);

      // Upload to Firebase
      console.log(`📤 Uploading to Firebase Storage...`);
      const uploadResult = await UnifiedImageStorageService.uploadImage(
        imageBase64,
        user.uid,
        'module9/manual-quotes',
        `quote_${Date.now()}`
      );
      
      mediaUrl = uploadResult.imageUrl;
      console.log(`✅ Image uploaded: ${mediaUrl.substring(0, 80)}...`);
      
    } else {
      console.log(`🎬 Generating video...`);
      
      const videoService = new UnifiedVideoGenerationService();
      const videoResult = await videoService.generateVideo({
        prompt: quoteData.visualPrompt,
        model: userPreferences?.textToVideoModel,
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
