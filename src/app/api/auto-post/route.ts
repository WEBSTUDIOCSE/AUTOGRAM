import { NextRequest, NextResponse } from 'next/server';
import { AutoPostSchedulerService } from '@/lib/services/module3/auto-post-scheduler.service';

/**
 * API endpoint for Cloud Function to trigger auto-posting
 * Called by Firebase Cloud Functions on schedule
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log(`[AutoPost API] ===== NEW REQUEST RECEIVED =====`);
  console.log(`[AutoPost API] Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Parse request body
    const body = await request.json();
    console.log(`[AutoPost API] Request body:`, JSON.stringify(body, null, 2));
    
    const { userId, scheduledTime, authToken } = body;

    // Validate required fields
    if (!userId || !scheduledTime) {
      console.error(`[AutoPost API] ❌ Missing required fields - userId: ${userId}, scheduledTime: ${scheduledTime}`);
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
    console.log(`[AutoPost API] 🔐 Token verification - Match: ${authToken === expectedToken}`);
    
    if (authToken !== expectedToken) {
      console.error(`[AutoPost API] ❌ Unauthorized request for user ${userId}`);
      console.error(`[AutoPost API] Expected token: ${expectedToken?.substring(0, 10)}...`);
      console.error(`[AutoPost API] Received token: ${authToken?.substring(0, 10)}...`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`[AutoPost API] Received request for user ${userId} at ${scheduledTime}`);

    // Execute auto-post workflow
    await AutoPostSchedulerService.executeAutoPost(userId, scheduledTime);

    const duration = Date.now() - startTime;
    console.log(`[AutoPost API] ✅ Successfully completed auto-post for user ${userId}`);
    console.log(`[AutoPost API] Total execution time: ${duration}ms (${(duration/1000).toFixed(2)}s)`);
    console.log(`[AutoPost API] ===== REQUEST COMPLETED =====`);

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
    console.error(`[AutoPost API] ❌ Error executing auto-post after ${duration}ms:`);
    console.error('[AutoPost API] Error details:', error);
    if (error instanceof Error) {
      console.error('[AutoPost API] Error name:', error.name);
      console.error('[AutoPost API] Error message:', error.message);
      console.error('[AutoPost API] Error stack:', error.stack);
    }
    console.log(`[AutoPost API] ===== REQUEST FAILED =====`);
    
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
