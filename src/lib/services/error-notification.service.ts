/**
 * Error Notification Service
 * Handles error notifications and alerts for auto-posting failures
 */

export interface ErrorNotification {
  userId: string;
  errorType: 'character_missing' | 'prompt_missing' | 'instagram_error' | 'api_error' | 'network_error' | 'unknown';
  errorMessage: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class ErrorNotificationService {
  /**
   * Categorize error and determine severity
   */
  static categorizeError(errorMessage: string): {
    type: ErrorNotification['errorType'];
    severity: ErrorNotification['severity'];
  } {
    const message = errorMessage.toLowerCase();

    // Character-related errors
    if (message.includes('character') && (message.includes('not enough') || message.includes('minimum'))) {
      return { type: 'character_missing', severity: 'high' };
    }

    // Prompt-related errors
    if (message.includes('prompt') && (message.includes('not found') || message.includes('no active'))) {
      return { type: 'prompt_missing', severity: 'high' };
    }

    // Instagram-related errors
    if (message.includes('instagram') || message.includes('post') || message.includes('account')) {
      return { type: 'instagram_error', severity: 'critical' };
    }

    // API rate limits or service errors
    if (message.includes('api') || message.includes('rate limit') || message.includes('429') || message.includes('quota')) {
      return { type: 'api_error', severity: 'medium' };
    }

    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout') || message.includes('connection')) {
      return { type: 'network_error', severity: 'low' };
    }

    // Unknown errors
    return { type: 'unknown', severity: 'medium' };
  }

  /**
   * Get user-friendly error message with actionable suggestions
   */
  static getUserFriendlyMessage(errorMessage: string): {
    title: string;
    description: string;
    action: string;
  } {
    const { type } = this.categorizeError(errorMessage);

    const messages: Record<ErrorNotification['errorType'], { title: string; description: string; action: string }> = {
      character_missing: {
        title: 'Not Enough Characters',
        description: 'You need to upload more characters to enable auto-posting.',
        action: 'Go to the Generate tab and upload at least 3 characters.',
      },
      prompt_missing: {
        title: 'No Prompt Templates',
        description: 'You need to create at least one prompt template for auto-posting.',
        action: 'Generate an image in the Generate tab to automatically save your first prompt.',
      },
      instagram_error: {
        title: 'Instagram Connection Issue',
        description: 'There was a problem connecting to your Instagram account or posting.',
        action: 'Check your Instagram account connection in Settings and ensure it\'s still active.',
      },
      api_error: {
        title: 'API Service Issue',
        description: 'The AI service is temporarily unavailable or rate-limited.',
        action: 'The system will automatically retry at the next scheduled time. No action needed.',
      },
      network_error: {
        title: 'Network Connection Issue',
        description: 'There was a temporary network issue.',
        action: 'Check your internet connection. The system will retry automatically.',
      },
      unknown: {
        title: 'Unexpected Error',
        description: 'An unexpected error occurred during auto-posting.',
        action: 'Check the History tab for details. Contact support if the issue persists.',
      },
    };

    return messages[type];
  }

  /**
   * Create an error notification
   */
  static createNotification(userId: string, errorMessage: string): ErrorNotification {
    const { type, severity } = this.categorizeError(errorMessage);

    return {
      userId,
      errorType: type,
      errorMessage,
      timestamp: new Date().toISOString(),
      severity,
    };
  }

  /**
   * Get error icon emoji based on severity
   */
  static getErrorIcon(severity: ErrorNotification['severity']): string {
    const icons = {
      low: '⚠️',
      medium: '⚠️',
      high: '🚨',
      critical: '🔴',
    };
    return icons[severity];
  }

  /**
   * Check if error requires immediate user action
   */
  static requiresImmediateAction(errorMessage: string): boolean {
    const { severity, type } = this.categorizeError(errorMessage);
    
    // Character and prompt missing are critical for continued operation
    return severity === 'critical' || 
           severity === 'high' || 
           type === 'character_missing' || 
           type === 'prompt_missing';
  }

  /**
   * Format error for display in UI
   */
  static formatForDisplay(errorMessage: string): {
    icon: string;
    friendly: ReturnType<typeof ErrorNotificationService.getUserFriendlyMessage>;
    severity: ErrorNotification['severity'];
    requiresAction: boolean;
  } {
    const { severity } = this.categorizeError(errorMessage);
    const friendly = this.getUserFriendlyMessage(errorMessage);
    const icon = this.getErrorIcon(severity);
    const requiresAction = this.requiresImmediateAction(errorMessage);

    return {
      icon,
      friendly,
      severity,
      requiresAction,
    };
  }

  /**
   * Get suggested retry delay based on error type (in hours)
   */
  static getSuggestedRetryDelay(errorMessage: string): number {
    const { type } = this.categorizeError(errorMessage);

    const delays: Record<ErrorNotification['errorType'], number> = {
      character_missing: 24, // Wait a day, user needs to take action
      prompt_missing: 24, // Wait a day, user needs to take action
      instagram_error: 2, // Retry in 2 hours
      api_error: 1, // Retry in 1 hour (normal schedule)
      network_error: 1, // Retry in 1 hour (normal schedule)
      unknown: 2, // Wait 2 hours for unknown errors
    };

    return delays[type];
  }
}
