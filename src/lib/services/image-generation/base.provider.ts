/**
 * Base Image Generation Provider Interface
 * All providers (Gemini, Kie.ai, etc.) must implement this
 */

export interface ImageGenerationOptions {
  prompt: string;
  model?: string;
  quality?: 'low' | 'medium' | 'high';
  style?: string;
  negativePrompt?: string;
  imageSize?: 'square_hd' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9';
  guidanceScale?: number;
}

export interface ImageGenerationResult {
  imageBase64: string;
  imageUrl?: string;
  prompt: string;
  model: string;
  provider: string;
  timestamp: number;
  caption?: string;
  hashtags?: string;
  cost?: number;
  taskId?: string;
}

export interface ProviderCredits {
  remaining: number;
  total?: number;
  used?: number;
}

export interface ImageGenerationProvider {
  name: string;
  
  /**
   * Generate image from text prompt
   */
  generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult>;
  
  /**
   * Generate image with reference image (for character consistency)
   */
  generateWithReference?(
    options: ImageGenerationOptions,
    referenceImageBase64: string,
    imageUrl?: string // Optional: actual image URL for providers that need it
  ): Promise<ImageGenerationResult>;
  
  /**
   * Get available models for this provider
   */
  getAvailableModels(): Promise<string[]>;
  
  /**
   * Check if provider supports a specific feature
   */
  supportsFeature(feature: 'reference-image' | 'style-control' | 'negative-prompt' | 'async-generation'): boolean;
  
  /**
   * Get estimated cost for generation
   */
  getEstimatedCost(options: ImageGenerationOptions): number;
  
  /**
   * Get remaining credits
   */
  getCredits?(): Promise<ProviderCredits>;
  
  /**
   * Test provider connection
   */
  testConnection(): Promise<boolean>;
  
  /**
   * Check task status (for async providers)
   */
  checkTaskStatus?(taskId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: ImageGenerationResult;
    error?: string;
  }>;
}
