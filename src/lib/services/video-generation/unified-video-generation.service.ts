import { KieAIVideoProvider } from './providers/kieai-video.provider';
import { UserPreferencesService } from '@/lib/firebase/services/user-preferences.service';
import type {
  VideoGenerationProvider,
  VideoGenerationOptions,
  VideoGenerationResult,
  VideoProviderCredits
} from './base.provider';

/**
 * Unified Video Generation Service
 * Currently supports Kie.ai video models
 */
export class UnifiedVideoGenerationService {
  private providers: Map<string, VideoGenerationProvider>;
  private defaultProvider = 'kieai';

  constructor() {
    this.providers = new Map();
    this.providers.set('kieai', new KieAIVideoProvider());
  }

  /**
   * Generate video using specified provider
   * Uses model from Firebase preferences if not specified
   */
  async generateVideo(
    options: VideoGenerationOptions,
    provider: string = 'kieai'
  ): Promise<VideoGenerationResult> {
    // Load model from preferences if not specified
    if (!options.model) {
      const model = await this.loadModelFromPreferences(
        options.imageUrl ? 'image-to-video' : 'text-to-video',
        options.userId
      );
      if (model) {
        options.model = model;
      } else {
      }
    } else {
    }

    const selectedProvider = this.providers.get(provider);

    if (!selectedProvider) {
      throw new Error(`Video provider ${provider} not available`);
    }

    try {
      const result = await selectedProvider.generateVideo(options);
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Load video model from Firebase preferences
   */
  private async loadModelFromPreferences(type: 'text-to-video' | 'image-to-video', userId?: string): Promise<string | null> {
    try {
      const prefsResponse = await UserPreferencesService.getPreferences(userId);
      
      if (prefsResponse.success && prefsResponse.data) {
        const prefs = prefsResponse.data;
        const model = type === 'text-to-video' ? prefs.textToVideoModel : prefs.imageToVideoModel;
        
        if (model) {
          return model;
        }
      }
    } catch (error) {
    }
    
    return null;
  }

  /**
   * Generate video from image with prompt
   */
  async generateVideoFromImage(
    options: VideoGenerationOptions,
    imageUrl: string,
    provider: string = 'kieai'
  ): Promise<VideoGenerationResult> {
    const selectedProvider = this.providers.get(provider);

    if (!selectedProvider) {
      throw new Error(`Video provider ${provider} not available`);
    }

    if (!selectedProvider.generateVideoFromImage) {
      throw new Error(`${selectedProvider.name} does not support image-to-video`);
    }

    return selectedProvider.generateVideoFromImage(options, imageUrl);
  }

  /**
   * Get available models from all providers
   */
  async getAvailableModels(): Promise<Record<string, string[]>> {
    const models: Record<string, string[]> = {};

    for (const [name, provider] of this.providers.entries()) {
      try {
        models[name] = await provider.getAvailableModels();
      } catch (error) {
        models[name] = [];
      }
    }

    return models;
  }

  /**
   * Get credits for all providers
   */
  async getAllCredits(): Promise<Record<string, VideoProviderCredits>> {
    const credits: Record<string, VideoProviderCredits> = {};

    for (const [name, provider] of this.providers.entries()) {
      if (provider.getCredits) {
        try {
          credits[name] = await provider.getCredits();
        } catch (error) {
          credits[name] = { remaining: 0 };
        }
      }
    }

    return credits;
  }

  /**
   * Test connection to all providers
   */
  async testConnections(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [name, provider] of this.providers.entries()) {
      try {
        results[name] = await provider.testConnection();
      } catch {
        results[name] = false;
      }
    }

    return results;
  }

  /**
   * Get cost comparison for a generation request
   */
  getCostComparison(options: VideoGenerationOptions): Record<string, number> {
    const costs: Record<string, number> = {};

    for (const [name, provider] of this.providers.entries()) {
      costs[name] = provider.getEstimatedCost(options);
    }

    return costs;
  }

  /**
   * Check task status
   */
  async checkTaskStatus(
    taskId: string,
    provider: string = 'kieai'
  ): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: VideoGenerationResult;
    error?: string;
    progress?: number;
  }> {
    const selectedProvider = this.providers.get(provider);

    if (!selectedProvider || !selectedProvider.checkTaskStatus) {
      throw new Error(`Provider ${provider} does not support status checking`);
    }

    return selectedProvider.checkTaskStatus(taskId);
  }
}

// Export singleton instance
export const unifiedVideoGeneration = new UnifiedVideoGenerationService();
