import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { APIBook } from '@/lib/firebase/services';
import { unifiedImageGeneration } from '@/lib/services/image-generation';
import { UnifiedVideoGenerationService } from '@/lib/services/video-generation/unified-video-generation.service';
import { UserPreferencesService } from '@/lib/firebase/services/user-preferences.service';
import { UnifiedImageStorageService } from '@/lib/services/unified/image-storage.service';
import { VideoStorageService } from '@/lib/services/video-storage.service';

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
          style: accountConfig.style,
          contentType: accountConfig.contentType,
          quoteText: '',
          generatedPrompt: '',
          mediaUrl: '',
          caption: '',
          status: 'processing',
        });

        // Determine actual content type (for future 'both' support)
        const actualContentType: 'image' | 'video' = accountConfig.contentType as 'image' | 'video';

        // Get recent quotes to avoid duplication (last 20 for better variety)
        const recentLogs = await APIBook.motivationalAutoPostLog.getRecentLogs(
          effectiveUserId,
          accountConfig.accountId,
          20 // Increased from 10 to 20 for better duplication prevention
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
          recentQuotes,
        });

        console.log(`✨ Generated quote: "${quoteData.quoteText.substring(0, 60)}..."`);
        console.log(`🎨 Visual style: ${accountConfig.style}`);

        // Get user preferences for AI models
        const preferencesResponse = await UserPreferencesService.getPreferences(effectiveUserId);
        const userPreferences = preferencesResponse.data;

        // Generate media (image or video) using unified services
        let mediaUrl: string;
        
        if (actualContentType === 'image') {
          console.log(`📸 Generating image with visual prompt...`);
          
          // Generate image using unified image generation service
          const imageResult = await unifiedImageGeneration.generateImage({
            prompt: quoteData.visualPrompt,
            model: userPreferences?.textToImageModel, // Use user's selected model
            imageSize: 'square_hd',
          });

          if (!imageResult.imageBase64) {
            throw new Error('Failed to generate image - no image data returned');
          }

          console.log(`✅ Image generated successfully, uploading to Firebase Storage...`);
          
          // Upload to Firebase Storage (even if Instagram post fails later)
          const uploadResult = await UnifiedImageStorageService.uploadImage(
            imageResult.imageBase64,
            effectiveUserId,
            'module9/generated-quotes',
            `quote_${Date.now()}`
          );
          
          firebaseMediaUrl = uploadResult.imageUrl;
          mediaUrl = uploadResult.imageUrl; // Use Firebase URL for Instagram
          
          console.log(`✅ Image uploaded to Firebase: ${firebaseMediaUrl.substring(0, 80)}...`);
        } else {
          console.log(`🎬 Generating video with visual prompt...`);
          
          // Generate video using unified video generation service
          const videoService = new UnifiedVideoGenerationService();
          const videoResult = await videoService.generateVideo({
            prompt: quoteData.visualPrompt,
            model: userPreferences?.textToVideoModel, // Use user's selected model
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
            'module7'
          );
          
          mediaUrl = firebaseMediaUrl; // Use Firebase URL for Instagram
          
          console.log(`✅ Video uploaded to Firebase: ${firebaseMediaUrl.substring(0, 80)}...`);
        }

        // Create caption with quote
        const caption = `${quoteData.quoteText}\n\n${quoteData.author ? `— ${quoteData.author}` : ''}\n\n#motivation #inspiration #quotes #motivationalquotes #success #mindset #positivevibes`;

        // Post to Instagram
        const postResult = await fetch(`${BASE_URL}/api/instagram/post`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: instagramAccount.id,
            mediaUrl,
            caption,
            mediaType: actualContentType === 'image' ? 'IMAGE' : 'VIDEO',
          }),
        });

        if (!postResult.ok) {
          throw new Error('Failed to post to Instagram');
        }

        const postData = await postResult.json();

        // Update log with success
        await APIBook.motivationalAutoPostLog.updateLog(logId, {
          status: 'success',
          quoteText: quoteData.quoteText,
          author: quoteData.author,
          mediaUrl: firebaseMediaUrl, // Store Firebase URL
          generatedPrompt: quoteData.visualPrompt,
          caption,
          instagramPostId: postData.postId,
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
              author: quoteData.author,
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
