import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { APIBook } from '@/lib/firebase/services';
import { unifiedImageGeneration } from '@/lib/services/image-generation';
import { UnifiedVideoGenerationService } from '@/lib/services/video-generation/unified-video-generation.service';
import { UserPreferencesService } from '@/lib/firebase/services/user-preferences.service';
import { UnifiedImageStorageService } from '@/lib/services/unified/image-storage.service';
import { VideoStorageService } from '@/lib/services/video-storage.service';
import { getModelById } from '@/lib/services/image-generation/model-registry';
import { MotivationalBlogGeneratorService } from '@/lib/services/module9/motivational-blog-generator.service';

/**
 * Manual Motivational Quote Generator API
 * Similar to character generation but for motivational quotes
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { category, style, contentType, language } = body;

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
    const textToImageModel = moduleAIConfig?.textToImageModel || globalPreferences?.textToImageModel;
    const textToVideoModel = moduleAIConfig?.textToVideoModel || globalPreferences?.textToVideoModel;

    // Get recent quotes to avoid duplication
    const recentLogs = await APIBook.motivationalAutoPostLog.getRecentLogs(user.uid, undefined, 20);
    const recentQuotes = recentLogs.filter((log): log is string => typeof log === 'string' && !!log);

    
    // Generate unique quote
    const quoteData = await APIBook.motivationalPromptRefiner.generateUniqueQuote({
      category,
      themeDescription: `${category.charAt(0).toUpperCase() + category.slice(1)} quotes in ${style} style`,
      contentType: contentType as 'image' | 'video',
      style,
      language: language || 'english', // Default to English if not specified
      recentQuotes,
    });

    // ═══ TEXT SANITIZER ═══
    // Strip markdown + fix common AI text hallucinations
    let cleanQuoteText = quoteData.quoteText
      .replace(/\*\*/g, '')   // Remove **
      .replace(/__/g, '')       // Remove __
      .replace(/\*/g, '')      // Remove *
      .replace(/_/g, '')        // Remove _
      .trim();
    
    // Fix AI text hallucination patterns
    cleanQuoteText = cleanQuoteText
      .replace(/\b(will)\s+ill\b/gi, 'will be')        // "will ill" -> "will be"
      .replace(/\b(the)\s+\1\b/gi, '$1')                // "the the" -> "the"
      .replace(/\b(is)\s+\1\b/gi, '$1')                  // "is is" -> "is"
      .replace(/\b(to)\s+\1\b/gi, '$1')                  // "to to" -> "to"
      .replace(/\b(a)\s+\1\b/gi, '$1')                    // "a a" -> "a"
      .replace(/\b(in)\s+\1\b/gi, '$1')                  // "in in" -> "in"
      .replace(/\b(of)\s+\1\b/gi, '$1')                  // "of of" -> "of"
      .replace(/\b(and)\s+\1\b/gi, '$1')                // "and and" -> "and"
      .replace(/[<>]/g, '')                                // Remove stray < > characters
      .replace(/\s{2,}/g, ' ')                             // Collapse multiple spaces
      .trim();
    
    // Ensure proper quote marks (remove mismatched/extra ones)
    cleanQuoteText = cleanQuoteText
      .replace(/^["\u201C\u201D]+/, '')   // Remove leading quotes
      .replace(/["\u201C\u201D]+$/, '')   // Remove trailing quotes
      .trim();
    
    // Capitalize first letter
    cleanQuoteText = cleanQuoteText.charAt(0).toUpperCase() + cleanQuoteText.slice(1);
    
    quoteData.quoteText = cleanQuoteText;

    let mediaUrl: string;
    let mediaType: 'image' | 'video' = contentType;

    // Extract background/mood keywords from visual prompt (strip text instructions)
    // Used by both image and video generation
    const bgKeywords = (quoteData.visualPrompt || '')
      .replace(/text|font|typography|display|quote|word|character|letter|spelling/gi, '')
      .split('.').slice(0, 3).join('.').trim();

    // Generate media based on content type
    if (contentType === 'image') {
      
      // Determine provider from model
      let provider: 'gemini' | 'kieai' | undefined;
      if (textToImageModel) {
        const modelInfo = getModelById(textToImageModel);
        provider = modelInfo?.provider;
      }
      
      // ═══ SIMPLIFIED IMAGE PROMPT ═══
      // Key insight: Shorter prompts = better text accuracy from AI image generators
      // Long prompts cause the model to hallucinate characters (<, extra quotes, misspellings)
      
      const explicitPrompt = `EXACT TEXT on image: "${cleanQuoteText}"

Rules: Bold white text, centered, dark moody background. ${bgKeywords || 'Cinematic lighting, 35mm film grain, dark atmosphere.'} No extra characters. No quotation marks around text. Spell every word exactly as given.`;
      
      // Generate image using unified service with specific model/provider
      const result = await unifiedImageGeneration.generateImage({
        prompt: explicitPrompt,
        quality: 'high',
        imageSize: 'square_hd',
        model: textToImageModel,
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

      // Upload to Firebase
      const uploadResult = await UnifiedImageStorageService.uploadImage(
        result.imageBase64,
        user.uid,
        'module9/manual-quotes',
        `quote_${Date.now()}`
      );
      
      mediaUrl = uploadResult.imageUrl;
      
    } else {
      
      // Simplified video prompt
      const explicitVideoPrompt = `EXACT TEXT: "${cleanQuoteText}"

Bold white text, centered, dark cinematic background. Word-by-word reveal animation. ${bgKeywords || 'Moody atmosphere, volumetric fog.'} Spell every word exactly.`;
      
      const videoService = new UnifiedVideoGenerationService();
      const videoResult = await videoService.generateVideo({
        prompt: explicitVideoPrompt,
        model: textToVideoModel,
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
      
    }

    // Create caption with TITLE only (quote is on the image)
    const hashtags = quoteData.suggestedHashtags || '#motivation #inspiration #quotes #motivationalquotes #success #mindset #positivevibes';
    const caption = `${quoteData.title}${quoteData.author ? `\n— ${quoteData.author}` : ''}\n\n${hashtags}`;  

    // Generate blog content
    const blogContent = await MotivationalBlogGeneratorService.generateBlogContent({
      quoteText: quoteData.quoteText,
      author: quoteData.author,
      profession: quoteData.profession,
      category,
      subcategories: quoteData.subcategories || [quoteData.subcategory],
      language,
    });

    const duration = Date.now() - startTime;

    // Save to log for tracking and future deduplication
    try {
      await APIBook.motivationalAutoPostLog.createLog({
        userId: user.uid,
        accountId: 'manual', // Special account ID for manual generations
        category, // Save category
        subcategory: quoteData.subcategory || '', // Save primary subcategory
        subcategories: quoteData.subcategories || [], // Save all subcategories
        style,
        contentType: mediaType, // Save content type (image or video)
        language: language || 'english', // Save language
        quoteText: quoteData.quoteText,
        author: quoteData.author || '', // Save author (empty string if none)
        profession: quoteData.profession || '', // Save profession (empty string if none)
        generatedPrompt: quoteData.visualPrompt,
        mediaUrl,
        caption,
        blogContent: blogContent.htmlContent,
        status: 'success',
      });
    } catch (logError) {
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      data: {
        quoteText: quoteData.quoteText,
        author: quoteData.author,
        visualPrompt: quoteData.visualPrompt,
        mediaUrl,
        mediaType,
        caption,
        category, // Include in response
        subcategories: quoteData.subcategories || [], // Include subcategories
        language: language || 'english', // Include in response
        // Include blog content for preview/display
        blogContent: blogContent.htmlContent,
      },
      duration: `${duration}ms`,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate quote',
      details: error instanceof Error ? error.message : String(error),
      duration: `${duration}ms`,
    }, { status: 500 });
  }
}
