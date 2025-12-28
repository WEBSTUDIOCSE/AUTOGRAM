import { GeminiProvider } from './providers/gemini.provider';
import { KieAIProvider } from './providers/kieai.provider';
import type { 
  ImageGenerationProvider, 
  ImageGenerationOptions, 
  ImageGenerationResult,
  ProviderCredits
} from './base.provider';
import { UserPreferencesService } from '@/lib/firebase/services/user-preferences.service';

export type ProviderType = 'gemini' | 'kieai' | 'auto';

/**
 * Unified Image Generation Service
 * Routes requests to different AI providers (Gemini, Kie.ai)
 * Supports automatic provider selection based on cost/features/credits
 */
export class UnifiedImageGenerationService {
  private providers: Map<string, ImageGenerationProvider>;
  private defaultProvider: ProviderType = 'gemini';

  constructor() {
    this.providers = new Map();
    
    // Initialize providers
    this.providers.set('gemini', new GeminiProvider());
    this.providers.set('kieai', new KieAIProvider());
  }

  /**
   * Generate image using specified provider
   * @param options - Generation options
   * @param provider - Which provider to use ('gemini', 'kieai', or 'auto')
   */
  async generateImage(
    options: ImageGenerationOptions,
    provider?: ProviderType
  ): Promise<ImageGenerationResult> {
    // If no provider specified, load from Firebase preferences
    console.log(`🔍 [UnifiedImageGeneration] Provider parameter: ${provider || 'NOT PROVIDED - will load from preferences'}`);
    
    const effectiveProvider = provider || await this.loadProviderFromPreferences();
    console.log(`🔍 [UnifiedImageGeneration] Effective provider after preferences: ${effectiveProvider}`);
    
    const selectedProvider = await this.selectProvider(effectiveProvider, options);
    console.log(`🔍 [UnifiedImageGeneration] Selected provider instance: ${selectedProvider.name}`);
    
    console.log(`🎨 Generating image with ${selectedProvider.name}...`);
    
    try {
      const result = await selectedProvider.generateImage(options);
      console.log(`✅ Image generated successfully with ${selectedProvider.name}`);
      console.log(`💰 Estimated cost: $${result.cost?.toFixed(4) || '0.0000'}`);
      return result;
    } catch (error) {
      console.error(`❌ ${selectedProvider.name} generation failed:`, error);
      
      // Fallback to alternative provider
      if (provider === 'auto') {
        console.log('🔄 Trying fallback provider...');
        const fallbackProvider = this.getFallbackProvider(selectedProvider.name);
        if (fallbackProvider) {
          return fallbackProvider.generateImage(options);
        }
      }
      
      throw error;
    }
  }

  /**
   * Generate image with reference (for character consistency)
   */
  async generateWithReference(
    options: ImageGenerationOptions,
    referenceImageBase64: string,
    provider?: ProviderType, // If not specified, loads from Firebase preferences
    imageUrl?: string // Optional: actual image URL for providers that need it (Kie.ai)
  ): Promise<ImageGenerationResult> {
    // If no provider specified, load from Firebase preferences (default to gemini for character consistency)
    const effectiveProvider = provider || await this.loadProviderFromPreferences();
    const selectedProvider = await this.selectProvider(effectiveProvider, options);
    
    if (!selectedProvider.generateWithReference) {
      throw new Error(`${selectedProvider.name} does not support reference images`);
    }

    if (!selectedProvider.supportsFeature('reference-image')) {
      console.warn(`⚠️ ${selectedProvider.name} may not fully support reference images, using anyway...`);
    }

    return selectedProvider.generateWithReference(options, referenceImageBase64, imageUrl);
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
        console.error(`Failed to get models from ${name}:`, error);
        models[name] = [];
      }
    }
    
    return models;
  }

  /**
   * Get credits for all providers
   */
  async getAllCredits(): Promise<Record<string, ProviderCredits>> {
    const credits: Record<string, ProviderCredits> = {};
    
    for (const [name, provider] of this.providers.entries()) {
      if (provider.getCredits) {
        try {
          credits[name] = await provider.getCredits();
        } catch (error) {
          console.error(`Failed to get credits from ${name}:`, error);
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
  getCostComparison(options: ImageGenerationOptions): Record<string, number> {
    const costs: Record<string, number> = {};
    
    for (const [name, provider] of this.providers.entries()) {
      costs[name] = provider.getEstimatedCost(options);
    }
    
    return costs;
  }

  /**
   * Set default provider
   */
  setDefaultProvider(provider: ProviderType): void {
    if (provider !== 'auto' && !this.providers.has(provider)) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    this.defaultProvider = provider;
  }

  /**
   * Get default provider
   */
  getDefaultProvider(): ProviderType {
    return this.defaultProvider;
  }

  /**
   * Load provider and model preferences from Firebase
   * Also reinitialize providers with user-selected models
   */
  private async loadProviderFromPreferences(): Promise<ProviderType> {
    try {
      console.log('🔍 UnifiedImageGeneration: Loading preferences from Firebase...');
      const prefsResponse = await UserPreferencesService.getPreferences();
      console.log('📦 UnifiedImageGeneration: Firebase response:', { 
        success: prefsResponse.success, 
        provider: prefsResponse.data?.aiProvider,
        textToImageModel: prefsResponse.data?.textToImageModel,
        imageToImageModel: prefsResponse.data?.imageToImageModel
      });
      
      if (prefsResponse.success && prefsResponse.data) {
        const prefs = prefsResponse.data;
        
        // Reinitialize KieAI provider with user-selected models if available
        if (prefs.textToImageModel || prefs.imageToImageModel) {
          console.log('🔧 Reinitializing KieAI provider with custom models...');
          
          const { getKieAIConfig } = await import('@/lib/firebase/config/environments');
          const kieaiConfig = {
            ...getKieAIConfig(),
            textToImageModel: prefs.textToImageModel,
            imageToImageModel: prefs.imageToImageModel
          };
          this.providers.set('kieai', new KieAIProvider(undefined, kieaiConfig));
        }
        
        if (prefs.aiProvider) {
          const provider = prefs.aiProvider;
          // Validate it's a valid provider
          if (provider === 'gemini' || provider === 'kieai') {
            console.log(`✅ UnifiedImageGeneration: Using provider from Firebase: ${provider}`);
            return provider;
          }
        }
      }
      console.log('⚠️ UnifiedImageGeneration: No valid provider in Firebase, using fallback');
    } catch (error) {
      console.error('❌ UnifiedImageGeneration: Failed to load provider from Firebase:', error);
    }
    
    // Fallback to default provider
    console.log(`🔄 UnifiedImageGeneration: Falling back to default provider: ${this.defaultProvider}`);
    return this.defaultProvider;
  }

  /**
   * Select provider based on strategy
   */
  private async selectProvider(
    provider: ProviderType,
    options: ImageGenerationOptions
  ): Promise<ImageGenerationProvider> {
    // Manual selection
    if (provider !== 'auto') {
      const selected = this.providers.get(provider);
      if (!selected) {
        throw new Error(`Provider ${provider} not available`);
      }
      return selected;
    }

    // Auto selection - choose cheapest available provider with credits
    const costs = this.getCostComparison(options);
    const credits = await this.getAllCredits();
    
    // Filter providers with available credits
    const availableProviders = Object.entries(costs)
      .filter(([name]) => {
        const providerCredits = credits[name];
        return !providerCredits || providerCredits.remaining > 0;
      })
      .sort(([, a], [, b]) => a - b);
    
    if (availableProviders.length > 0) {
      const [providerName, cost] = availableProviders[0];
      const selected = this.providers.get(providerName);
      if (selected) {
        console.log(`🤖 Auto-selected ${providerName} (cheapest at $${cost.toFixed(4)})`);
        return selected;
      }
    }

    // Fallback to default
    return this.providers.get(this.defaultProvider) || this.providers.get('gemini')!;
  }

  /**
   * Get fallback provider if primary fails
   */
  private getFallbackProvider(failedProvider: string): ImageGenerationProvider | null {
    const alternatives = Array.from(this.providers.entries())
      .filter(([name]) => name !== failedProvider)
      .map(([, provider]) => provider);
    
    return alternatives[0] || null;
  }
}

// Export singleton instance
export const unifiedImageGeneration = new UnifiedImageGenerationService();
