import { NextRequest, NextResponse } from 'next/server';
import { unifiedVideoGeneration } from '@/lib/services/video-generation/unified-video-generation.service';
import type { VideoGenerationOptions } from '@/lib/services/video-generation/base.provider';

// Increase timeout for video generation (10 minutes)
export const maxDuration = 600;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const {
      prompt,
      model,
      aspectRatio,
      duration,
      resolution,
      imageUrl,
      audioUrl,
      cameraFixed,
      generateAudio,
      enableSafetyChecker
    } = body;

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const options: VideoGenerationOptions = {
      prompt: prompt.trim(),
      model,
      aspectRatio,
      duration,
      resolution,
      imageUrl,
      audioUrl,
      cameraFixed,
      generateAudio,
      enableSafetyChecker
    };

    console.log('🎬 Starting video generation:', options);

    const result = await unifiedVideoGeneration.generateVideo(options);

    return NextResponse.json({
      success: true,
      videoUrl: result.videoUrl,
      thumbnailUrl: result.thumbnailUrl,
      model: result.model,
      provider: result.provider,
      duration: result.duration,
      resolution: result.resolution,
      cost: result.cost,
      taskId: result.taskId
    });

  } catch (error) {
    console.error('❌ Video generation API error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Video generation failed',
        success: false
      },
      { status: 500 }
    );
  }
}

/**
 * Check video generation task status
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const status = await unifiedVideoGeneration.checkTaskStatus(taskId);

    return NextResponse.json({
      success: true,
      ...status
    });

  } catch (error) {
    console.error('❌ Task status check error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to check task status',
        success: false
      },
      { status: 500 }
    );
  }
}
