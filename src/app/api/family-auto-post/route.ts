import { NextRequest, NextResponse } from 'next/server';
import { FamilyAutoPostScheduler } from '@/lib/services/module4';

/**
 * API endpoint for Cloud Function to trigger family auto-posting
 * Called by Firebase Cloud Functions on schedule
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    
    const { userId, profileId, scheduledTime, authToken } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required field: userId' 
        },
        { status: 400 }
      );
    }

    // Verify authorization token
    const expectedToken = process.env.AUTO_POST_SECRET_TOKEN || 'autogram-auto-post-secret-2024';
    
    if (authToken !== expectedToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Execute family auto-post workflow
    await FamilyAutoPostScheduler.executeAutoPost(userId, scheduledTime);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Family auto-post executed successfully',
      userId,
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
    endpoint: '/api/family-auto-post',
    method: 'POST',
    timestamp: new Date().toISOString(),
  });
}
