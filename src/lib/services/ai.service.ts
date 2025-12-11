import { unifiedImageGeneration, type ProviderType } from './image-generation';
import type { ImageGenerationOptions } from './image-generation';
import { aiHandler } from '@/lib/ai/handler';
import type { ApiResponse } from '@/lib/firebase/handler';

/**
 * Generated Image Response
 */
export interface GeneratedImage {
  imageBase64: string;
  imageUrl?: string;
  prompt: string;
  model: string;
  provider?: string;
  timestamp: number;
  caption?: string;
  hashtags?: string;
  cost?: number;
  taskId?: string;
}

/**
 * AI Service
 * Provides AI generation capabilities using multiple providers (Gemini, Kie.ai)
 */
export const AIService = {
  /**
   * Generate image using unified service
   * @param prompt - Text description for image generation
   * @param provider - Optional: 'gemini', 'kieai', or 'auto' (default: uses saved preference)
   * @returns ApiResponse with generated image data
   */
  generateImage: async (
    prompt: string,
    provider?: ProviderType
  ): Promise<ApiResponse<GeneratedImage>> => {
    return aiHandler(async () => {
      if (!prompt || prompt.trim().length === 0) {
        throw new Error('Prompt cannot be empty');
      }

      // Provider is optional - if not specified, UnifiedImageGenerationService will load from Firebase
      const options: ImageGenerationOptions = {
        prompt,
        quality: 'high',
        imageSize: 'square_hd'
      };

      console.log(`🎨 Generating image${provider ? ` with provider: ${provider}` : ' using Firebase preference'}...`);
      const result = await unifiedImageGeneration.generateImage(options, provider);

      return {
        imageBase64: result.imageBase64,
        imageUrl: result.imageUrl,
        prompt: result.prompt,
        model: result.model,
        provider: result.provider,
        timestamp: result.timestamp,
        caption: result.caption,
        hashtags: result.hashtags,
        cost: result.cost,
        taskId: result.taskId
      };
    }, 'ai/generate-image');
  },

  /**
   * Validate prompt before generation
   * @param prompt - Text to validate
   * @returns ApiResponse with validation result
   */
  validatePrompt: async (prompt: string): Promise<ApiResponse<boolean>> => {
    return aiHandler(async () => {
      if (!prompt || prompt.trim().length === 0) {
        return false;
      }
      
      if (prompt.length < 10) {
        throw new Error('Prompt is too short. Please provide more details.');
      }
      
      if (prompt.length > 1000) {
        throw new Error('Prompt is too long. Please keep it under 1000 characters.');
      }
      
      return true;
    }, 'ai/validate-prompt');
  },

  /**
   * Test all AI provider connections
   * @returns ApiResponse with connection status for each provider
   */
  testConnection: async (): Promise<ApiResponse<Record<string, boolean>>> => {
    return aiHandler(async () => {
      const connections = await unifiedImageGeneration.testConnections();
      return connections;
    }, 'ai/test-connection');
  },

  /**
   * Get available models from all providers
   * @returns ApiResponse with models for each provider
   */
  getAvailableModels: async (): Promise<ApiResponse<Record<string, string[]>>> => {
    return aiHandler(async () => {
      const models = await unifiedImageGeneration.getAvailableModels();
      return models;
    }, 'ai/get-models');
  },

  /**
   * Get credits for all providers
   * @returns ApiResponse with credits info for each provider
   */
  getAllCredits: async (): Promise<ApiResponse<Record<string, { remaining: number; total?: number; used?: number }>>> => {
    return aiHandler(async () => {
      const credits = await unifiedImageGeneration.getAllCredits();
      return credits;
    }, 'ai/get-credits');
  },

  /**
   * Get cost comparison for providers
   * @param prompt - Prompt to estimate cost for
   * @returns ApiResponse with cost per provider
   */
  getCostComparison: async (prompt: string): Promise<ApiResponse<Record<string, number>>> => {
    return aiHandler(async () => {
      const options: ImageGenerationOptions = { prompt, quality: 'high' };
      const costs = unifiedImageGeneration.getCostComparison(options);
      return costs;
    }, 'ai/cost-comparison');
  },

  /**
   * Set default AI provider
   * @param provider - Provider to set as default
   */
  setDefaultProvider: (provider: ProviderType): void => {
    unifiedImageGeneration.setDefaultProvider(provider);
  },

  /**
   * Get current default provider
   * @returns Current default provider
   */
  getDefaultProvider: (): ProviderType => {
    return unifiedImageGeneration.getDefaultProvider();
  }
};
