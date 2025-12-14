import type { 
  ImageGenerationProvider, 
  ImageGenerationOptions, 
  ImageGenerationResult,
  ProviderCredits
} from '../base.provider';
import { getKieAIConfig } from '@/lib/firebase/config/environments';

interface KieAITaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status: string;
  };
}

interface KieAITaskStatusResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    model: string;
    state: 'pending' | 'processing' | 'success' | 'failed';
    param?: string;
    resultJson?: string; // JSON string containing {"resultUrls": [...]}
    failCode?: number | null;
    failMsg?: string | null;
    costTime?: number;
    completeTime?: number;
    createTime?: number;
  };
}

interface KieAICreditResponse {
  code: number;
  msg: string;
  data: {
    balance: number;
    used: number;
    total: number;
  };
}

/**
 * Kie.ai Image Generation Provider
 * Uses Kie.ai API for cost-effective image generation
 */
export class KieAIProvider implements ImageGenerationProvider {
  name = 'kieai';
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private editModel: string;
  private config: any; // Store config for dynamic model access

  constructor(apiKey?: string, customConfig?: any) {
    const config = customConfig || getKieAIConfig();
    this.config = config;
    this.apiKey = apiKey || config.apiKey;
    this.baseUrl = config.baseUrl;
    
    // Use user-selected models if available, otherwise use defaults
    this.defaultModel = config.textToImageModel || config.defaultModel;
    this.editModel = config.imageToImageModel || config.editModel;
    
    console.log(`🔧 KieAI Provider initialized:`);
    console.log(`   Text-to-Image Model: ${this.defaultModel}`);
    console.log(`   Image-to-Image Model: ${this.editModel}`);
    
    if (!this.apiKey) {
      console.warn('⚠️ Kie.ai API key not configured. Set NEXT_PUBLIC_KIEAI_API_KEY environment variable.');
    }
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    if (!this.apiKey) {
      throw new Error('Kie.ai API key not configured');
    }

    const { prompt, model, imageSize = 'square_hd', guidanceScale = 2.5 } = options;
    const selectedModel = model || this.defaultModel;
    
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    try {
      // Create task
      const taskResponse = await fetch(`${this.baseUrl}/jobs/createTask`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel,
          input: {
            prompt: prompt,
            image_size: imageSize,
            guidance_scale: guidanceScale
          }
        })
      });

      if (!taskResponse.ok) {
        const error = await taskResponse.json();
        throw new Error(`Kie.ai API error: ${error.msg || taskResponse.statusText}`);
      }

      const taskData: KieAITaskResponse = await taskResponse.json();
      
      if (taskData.code !== 200) {
        throw new Error(`Kie.ai error: ${taskData.msg}`);
      }

      const taskId = taskData.data.taskId;
      console.log(`🎨 Kie.ai task created: ${taskId}`);

      // Poll for completion
      const result = await this.pollTaskCompletion(taskId);
      
      if (!result.imageUrl) {
        throw new Error('No image generated from Kie.ai');
      }

      // Download image and convert to base64
      const imageBase64 = await this.downloadImageAsBase64(result.imageUrl);

      // Generate caption and hashtags (use Gemini or local logic)
      const { caption, hashtags } = await this.generateCaptionAndHashtags(prompt);

      return {
        imageBase64,
        imageUrl: result.imageUrl,
        prompt,
        model: selectedModel,
        provider: 'kieai',
        timestamp: Date.now(),
        caption,
        hashtags,
        cost: this.getEstimatedCost(options),
        taskId
      };
      
    } catch (error) {
      console.error('❌ Kie.ai generation failed:', error);
      throw new Error(`Kie.ai generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateWithReference(
    options: ImageGenerationOptions,
    referenceImageBase64: string,
    imageUrl?: string
  ): Promise<ImageGenerationResult> {
    if (!this.apiKey) {
      throw new Error('Kie.ai API key not configured');
    }

    const { prompt, imageSize = 'square_hd', guidanceScale = 2.5 } = options;
    
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    try {
      // Use options.model if provided, otherwise use configured editModel
      const selectedModel = options.model || this.editModel;
      console.log(`🎨 Kie.ai: Creating image-to-image task with ${selectedModel}...`);
      
      // Kie.ai expects image_urls as an array of actual URLs (Firebase Storage URLs)
      // NOT base64 data URLs
      if (!imageUrl) {
        throw new Error('Kie.ai requires an actual image URL (Firebase Storage URL), not base64');
      }
      
      console.log(`📸 Using character image URL: ${imageUrl}`);
      
      // Prepare input based on MODEL TYPE
      // Different models have COMPLETELY different parameter requirements!
      const inputPayload: any = {};

      // Determine model family
      const isFluxModel = selectedModel.includes('flux');
      const isQwenModel = selectedModel.includes('qwen');
      const isSeeDreamModel = selectedModel.includes('seedream');
      const isGoogleEdit = selectedModel.includes('nano-banana-edit');

      if (isFluxModel) {
        // Flux models use aspect_ratio and resolution
        inputPayload.prompt = prompt;
        inputPayload.image_url = imageUrl; // Singular, not array
        inputPayload.aspect_ratio = '1:1'; // Flux uses aspect_ratio not image_size
        inputPayload.resolution = '1K';
        inputPayload.strength = options.strength || 0.75;
      } else if (isQwenModel) {
        // Qwen model parameters (from docs)
        inputPayload.prompt = prompt;
        inputPayload.image_url = imageUrl; // Singular
        inputPayload.strength = options.strength || 0.8;
        inputPayload.output_format = 'png';
        inputPayload.acceleration = 'none';
        inputPayload.num_inference_steps = 30;
        inputPayload.guidance_scale = guidanceScale;
      } else if (isSeeDreamModel) {
        // SeeDream models - ByteDance models may not be fully supported via API
        // Try with aspect_ratio like Flux models
        console.warn('⚠️ SeeDream model detected - may have limited API support');
        inputPayload.prompt = prompt;
        inputPayload.image_url = imageUrl;
        inputPayload.aspect_ratio = '1:1'; // Try aspect_ratio instead of image_size
        inputPayload.strength = options.strength || 0.75;
      } else if (isGoogleEdit) {
        // Google Nano Banana Edit - expects image_urls (PLURAL, ARRAY)
        inputPayload.prompt = prompt;
        inputPayload.image_urls = [imageUrl]; // Google expects array!
        inputPayload.output_format = 'png';
        inputPayload.image_size = '1:1';
      } else {
        // Fallback - generic pattern (try array format for safety)
        inputPayload.prompt = prompt;
        inputPayload.image_urls = [imageUrl]; // Use array format as fallback
        inputPayload.strength = options.strength || 0.75;
        inputPayload.guidance_scale = guidanceScale;
      }

      console.log(`📦 Request payload for ${selectedModel}:`, JSON.stringify({
        model: selectedModel,
        input: inputPayload
      }, null, 2));
      
      // Create task with reference image
      const taskResponse = await fetch(`${this.baseUrl}/jobs/createTask`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel,
          input: inputPayload
        })
      });

      if (!taskResponse.ok) {
        const error = await taskResponse.json();
        console.error('❌ Kie.ai API HTTP Error:', error);
        throw new Error(`Kie.ai API error: ${error.msg || taskResponse.statusText}`);
      }

      const taskData: KieAITaskResponse = await taskResponse.json();
      console.log('📥 Kie.ai API Response:', taskData);
      
      if (taskData.code !== 200 || !taskData.data?.taskId) {
        console.error('❌ Task creation failed. Full response:', JSON.stringify(taskData, null, 2));
        console.error('❌ Request was:', JSON.stringify({
          model: selectedModel,
          input: inputPayload
        }, null, 2));
        throw new Error(`Failed to create task: ${taskData.msg || 'Unknown error'}`);
      }

      const taskId = taskData.data.taskId;
      console.log(`📋 Kie.ai task created: ${taskId}`);
      console.log(`⏳ Polling for completion (image-to-image)...`);

      // Poll for completion
      const result = await this.pollTaskCompletion(taskId);
      
      // Download image and convert to base64
      const imageBase64 = await this.downloadImageAsBase64(result.imageUrl);

      // Generate caption and hashtags
      const { caption, hashtags } = await this.generateCaptionAndHashtags(prompt);
      
      return {
        imageBase64,
        imageUrl: result.imageUrl,
        prompt,
        model: options.model || this.editModel,
        provider: 'kieai',
        timestamp: Date.now(),
        caption,
        hashtags,
        cost: this.getEstimatedCost(options),
        taskId
      };
    } catch (error) {
      console.error('❌ Kie.ai image-to-image generation error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to generate image with reference'
      );
    }
  }

  async getAvailableModels(): Promise<string[]> {
    return [
      this.defaultModel,  // Text-to-image
      this.editModel      // Image-to-image (reference)
    ];
  }

  supportsFeature(feature: 'reference-image' | 'style-control' | 'negative-prompt' | 'async-generation'): boolean {
    return feature === 'async-generation' || feature === 'style-control' || feature === 'reference-image';
  }

  getEstimatedCost(options: ImageGenerationOptions): number {
    // Kie.ai is typically cheaper than Gemini
    return 0.005; // $0.005 per image
  }

  async getCredits(): Promise<ProviderCredits> {
    if (!this.apiKey) {
      throw new Error('Kie.ai API key not configured');
    }

    try {
      // Use chat/credit endpoint as per Kie.ai documentation
      const response = await fetch(`${this.baseUrl}/chat/credit`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch credits');
      }

      const data: KieAICreditResponse = await response.json();
      
      if (data.code === 200 && data.data) {
        return {
          remaining: data.data.balance || 0,
          used: data.data.used || 0,
          total: data.data.total || 0
        };
      }

      throw new Error(data.msg || 'Failed to fetch credits');
    } catch (error) {
      console.error('❌ Failed to fetch Kie.ai credits:', error);
      return { remaining: 0 };
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }
    
    try {
      // Test connection using the chat/credit endpoint
      const response = await fetch(`${this.baseUrl}/chat/credit`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.code === 200;
    } catch (error) {
      console.error('❌ Kie.ai connection test failed:', error);
      return false;
    }
  }

  async checkTaskStatus(taskId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: ImageGenerationResult;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/recordInfo?taskId=${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check task status');
      }

      const data: KieAITaskStatusResponse = await response.json();
      
      if (data.code !== 200) {
        return {
          status: 'failed',
          error: data.msg
        };
      }

      // Map state to status
      let status: 'pending' | 'processing' | 'completed' | 'failed';
      
      if (data.data.state === 'success') {
        status = 'completed';
      } else if (data.data.state === 'failed') {
        status = 'failed';
      } else if (data.data.state === 'processing') {
        status = 'processing';
      } else {
        status = 'pending';
      }

      return {
        status,
        error: data.data.failMsg || undefined
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async pollTaskCompletion(taskId: string, maxAttempts = 30): Promise<{ imageUrl: string }> {
    console.log(`🔄 Polling Kie.ai task: ${taskId}`);
    
    for (let i = 0; i < maxAttempts; i++) {
      await this.sleep(2000); // Wait 2 seconds between checks
      
      try {
        const response = await fetch(`${this.baseUrl}/jobs/recordInfo?taskId=${taskId}`, {
          headers: { 'Authorization': `Bearer ${this.apiKey}` }
        });
        
        if (!response.ok) {
          console.error(`❌ Status check failed: ${response.status}`);
          continue;
        }
        
        const data: KieAITaskStatusResponse = await response.json();
        
        if (data.code !== 200) {
          console.error(`❌ API error: ${data.msg}`);
          throw new Error(`API error: ${data.msg}`);
        }
        
        const state = data.data.state;
        
        // Check for success state
        if (state === 'success') {
          console.log(`✅ Task completed!`);
          
          if (data.data.resultJson && data.data.resultJson.trim() !== '') {
            try {
              const result = JSON.parse(data.data.resultJson);
              
              if (result.resultUrls && result.resultUrls.length > 0) {
                const imageUrl = result.resultUrls[0];
                console.log(`🖼️ Image ready: ${imageUrl}`);
                return { imageUrl };
              } else {
                console.error(`❌ No resultUrls in result`);
                throw new Error('No image URLs in completed task');
              }
            } catch (parseError) {
              console.error('❌ Parse error:', parseError);
              throw new Error(`Failed to parse result: ${parseError}`);
            }
          } else {
            console.error(`❌ Success but empty resultJson`);
            throw new Error('No resultJson in completed task');
          }
        }
        
        // Check for failed state - STOP IMMEDIATELY
        if (state === 'failed' || state === 'fail') {
          const errorCode = data.data.failCode || 'unknown';
          const errorMsg = data.data.failMsg || 'Task failed';
          console.error(`❌ Task FAILED (Code: ${errorCode}): ${errorMsg}`);
          console.error(`📋 Failed task details:`, {
            taskId,
            model: data.data.model,
            failCode: errorCode,
            failMsg: errorMsg,
            costTime: data.data.costTime
          });
          throw new Error(`Image generation failed: ${errorMsg} (Error Code: ${errorCode})`);
        }
        
        // Log progress every 3 attempts to reduce noise
        if (i % 3 === 0) {
          console.log(`⏳ Attempt ${i + 1}/${maxAttempts} - State: ${state}`);
        }
        
      } catch (error) {
        // If error is thrown intentionally (failed state, parse error, API error), stop immediately
        if (error instanceof Error) {
          // These are terminal errors - don't retry
          const terminalErrors = [
            'Task failed',
            'Image generation failed',
            'API error',
            'No image',
            'Failed to parse',
            'No resultUrls',
            'No resultJson'
          ];
          
          const isTerminalError = terminalErrors.some(msg => error.message.includes(msg));
          if (isTerminalError) {
            console.error(`🛑 Terminal error detected, stopping poll:`, error.message);
            throw error;
          }
        }
        
        // Only retry on network/connection errors
        console.error(`⚠️ Network error on attempt ${i + 1}, retrying...`, error);
      }
    }
    
    console.error(`❌ Timeout after ${maxAttempts * 2} seconds`);
    throw new Error('Task timeout - generation took too long');
  }

  private async downloadImageAsBase64(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to download image');
      }
      
      const blob = await response.blob();
      return await this.blobToBase64(blob);
    } catch (error) {
      console.error('❌ Failed to download image:', error);
      throw error;
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Return full data URL (e.g., data:image/png;base64,...)
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async generateCaptionAndHashtags(prompt: string): Promise<{ caption: string; hashtags: string }> {
    // Simple fallback captions since we don't have Gemini here
    // You can integrate with Gemini text model if needed
    const fallbackCaptions = [
      'Sometimes you just need moments like these 💫',
      'Making memories one day at a time ✨',
      'This is what happiness looks like 😊',
      'Taking it all in 🌟',
      'Here for the good times 🙌',
    ];
    
    const fallbackHashtags = [
      '#lifestyle #mood #vibes #instagood #photooftheday',
      '#weekendvibes #goodmood #positive #blessed #enjoying',
      '#authentic #real #natural #genuine #casual',
      '#living #exploring #discovering #adventure #journey',
    ];
    
    return {
      caption: fallbackCaptions[Math.floor(Math.random() * fallbackCaptions.length)],
      hashtags: fallbackHashtags[Math.floor(Math.random() * fallbackHashtags.length)]
    };
  }
}
