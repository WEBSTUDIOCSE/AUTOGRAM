import { NextRequest, NextResponse } from 'next/server';
import { AutoPostSchedulerService } from '@/lib/services/module3/auto-post-scheduler.service';

/**
 * API endpoint for Cloud Function to trigger auto-posting
 * Called by Firebase Cloud Functions on schedule
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    
    const { userId, scheduledTime, authToken } = body;

    // Validate required fields
    if (!userId || !scheduledTime) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: userId and scheduledTime are required' 
        },
        { status: 400 }
      );
    }

    // Verify authorization token (basic security)
    // In production, use a more secure method like Firebase Admin SDK token verification
    const expectedToken = process.env.AUTO_POST_SECRET_TOKEN || 'autogram-auto-post-secret-2024';
    
    if (authToken !== expectedToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Execute auto-post workflow
    await AutoPostSchedulerService.executeAutoPost(userId, scheduledTime);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Auto-post executed successfully',
      userId,
      scheduledTime,
      timestamp: new Date().toISOString(),
      executionTimeMs: duration,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    if (error instanceof Error) {
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/auto-post',
    method: 'POST',
    timestamp: new Date().toISOString(),
  });
}
