import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { APIBook } from '@/lib/firebase/services';
import { unifiedImageGeneration } from '@/lib/services/image-generation';
import { UnifiedVideoGenerationService } from '@/lib/services/video-generation/unified-video-generation.service';
import { UserPreferencesService } from '@/lib/firebase/services/user-preferences.service';
import { UnifiedImageStorageService } from '@/lib/services/unified/image-storage.service';
import { VideoStorageService } from '@/lib/services/video-storage.service';
import { InstagramService } from '@/lib/services/instagram.service';
import { getModelById } from '@/lib/services/image-generation/model-registry';
import { MotivationalBlogGeneratorService } from '@/lib/services/module9/motivational-blog-generator.service';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://autogram-orpin.vercel.app';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body = await request.json();

    const { userId, scheduledTime, authToken, accountId, category, style, contentType } = body;

    // Validate auth token if provided (from Firebase Functions)
    const expectedToken = process.env.AUTO_POST_SECRET_TOKEN || 'autogram-auto-post-secret-2024';
    
    let effectiveUserId: string;

    if (authToken) {
      
      if (authToken !== expectedToken) {
        return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
      }

      // Using userId from request body (from Firebase Functions)
      if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
      }
      effectiveUserId = userId;
    } else {
      // Using authenticated user (from web app)
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      effectiveUserId = user.uid;
    }

    // Get auto-post configuration
    const config = await APIBook.motivationalAutoPostConfig.getConfig(effectiveUserId);
    
    if (!config?.isEnabled || !config.accountConfigs || config.accountConfigs.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Auto-posting not enabled or no accounts configured' 
      });
    }

    const results = [];
    const startTime = Date.now();

    // When called from Firebase scheduler, only process the specific account
    // that was scheduled (identified by accountId + category in the payload).
    // Without this filter, ALL account configs get processed on every trigger,
    // causing multiple posts at a single scheduled time.
    let accountConfigsToProcess = config.accountConfigs;
    if (authToken && accountId) {
      const targetConfig = config.accountConfigs.find(
        (ac: any) => {
          // Match by accountId first
          if (ac.accountId !== accountId) return false;
          // If category was sent, also match by category (same account can have multiple categories)
          if (category && ac.category !== category) return false;
          return true;
        }
      );
      if (targetConfig) {
        accountConfigsToProcess = [targetConfig];
      } else {
        return NextResponse.json({
          success: false,
          error: `Account config not found for accountId: ${accountId}${category ? `, category: ${category}` : ''}`,
        }, { status: 404 });
      }
    }

    // Process each configured account
    for (const accountConfig of accountConfigsToProcess) {
      let logId: string = '';
      let quoteData: any = null;
      let firebaseMediaUrl: string | undefined = undefined;
      
      try {
        // Get Instagram account
        const instagramAccount = APIBook.instagram.getAccountById(accountConfig.accountId);

        if (!instagramAccount) {
          throw new Error(`Instagram account ${accountConfig.accountId} not found`);
        }

        // Check if it's time to post (based on current time and posting schedule)
        // Skip this check when called from the Firebase scheduler (authToken present)
        // because the scheduler already verified the posting time before calling this API.
        // Re-checking here causes silent failures due to cold start / network delays
        // (e.g., scheduler triggers at 20:00 but API processes at 20:01 -> mismatch).
        if (!authToken) {
          const currentHour = new Date().toLocaleString('en-US', { 
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          
          const shouldPost = accountConfig.postingTimes.some(time => time === currentHour.substring(0, 5));

          if (!shouldPost) {
            continue;
          }
        }

        // Create log entry
        logId = await APIBook.motivationalAutoPostLog.createLog({
          userId: effectiveUserId,
          accountId: accountConfig.accountId,
          category: accountConfig.category,
          subcategory: '', // Will be updated after quote generation
          style: accountConfig.style,
          contentType: accountConfig.contentType,
          language: accountConfig.language || 'english', // Default to English if not specified
          quoteText: '',
          author: '', // Initialize as empty string
          profession: '', // Initialize as empty string
          generatedPrompt: '',
          mediaUrl: '',
          caption: '',
          status: 'processing',
        });

        // Determine actual content type (for future 'both' support)
        const actualContentType: 'image' | 'video' = accountConfig.contentType as 'image' | 'video';

        // Get recent quotes to avoid duplication (last 50 for better variety)
        const recentLogs = await APIBook.motivationalAutoPostLog.getRecentLogs(
          effectiveUserId,
          accountConfig.accountId,
          50 // Increased to 50 to prevent quote repetition even with different backgrounds
        );
        const recentQuotes = recentLogs
          .filter((log): log is string => typeof log === 'string' && !!log);

        // Generate unique quote using AI based on category and style
        quoteData = await APIBook.motivationalPromptRefiner.generateUniqueQuote({
          category: accountConfig.category,
          themeDescription: `${accountConfig.category.charAt(0).toUpperCase() + accountConfig.category.slice(1)} quotes in ${accountConfig.style} style`,
          contentType: actualContentType,
          style: accountConfig.style,
          language: accountConfig.language || 'english', // Use account language preference
          recentQuotes,
        });

        // Additional safety check: Verify the generated quote is not an exact duplicate
        const isDuplicate = await APIBook.motivationalAutoPostLog.isQuoteDuplicate(
          effectiveUserId,
          quoteData.quoteText,
          accountConfig.accountId,
          30 // Check last 30 days
        );

        if (isDuplicate) {
          // Force retry with the duplicate added to avoidance list
          quoteData = await APIBook.motivationalPromptRefiner.generateUniqueQuote({
            category: accountConfig.category,
            themeDescription: `${accountConfig.category.charAt(0).toUpperCase() + accountConfig.category.slice(1)} quotes in ${accountConfig.style} style - MUST BE COMPLETELY DIFFERENT`,
            contentType: actualContentType,
            style: accountConfig.style,
            language: accountConfig.language || 'english',
            recentQuotes: [...recentQuotes, quoteData.quoteText, '__FORCE_UNIQUE__'],
          });
        }

        // Strip markdown formatting from quote text
        const cleanQuoteText = quoteData.quoteText
          .replace(/\*\*/g, '')  // Remove **
          .replace(/__/g, '')      // Remove __
          .replace(/\*/g, '')     // Remove *
          .replace(/_/g, '')       // Remove _
          .trim();
        
        quoteData.quoteText = cleanQuoteText;

        // Get module-specific AI config
        const moduleAIConfig = config.aiModelConfig;
        
        // Get global user preferences (fallback)
        const preferencesResponse = await UserPreferencesService.getPreferences(effectiveUserId);
        const globalPreferences = preferencesResponse.data;
        
        // Determine which models to use (module-specific > global)
        const imageModel = moduleAIConfig?.textToImageModel || globalPreferences?.textToImageModel;
        const videoModel = moduleAIConfig?.textToVideoModel || globalPreferences?.textToVideoModel;
        

        // Generate media (image or video) using unified services
        let mediaUrl: string;
        
        if (actualContentType === 'image') {
          
          // Determine provider from model
          let provider: 'gemini' | 'kieai' | undefined;
          if (imageModel) {
            const modelInfo = getModelById(imageModel);
            provider = modelInfo?.provider;
          }
          
          // Create explicit prompt with exact quote text
          const explicitPrompt = `CRITICAL: Display this EXACT text prominently on the image: "${cleanQuoteText}"\n\nStyle and composition: ${quoteData.visualPrompt}`;
          
          // Generate image using unified service with specific model/provider
          const result = await unifiedImageGeneration.generateImage({
            prompt: explicitPrompt,
            quality: 'high',
            imageSize: 'square_hd',
            model: imageModel,
          }, provider);
          
          if (!result.imageBase64) {
            throw new Error(`Image generation failed: No image data returned`);
          }

          
          try {
            // Upload to Firebase Storage (even if Instagram post fails later)
            const uploadResult = await UnifiedImageStorageService.uploadImage(
              result.imageBase64,
              effectiveUserId,
              'module9/generated-quotes',
              `quote_${Date.now()}`
            );
            
            firebaseMediaUrl = uploadResult.imageUrl;
            mediaUrl = uploadResult.imageUrl; // Use Firebase URL for Instagram
            
          } catch (uploadError) {
            throw new Error(`Firebase upload failed: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`);
          }
        } else {
          
          // Create explicit prompt with exact quote text for video
          const explicitVideoPrompt = `CRITICAL: Display this EXACT text prominently: "${cleanQuoteText}"\n\nStyle and motion: ${quoteData.visualPrompt}`;
          
          // Generate video using unified video generation service
          const videoService = new UnifiedVideoGenerationService();
          const videoResult = await videoService.generateVideo({
            prompt: explicitVideoPrompt,
            model: videoModel,
            duration: '5',
            aspectRatio: '1:1',
          });

          if (!videoResult.videoUrl) {
            throw new Error('Failed to generate video - no video URL returned');
          }

          
          // Upload video to Firebase Storage
          firebaseMediaUrl = await VideoStorageService.uploadVideoFromUrl(
            videoResult.videoUrl,
            effectiveUserId,
            'module9'
          );
          
          mediaUrl = firebaseMediaUrl; // Use Firebase URL for Instagram
          
        }

        // Create caption with TITLE only (quote is on the image)
        const hashtags = quoteData.suggestedHashtags || '#motivation #inspiration #quotes #motivationalquotes #success #mindset #positivevibes';
        
        // Build caption: title + author (if any) + hashtags
        let caption = `${quoteData.title}`;
        if (quoteData.author && quoteData.author.trim() !== '') {
          caption += `\n— ${quoteData.author}`;
        }
        caption += `\n\n${hashtags}`;

        // Post to Instagram using InstagramService directly
        
        let instagramPostId: string;
        try {
          instagramPostId = await InstagramService.postImage(
            mediaUrl,
            caption,
            instagramAccount.id,
            actualContentType === 'video' // isVideo flag
          );
        } catch (igError) {
          throw new Error(`Instagram posting failed: ${igError instanceof Error ? igError.message : String(igError)}`);
        }

        // Generate blog content
        const blogContent = await MotivationalBlogGeneratorService.generateBlogContent({
          quoteText: quoteData.quoteText,
          author: quoteData.author,
          profession: quoteData.profession,
          category: accountConfig.category,
          subcategories: quoteData.subcategories || [quoteData.subcategory],
          language: accountConfig.language,
        });

        // Update log with success
        await APIBook.motivationalAutoPostLog.updateLog(logId, {
          status: 'success',
          quoteText: quoteData.quoteText,
          author: quoteData.author || '', // Always save as empty string if no author
          profession: quoteData.profession || '', // Save profession or empty string
          subcategory: quoteData.subcategory || '', // Save primary subcategory
          subcategories: quoteData.subcategories || [], // Save all subcategories
          mediaUrl: firebaseMediaUrl, // Store Firebase URL
          generatedPrompt: quoteData.visualPrompt,
          caption,
          blogContent: blogContent.htmlContent,
          instagramPostId: instagramPostId,
          instagramAccountName: instagramAccount.name,
        });

        results.push({
          accountId: accountConfig.accountId,
          accountName: instagramAccount.name,
          status: 'success',
          quoteText: quoteData.quoteText,
        });

      } catch (error) {
        
        // Update log with failure status (keep the generated media URL if available)
        try {
          await APIBook.motivationalAutoPostLog.updateLog(logId, {
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
            // If we generated media but failed to post, keep the URL
            ...(typeof firebaseMediaUrl !== 'undefined' && { 
              mediaUrl: firebaseMediaUrl,
              generatedPrompt: quoteData?.visualPrompt || '',
            }),
            ...(quoteData && { 
              quoteText: quoteData.quoteText,
              author: quoteData.author || '', // Always save as empty string if no author
              profession: quoteData.profession || '', // Save profession
              subcategory: quoteData.subcategory || '', // Save primary subcategory
              subcategories: quoteData.subcategories || [], // Save all subcategories
            }),
          });
        } catch (updateError) {
        }
        
        results.push({
          accountId: accountConfig.accountId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    return NextResponse.json({
      success: true,
      results,
      totalProcessed: results.length,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
    });
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}ms`,
      },
      { status: 500 }
    );
  }
}
