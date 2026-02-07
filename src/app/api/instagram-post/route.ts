import { NextRequest, NextResponse } from 'next/server';
import { InstagramService } from '@/lib/services/instagram.service';

export async function POST(request: NextRequest) {
  try {
    const { mediaUrl, caption, accountId, isVideo } = await request.json();

    if (!mediaUrl || !caption || !accountId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Post to Instagram
    const instagramPostId = await InstagramService.postImage(
      mediaUrl,
      caption,
      accountId,
      isVideo || false // Default to false for images
    );

    if (!instagramPostId) {
      throw new Error('Failed to post to Instagram');
    }

    return NextResponse.json({
      success: true,
      instagramPostId,
      message: 'Successfully posted to Instagram'
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to post to Instagram'
      },
      { status: 500 }
    );
  }
}