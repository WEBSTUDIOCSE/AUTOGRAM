import type { ApiResponse } from '@/lib/firebase/handler';

/**
 * AI Handler - Wraps AI operations with standardized response format
 * Reuses Firebase ApiResponse interface for consistency
 */
export async function aiHandler<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<ApiResponse<T>> {
  try {
    const data = await operation();
    
    return {
      success: true,
      data,
      error: null,
      code: 'SUCCESS',
      timestamp: Date.now()
    };
  } catch (error: unknown) {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[AI Error${context ? ` - ${context}` : ''}]:`, error);
    }
    
    // Handle Gemini-specific errors
    const errorMessage = error instanceof Error ? error.message : 'AI generation failed';
    const errorCode = (error as { code?: string })?.code || 'AI_ERROR';
    
    return {
      success: false,
      data: null,
      error: errorMessage,
      code: errorCode,
      timestamp: Date.now()
    };
  }
}
