import { NextRequest, NextResponse } from 'next/server';
import { FamilyAutoPostScheduler } from '@/lib/services/module4';

/**
 * API endpoint for Cloud Function to trigger family auto-posting
 * Called by Firebase Cloud Functions on schedule
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log(`[FamilyAutoPost API] ===== NEW REQUEST RECEIVED =====`);
  console.log(`[FamilyAutoPost API] Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Parse request body
    const body = await request.json();
    console.log(`[FamilyAutoPost API] Request body:`, JSON.stringify(body, null, 2));
    
    const { userId, profileId, scheduledTime, authToken } = body;

    // Validate required fields
    if (!userId) {
      console.error(`[FamilyAutoPost API] ❌ Missing required field: userId`);
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
    console.log(`[FamilyAutoPost API] 🔐 Token verification - Match: ${authToken === expectedToken}`);
    
    if (authToken !== expectedToken) {
      console.error(`[FamilyAutoPost API] ❌ Unauthorized request for user ${userId}`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`[FamilyAutoPost API] Received request for user ${userId}, profile: ${profileId}, time: ${scheduledTime}`);

    // Execute family auto-post workflow
    console.log(`[FamilyAutoPost API] Executing for scheduled time: ${scheduledTime}`);
    await FamilyAutoPostScheduler.executeAutoPost(userId, scheduledTime);

    const duration = Date.now() - startTime;
    console.log(`[FamilyAutoPost API] ✅ Successfully completed family auto-post for user ${userId}`);
    console.log(`[FamilyAutoPost API] Total execution time: ${duration}ms (${(duration/1000).toFixed(2)}s)`);
    console.log(`[FamilyAutoPost API] ===== REQUEST COMPLETED =====`);

    return NextResponse.json({
      success: true,
      message: 'Family auto-post executed successfully',
      userId,
      timestamp: new Date().toISOString(),
      executionTimeMs: duration,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[FamilyAutoPost API] ❌ Error executing family auto-post after ${duration}ms:`);
    console.error('[FamilyAutoPost API] Error details:', error);
    if (error instanceof Error) {
      console.error('[FamilyAutoPost API] Error name:', error.name);
      console.error('[FamilyAutoPost API] Error message:', error.message);
      console.error('[FamilyAutoPost API] Error stack:', error.stack);
    }
    console.log(`[FamilyAutoPost API] ===== REQUEST FAILED =====`);
    
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
