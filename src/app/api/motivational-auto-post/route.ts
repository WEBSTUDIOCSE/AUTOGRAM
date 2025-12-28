import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { APIBook } from '@/lib/firebase/services';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get auto-post configuration
    const config = await APIBook.motivationalAutoPostConfig.getConfig(user.uid);
    
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
        const logId = await APIBook.motivationalAutoPostLog.createLog({
          userId: user.uid,
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
          user.uid,
          accountConfig.accountId,
          20 // Increased from 10 to 20 for better duplication prevention
        );
        const recentQuotes = recentLogs
          .filter((log): log is string => typeof log === 'string' && !!log);

        console.log(`📝 [Module 9] Generating quote for ${instagramAccount.name}`);
        console.log(`   Category: ${accountConfig.category} | Style: ${accountConfig.style}`);
        console.log(`   Recent quotes to avoid: ${recentQuotes.length}`);

        // Generate unique quote using AI based on category and style
        const quoteData = await APIBook.motivationalPromptRefiner.generateUniqueQuote({
          category: accountConfig.category,
          themeDescription: `${accountConfig.category.charAt(0).toUpperCase() + accountConfig.category.slice(1)} quotes in ${accountConfig.style} style`,
          contentType: actualContentType,
          style: accountConfig.style,
          recentQuotes,
        });

        console.log(`✨ Generated quote: "${quoteData.quoteText.substring(0, 60)}..."`);
        console.log(`🎨 Visual style: ${accountConfig.style}`);

        // Generate media (image or video)
        let mediaUrl: string;
        if (actualContentType === 'image') {
          // Generate image using selected AI model
          const imageResult = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: quoteData.visualPrompt,
              style: accountConfig.style,
            }),
          });

          if (!imageResult.ok) {
            throw new Error('Failed to generate image');
          }

          const imageData = await imageResult.json();
          mediaUrl = imageData.imageUrl;
        } else {
          // Generate video using selected AI model
          const videoResult = await fetch('/api/generate-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: quoteData.visualPrompt,
              style: accountConfig.style,
            }),
          });

          if (!videoResult.ok) {
            throw new Error('Failed to generate video');
          }

          const videoData = await videoResult.json();
          mediaUrl = videoData.videoUrl;
        }

        // Create caption with quote
        const caption = `${quoteData.quoteText}\n\n${quoteData.author ? `— ${quoteData.author}` : ''}\n\n#motivation #inspiration #quotes #motivationalquotes #success #mindset #positivevibes`;

        // Post to Instagram
        const postResult = await fetch('/api/instagram/post', {
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
          mediaUrl,
          instagramPostId: postData.postId,
          instagramAccountName: instagramAccount.name,
        });

        results.push({
          accountId: accountConfig.accountId,
          accountName: instagramAccount.name,
          status: 'success',
          quoteText: quoteData.quoteText,
        });
      } catch (error) {
        console.error(`Error processing account ${accountConfig.accountId}:`, error);
        
        results.push({
          accountId: accountConfig.accountId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      totalProcessed: results.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in motivational auto-post:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
