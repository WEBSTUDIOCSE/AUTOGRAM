/**
 * Base Video Generation Provider Interface
 */

export interface VideoGenerationOptions {
  prompt: string;
  model?: string;
  userId?: string; // For loading user preferences
  
  // Image input (for image-to-video)
  imageUrl?: string;
  imageUrls?: string[]; // For multiple frames
  
  // Audio input (for AI Avatar)
  audioUrl?: string;
  
  // Video settings
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3' | '3:2';
  resolution?: '720p' | '1080p' | '1K' | '768P';
  duration?: '5' | '6' | '8' | '10';
  
  // Advanced controls
  cameraFixed?: boolean;
  fixedLens?: boolean;
  generateAudio?: boolean;
  enableSafetyChecker?: boolean;
  seed?: number;
  
  // Grok-specific
  mode?: 'normal' | 'creative';
  index?: number; // For multiple frame selection
  
  // Kling V2.1 specific
  negativePrompt?: string;
  cfgScale?: number;
  tailImageUrl?: string;
  
  // Hailuo specific
  promptOptimizer?: boolean;
  
  // SeeDance specific
  endImageUrl?: string;
  
  // Callback URL for async processing
  callbackUrl?: string;
}

export interface VideoGenerationResult {
  videoUrl: string;
  thumbnailUrl?: string;
  prompt: string;
  model: string;
  provider: string;
  timestamp: number;
  duration?: number;
  resolution?: string;
  aspectRatio?: string;
  cost?: number;
  taskId?: string;
}

export interface VideoProviderCredits {
  remaining: number;
  total?: number;
  used?: number;
}

/**
 * Base interface for video generation providers
 */
export interface VideoGenerationProvider {
  name: string;
  
  /**
   * Generate video from text prompt
   */
  generateVideo(options: VideoGenerationOptions): Promise<VideoGenerationResult>;
  
  /**
   * Generate video from image + prompt
   */
  generateVideoFromImage?(
    options: VideoGenerationOptions,
    imageUrl: string
  ): Promise<VideoGenerationResult>;
  
  /**
   * Get available models for this provider
   */
  getAvailableModels(): Promise<string[]>;
  
  /**
   * Check if provider supports a specific feature
   */
  supportsFeature(
    feature: 'audio-generation' | 'camera-control' | 'multi-frame' | 'avatar-sync'
  ): boolean;
  
  /**
   * Get estimated cost for generation
   */
  getEstimatedCost(options: VideoGenerationOptions): number;
  
  /**
   * Get remaining credits (if applicable)
   */
  getCredits?(): Promise<VideoProviderCredits>;
  
  /**
   * Test connection to the provider
   */
  testConnection(): Promise<boolean>;
  
  /**
   * Check status of async video generation task
   */
  checkTaskStatus?(taskId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: VideoGenerationResult;
    error?: string;
    progress?: number;
  }>;
}
