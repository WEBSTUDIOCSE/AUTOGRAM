import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { APIBook } from '@/lib/firebase/services';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active prompts
    const activePrompts = await APIBook.motivationalPromptLibrary.getActivePrompts(user.uid);
    
    if (activePrompts.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No active prompts configured' 
      });
    }

    const results = [];
    const startTime = Date.now();

    // Process each active prompt
    for (const prompt of activePrompts) {
      let logId = '';
      try {
        // Determine actual content type (handle 'both')
        const actualContentType: 'image' | 'video' = 
          prompt.contentType === 'both' 
            ? (Math.random() > 0.5 ? 'video' : 'image')
            : prompt.contentType as 'image' | 'video';

        // Create log entry
        logId = await APIBook.motivationalAutoPostLog.createLog({
          userId: user.uid,
          promptId: prompt.id,
          category: prompt.category,
          quoteText: '',
          contentType: actualContentType,
          generatedPrompt: '',
          mediaUrl: '',
          caption: '',
          hashtags: '',
          instagramAccountId: prompt.assignedAccountId || '',
          status: 'media_generated',
        });

        // Get recent quotes to avoid duplication
        const recentPrompts = await APIBook.motivationalAutoPostLog.getRecentPrompts(
          prompt.id,
          10
        );
        const recentQuotes = recentPrompts
          .filter((text): text is string => typeof text === 'string' && !!text);

        // Generate unique quote using AI
        const quoteData = await APIBook.motivationalPromptRefiner.generateUniqueQuote({
          category: prompt.category,
          themeDescription: prompt.themeDescription,
          contentType: actualContentType,
          style: prompt.style,
          recentQuotes,
        });

        // Generate media (image or video)
        let mediaUrl: string;
        if (actualContentType === 'image') {
          // Generate image using Kie.ai
          const imageResult = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: quoteData.visualPrompt,
              style: prompt.style,
            }),
          });

          if (!imageResult.ok) {
            throw new Error('Failed to generate image');
          }

          const imageData = await imageResult.json();
          mediaUrl = imageData.imageUrl;
        } else {
          // Generate video using Kie.ai
          const videoResult = await fetch('/api/generate-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: quoteData.visualPrompt,
              style: prompt.style,
            }),
          });

          if (!videoResult.ok) {
            throw new Error('Failed to generate video');
          }

          const videoData = await videoResult.json();
          mediaUrl = videoData.videoUrl;
        }

        // Get Instagram account
        const instagramAccount = APIBook.instagram.getAccountById(
          prompt.assignedAccountId || ''
        );

        if (!instagramAccount) {
          throw new Error('Instagram account not found');
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
            mediaType: prompt.contentType === 'image' ? 'IMAGE' : 'VIDEO',
          }),
        });

        if (!postResult.ok) {
          throw new Error('Failed to post to Instagram');
        }

        const postData = await postResult.json();

        // Save quote to database
        await APIBook.motivationalQuote.createQuote({
          userId: user.uid,
          quoteText: quoteData.quoteText,
          author: quoteData.author,
          category: prompt.category,
          contentType: actualContentType,
          mediaUrl,
          instagramPostId: postData.postId,
          instagramAccountId: instagramAccount.id,
          prompt: prompt.themeDescription,
        });

        // Update log with success
        await APIBook.motivationalAutoPostLog.updateLog(logId, {
          status: 'success',
          quoteText: quoteData.quoteText,
          author: quoteData.author,
          mediaUrl,
          instagramPostId: postData.postId,
          instagramAccountName: instagramAccount.username,
        });

        // Increment prompt usage count
        await APIBook.motivationalPromptLibrary.incrementUsage(prompt.id);

        results.push({
          promptId: prompt.id,
          status: 'success',
          quoteText: quoteData.quoteText,
        });
      } catch (error) {
        console.error(`Error processing prompt ${prompt.id}:`, error);
        
        // Update log with error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await APIBook.motivationalAutoPostLog.updateLog(logId, {
          status: error instanceof Error && error.message.includes('Instagram') 
            ? 'instagram_failed' 
            : 'failed',
          error: errorMessage,
        });

        results.push({
          promptId: prompt.id,
          status: 'failed',
          error: errorMessage,
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      totalProcessed: results.length,
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
