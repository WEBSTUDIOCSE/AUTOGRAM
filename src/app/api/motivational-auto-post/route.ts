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
  console.log(`[Module 9 API] ===== NEW REQUEST RECEIVED =====`);
  console.log(`[Module 9 API] Timestamp: ${new Date().toISOString()}`);

  try {
    // Parse request body
    const body = await request.json();
    console.log(`[Module 9 API] Request body:`, JSON.stringify(body, null, 2));

    const { userId, scheduledTime, authToken, accountId, category, style, contentType } = body;

    // Validate auth token if provided (from Firebase Functions)
    const expectedToken = process.env.AUTO_POST_SECRET_TOKEN || 'autogram-auto-post-secret-2024';
    
    let effectiveUserId: string;

    if (authToken) {
      console.log(`[Module 9 API] 🔐 Token verification - Match: ${authToken === expectedToken}`);
      
      if (authToken !== expectedToken) {
        console.error(`[Module 9 API] ❌ Invalid auth token`);
        console.error(`[Module 9 API] Expected token: ${expectedToken?.substring(0, 10)}...`);
        console.error(`[Module 9 API] Received token: ${authToken?.substring(0, 10)}...`);
        return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
      }

      // Using userId from request body (from Firebase Functions)
      if (!userId) {
        console.error(`[Module 9 API] ❌ Missing userId in request`);
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
      }
      effectiveUserId = userId;
      console.log(`[Module 9 API] ✅ Authenticated via authToken for user: ${effectiveUserId}`);
    } else {
      // Using authenticated user (from web app)
      const user = await getCurrentUser();
      if (!user) {
        console.error(`[Module 9 API] ❌ Unauthorized - no user session`);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      effectiveUserId = user.uid;
      console.log(`[Module 9 API] ✅ Authenticated via session for user: ${effectiveUserId}`);
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

    // Process each configured account
    for (const accountConfig of config.accountConfigs) {
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
        const currentHour = new Date().toLocaleString('en-US', { 
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        
        const shouldPost = accountConfig.postingTimes.some(time => time === currentHour.substring(0, 5));

        if (!shouldPost) {
          console.log(`Not posting time for ${instagramAccount.name}. Current: ${currentHour}, Scheduled: ${accountConfig.postingTimes.join(', ')}`);
          continue;
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

        console.log(`📝 [Module 9] Generating quote for ${instagramAccount.name}`);
        console.log(`   Category: ${accountConfig.category} | Style: ${accountConfig.style}`);
        console.log(`   Recent quotes to avoid: ${recentQuotes.length}`);

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
          console.warn(`⚠️ [Module 9] Generated quote is a duplicate, generating a new one...`);
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

        console.log(`✨ Generated quote: "${quoteData.quoteText.substring(0, 60)}..."`);
        console.log(`🎨 Visual style: ${accountConfig.style}`);

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
        
        console.log(`🔧 [AI Models] Image: ${imageModel || 'default'} | Video: ${videoModel || 'default'}`);
        console.log(`   Source: ${moduleAIConfig?.textToImageModel ? 'Module-specific' : 'Global settings'}`);

        // Generate media (image or video) using unified services
        let mediaUrl: string;
        
        if (actualContentType === 'image') {
          console.log(`📸 [STEP 1/4] Generating image with model: ${imageModel || 'default'}...`);
          
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

          console.log(`✅ [STEP 1/4] Image generated with ${result.provider}`);

          console.log(`📤 [STEP 2/4] Uploading to Firebase Storage...`);
          
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
            
            console.log(`✅ [STEP 2/4] Firebase upload complete: ${firebaseMediaUrl.substring(0, 80)}...`);
          } catch (uploadError) {
            console.error(`❌ [STEP 2/4] Firebase upload failed:`, uploadError);
            throw new Error(`Firebase upload failed: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`);
          }
        } else {
          console.log(`🎬 Generating video with model: ${videoModel || 'default'}...`);
          
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

          console.log(`✅ Video generated successfully, uploading to Firebase Storage...`);
          
          // Upload video to Firebase Storage
          firebaseMediaUrl = await VideoStorageService.uploadVideoFromUrl(
            videoResult.videoUrl,
            effectiveUserId,
            'module9'
          );
          
          mediaUrl = firebaseMediaUrl; // Use Firebase URL for Instagram
          
          console.log(`✅ Video uploaded to Firebase: ${firebaseMediaUrl.substring(0, 80)}...`);
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
        console.log(`📸 [STEP 3/4] Posting to Instagram account: ${instagramAccount.id}...`);
        console.log(`   Media URL: ${mediaUrl.substring(0, 100)}...`);
        console.log(`   Caption length: ${caption.length} chars`);
        console.log(`   Is Video: ${actualContentType === 'video'}`);
        
        let instagramPostId: string;
        try {
          instagramPostId = await InstagramService.postImage(
            mediaUrl,
            caption,
            instagramAccount.id,
            actualContentType === 'video' // isVideo flag
          );
          console.log(`✅ [STEP 3/4] Posted to Instagram! Post ID: ${instagramPostId}`);
        } catch (igError) {
          console.error(`❌ [STEP 3/4] Instagram posting failed:`, igError);
          throw new Error(`Instagram posting failed: ${igError instanceof Error ? igError.message : String(igError)}`);
        }

        // Generate blog content
        console.log(`📝 [STEP 4/5] Generating blog content...`);
        let blogContent;
        try {
          blogContent = await MotivationalBlogGeneratorService.generateBlogContent({
            quoteText: quoteData.quoteText,
            author: quoteData.author,
            profession: quoteData.profession,
            category: accountConfig.category,
            subcategories: quoteData.subcategories || [quoteData.subcategory],
            language: accountConfig.language,
          });
          console.log(`✅ [STEP 4/5] Blog content generated successfully`);
        } catch (blogError) {
          console.error(`⚠️ [STEP 4/5] Blog generation failed, using fallback:`, blogError);
          blogContent = MotivationalBlogGeneratorService.generateFallbackContent({
            quoteText: quoteData.quoteText,
            author: quoteData.author,
            profession: quoteData.profession,
            category: accountConfig.category,
            subcategories: quoteData.subcategories || [quoteData.subcategory],
            language: accountConfig.language,
          });
        }

        // Update log with success
        console.log(`💾 [STEP 5/5] Updating database log...`);
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

        console.log(`✅ [Module 9 API] Successfully posted for account ${instagramAccount.name}`);
      } catch (error) {
        console.error(`❌ [Module 9 API] Error processing account ${accountConfig.accountId}:`, error);
        
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
          console.error('Failed to update log on error:', updateError);
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

    console.log(`[Module 9 API] ===== REQUEST COMPLETED =====`);
    console.log(`[Module 9 API] Duration: ${duration}ms`);
    console.log(`[Module 9 API] Results:`, JSON.stringify(results, null, 2));

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
    
    console.error(`❌ [Module 9 API] Error in motivational auto-post (${duration}ms):`, error);
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
