import { getKieAIConfig } from '@/lib/firebase/config/environments';
import type {
  VideoGenerationProvider,
  VideoGenerationOptions,
  VideoGenerationResult,
  VideoProviderCredits
} from '../base.provider';

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
    resultJson?: string;
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
 * Kie.ai Video Generation Provider
 * Supports ByteDance, Grok, and Kling video models
 */
export class KieAIVideoProvider implements VideoGenerationProvider {
  name = 'kieai-video';
  private apiKey: string;
  private baseUrl: string;
  private defaultTextToVideoModel: string;
  private defaultImageToVideoModel: string;

  constructor(apiKey?: string) {
    const config = getKieAIConfig();
    this.apiKey = apiKey || config.apiKey;
    this.baseUrl = config.baseUrl;
    this.defaultTextToVideoModel = 'bytedance/v1-pro-text-to-video';
    this.defaultImageToVideoModel = 'bytedance/v1-pro-image-to-video';

    if (!this.apiKey) {
      console.warn('⚠️ Kie.ai API key not configured for video generation');
    }
  }

  async generateVideo(options: VideoGenerationOptions): Promise<VideoGenerationResult> {
    if (!this.apiKey) {
      throw new Error('Kie.ai API key not configured');
    }

    const { prompt, model, imageUrl } = options;
    
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    // Determine if text-to-video or image-to-video
    const selectedModel = model || (imageUrl ? this.defaultImageToVideoModel : this.defaultTextToVideoModel);
    
    try {
      // Check if it's a Veo model (uses different endpoint)
      if (selectedModel === 'veo3_fast' || selectedModel === 'veo3_quality') {
        return this.generateVeoVideo(selectedModel, options);
      }

      // Build input payload based on model type
      const inputPayload = this.buildInputPayload(selectedModel, options);

      console.log(`🎬 Creating video task with ${selectedModel}...`);
      console.log(`📦 Payload:`, JSON.stringify({ model: selectedModel, input: inputPayload }, null, 2));

      // Create video generation task
      const taskResponse = await fetch(`${this.baseUrl}/jobs/createTask`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel,
          input: inputPayload,
          callBackUrl: options.callbackUrl
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
      console.log(`📋 Video task created: ${taskId}`);
      console.log(`⏳ Polling for completion (video generation may take 5-10 minutes)...`);

      // Poll for completion (video takes longer than images)
      const result = await this.pollTaskCompletion(taskId, 280); // ~9 minutes max

      return {
        videoUrl: result.videoUrl,
        thumbnailUrl: result.thumbnailUrl,
        prompt,
        model: selectedModel,
        provider: 'kieai',
        timestamp: Date.now(),
        duration: options.duration ? parseFloat(options.duration) : undefined,
        resolution: options.resolution,
        aspectRatio: options.aspectRatio,
        cost: this.getEstimatedCost(options),
        taskId
      };

    } catch (error) {
      console.error('❌ Kie.ai video generation failed:', error);
      throw new Error(`Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateVeoVideo(model: string, options: VideoGenerationOptions): Promise<VideoGenerationResult> {
    console.log(`🎬 Creating Veo video with ${model}...`);
    
    const payload: Record<string, unknown> = {
      prompt: options.prompt,
      model: model,
      aspectRatio: options.aspectRatio || '16:9',
      enableFallback: false,
      enableTranslation: true
    };

    if (options.imageUrl) {
      payload.imageUrls = [options.imageUrl];
      payload.generationType = 'REFERENCE_2_VIDEO';
    } else if (options.imageUrls && options.imageUrls.length > 0) {
      payload.imageUrls = options.imageUrls;
      payload.generationType = 'REFERENCE_2_VIDEO';
    }

    if (options.seed) payload.seeds = options.seed;
    if (options.callbackUrl) payload.callBackUrl = options.callbackUrl;

    const taskResponse = await fetch(`${this.baseUrl}/veo/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!taskResponse.ok) {
      const error = await taskResponse.json();
      throw new Error(`Veo API error: ${error.msg || taskResponse.statusText}`);
    }

    const taskData: KieAITaskResponse = await taskResponse.json();

    if (taskData.code !== 200) {
      throw new Error(`Veo error: ${taskData.msg}`);
    }

    const taskId = taskData.data.taskId;
    console.log(`📋 Veo video task created: ${taskId}`);
    console.log(`⏳ Polling for completion (may take 5-10 minutes)...`);

    const result = await this.pollTaskCompletion(taskId, 280);

    return {
      videoUrl: result.videoUrl,
      thumbnailUrl: result.thumbnailUrl,
      prompt: options.prompt,
      model: model,
      provider: 'kieai',
      timestamp: Date.now(),
      aspectRatio: options.aspectRatio,
      cost: this.getEstimatedCost(options),
      taskId
    };
  }

  async generateVideoFromImage(
    options: VideoGenerationOptions,
    imageUrl: string
  ): Promise<VideoGenerationResult> {
    return this.generateVideo({ ...options, imageUrl });
  }

  private buildInputPayload(model: string, options: VideoGenerationOptions): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      prompt: options.prompt
    };

    // ByteDance SeeDance 1.5 Pro
    if (model === 'bytedance/seedance-1.5-pro') {
      if (options.imageUrl) payload.input_urls = [options.imageUrl];
      if (options.imageUrls) payload.input_urls = options.imageUrls;
      payload.aspect_ratio = options.aspectRatio || '1:1';
      payload.resolution = options.resolution || '720p';
      payload.duration = options.duration || '8'; // Keep as string
      payload.fixed_lens = options.fixedLens !== undefined ? options.fixedLens : false;
      payload.generate_audio = options.generateAudio !== undefined ? options.generateAudio : false;
    }
    // ByteDance V1 Pro Fast Image-to-Video
    else if (model === 'bytedance/v1-pro-fast-image-to-video') {
      payload.image_url = options.imageUrl;
      payload.resolution = options.resolution || '720p';
      payload.duration = options.duration || '10';
    }
    // ByteDance V1 Pro Image-to-Video
    else if (model === 'bytedance/v1-pro-image-to-video') {
      payload.image_url = options.imageUrl;
      payload.resolution = options.resolution || '720p';
      payload.duration = options.duration || '10';
      payload.camera_fixed = options.cameraFixed !== undefined ? options.cameraFixed : false;
      payload.seed = options.seed !== undefined ? options.seed : -1;
      payload.enable_safety_checker = options.enableSafetyChecker !== undefined ? options.enableSafetyChecker : true;
    }
    // ByteDance V1 Pro Text-to-Video
    else if (model === 'bytedance/v1-pro-text-to-video') {
      payload.aspect_ratio = options.aspectRatio || '16:9';
      payload.resolution = options.resolution || '720p';
      payload.duration = options.duration || '5';
      payload.camera_fixed = options.cameraFixed !== undefined ? options.cameraFixed : false;
      payload.seed = options.seed !== undefined ? options.seed : -1;
      payload.enable_safety_checker = options.enableSafetyChecker !== undefined ? options.enableSafetyChecker : true;
    }
    // ByteDance V1 Lite Image-to-Video
    else if (model === 'bytedance/v1-lite-image-to-video') {
      payload.image_url = options.imageUrl;
      payload.resolution = options.resolution || '720p';
      payload.duration = options.duration || '10';
      payload.camera_fixed = options.cameraFixed !== undefined ? options.cameraFixed : false;
      payload.seed = options.seed !== undefined ? options.seed : -1;
      payload.enable_safety_checker = options.enableSafetyChecker !== undefined ? options.enableSafetyChecker : true;
      if (options.endImageUrl) payload.end_image_url = options.endImageUrl;
    }
    // ByteDance V1 Lite Text-to-Video
    else if (model === 'bytedance/v1-lite-text-to-video') {
      payload.aspect_ratio = options.aspectRatio || '16:9';
      payload.resolution = options.resolution || '720p';
      payload.duration = options.duration || '5';
      payload.camera_fixed = options.cameraFixed !== undefined ? options.cameraFixed : false;
      payload.enable_safety_checker = options.enableSafetyChecker !== undefined ? options.enableSafetyChecker : true;
    }
    // Grok Imagine Text-to-Video
    else if (model === 'grok-imagine/text-to-video') {
      payload.aspect_ratio = options.aspectRatio || '2:3';
      payload.mode = options.mode || 'normal';
    }
    // Grok Imagine Image-to-Video
    else if (model === 'grok-imagine/image-to-video') {
      if (options.imageUrl) payload.image_urls = [options.imageUrl];
      if (options.imageUrls) payload.image_urls = options.imageUrls;
      payload.mode = options.mode || 'normal';
      if (options.index !== undefined) payload.index = options.index;
    }
    // Kling 2.6 Text-to-Video
    else if (model === 'kling-2.6/text-to-video') {
      payload.sound = options.generateAudio !== undefined ? options.generateAudio : false;
      payload.aspect_ratio = options.aspectRatio || '1:1';
      payload.duration = options.duration || '5';
    }
    // Kling 2.6 Image-to-Video
    else if (model === 'kling-2.6/image-to-video') {
      if (options.imageUrl) payload.image_urls = [options.imageUrl];
      if (options.imageUrls) payload.image_urls = options.imageUrls;
      payload.sound = options.generateAudio !== undefined ? options.generateAudio : false;
      payload.duration = options.duration || '5';
    }
    // Kling AI Avatar V1 Pro
    else if (model === 'kling/ai-avatar-v1-pro') {
      payload.image_url = options.imageUrl;
      payload.audio_url = options.audioUrl;
      payload.prompt = options.prompt || '';
    }
    // Kling V1 Avatar Standard
    else if (model === 'kling/v1-avatar-standard') {
      payload.image_url = options.imageUrl;
      payload.audio_url = options.audioUrl;
      payload.prompt = options.prompt || '';
    }
    // Kling V2.1 Master Image-to-Video
    else if (model === 'kling/v2-1-master-image-to-video') {
      payload.image_url = options.imageUrl;
      payload.duration = options.duration || '5';
      payload.negative_prompt = options.negativePrompt || 'blur, distort, and low quality';
      payload.cfg_scale = options.cfgScale !== undefined ? options.cfgScale : 0.5;
    }
    // Kling V2.1 Master Text-to-Video
    else if (model === 'kling/v2-1-master-text-to-video') {
      payload.duration = options.duration || '5';
      payload.aspect_ratio = options.aspectRatio || '16:9';
      payload.negative_prompt = options.negativePrompt || 'blur, distort, and low quality';
      payload.cfg_scale = options.cfgScale !== undefined ? options.cfgScale : 0.5;
    }
    // Kling V2.1 Pro
    else if (model === 'kling/v2-1-pro') {
      payload.image_url = options.imageUrl;
      payload.duration = options.duration || '5';
      payload.negative_prompt = options.negativePrompt || 'blur, distort, and low quality';
      payload.cfg_scale = options.cfgScale !== undefined ? options.cfgScale : 0.5;
      if (options.tailImageUrl) payload.tail_image_url = options.tailImageUrl;
    }
    // Kling V2.1 Standard
    else if (model === 'kling/v2-1-standard') {
      payload.image_url = options.imageUrl;
      payload.duration = options.duration || '5';
      payload.negative_prompt = options.negativePrompt || 'blur, distort, and low quality';
      payload.cfg_scale = options.cfgScale !== undefined ? options.cfgScale : 0.5;
    }
    // Hailuo 2.3 Image-to-Video Pro
    else if (model === 'hailuo/2-3-image-to-video-pro') {
      payload.image_url = options.imageUrl;
      payload.duration = options.duration || '6';
      payload.resolution = options.resolution || '768P';
    }
    // Hailuo 2.3 Image-to-Video Standard
    else if (model === 'hailuo/2-3-image-to-video-standard') {
      payload.image_url = options.imageUrl;
      payload.duration = options.duration || '6';
      payload.resolution = options.resolution || '768P';
    }
    // Hailuo 02 Text-to-Video Pro
    else if (model === 'hailuo/02-text-to-video-pro') {
      payload.prompt_optimizer = options.promptOptimizer !== undefined ? options.promptOptimizer : true;
    }
    // Hailuo 02 Text-to-Video Standard
    else if (model === 'hailuo/02-text-to-video-standard') {
      payload.duration = options.duration || '6';
      payload.prompt_optimizer = options.promptOptimizer !== undefined ? options.promptOptimizer : true;
    }
    // Hailuo 02 Image-to-Video Pro
    else if (model === 'hailuo/02-image-to-video-pro') {
      payload.image_url = options.imageUrl;
      if (options.endImageUrl) payload.end_image_url = options.endImageUrl;
      payload.prompt_optimizer = options.promptOptimizer !== undefined ? options.promptOptimizer : true;
    }
    // Hailuo 02 Image-to-Video Standard
    else if (model === 'hailuo/02-image-to-video-standard') {
      payload.image_url = options.imageUrl;
      if (options.endImageUrl) payload.end_image_url = options.endImageUrl;
      payload.duration = options.duration || '10';
      payload.resolution = options.resolution || '768P';
      payload.prompt_optimizer = options.promptOptimizer !== undefined ? options.promptOptimizer : true;
    }

    return payload;
  }

  private async pollTaskCompletion(
    taskId: string,
    maxAttempts = 150
  ): Promise<{ videoUrl: string; thumbnailUrl?: string }> {
    console.log(`🔄 Polling video task: ${taskId}`);

    for (let i = 0; i < maxAttempts; i++) {
      await this.sleep(2000); // Check every 2 seconds

      try {
        const response = await fetch(`${this.baseUrl}/jobs/recordInfo?taskId=${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });

        if (!response.ok) {
          console.error(`❌ Status check failed: ${response.statusText}`);
          continue;
        }

        const data: KieAITaskStatusResponse = await response.json();

        if (data.code !== 200) {
          console.error(`❌ Status response error: ${data.msg}`);
          continue;
        }

        const { state, resultJson, failMsg } = data.data;

        console.log(`📊 Task ${taskId} state: ${state} (attempt ${i + 1}/${maxAttempts})`);

        if (state === 'success' && resultJson) {
          const result = JSON.parse(resultJson);
          const videoUrl = result.resultUrls?.[0] || result.videoUrl || result.result_urls?.[0];
          
          if (!videoUrl) {
            console.error('❌ Result JSON:', resultJson);
            throw new Error('No video URL in result');
          }

          console.log(`✅ Video generated: ${videoUrl}`);
          return {
            videoUrl,
            thumbnailUrl: result.thumbnailUrl
          };
        }

        if (state === 'failed') {
          console.error(`❌ Generation failed: ${failMsg}`);
          throw new Error(failMsg || 'Video generation failed');
        }

        if (state === 'processing' || state === 'pending') {
          if (i % 15 === 0) {
            console.log(`⏳ Still processing... (${i + 1}/${maxAttempts}, ~${Math.floor((i + 1) * 2 / 60)} minutes elapsed)`);
          }
        }

      } catch (error) {
        console.error(`❌ Polling error:`, error);
        if (i >= maxAttempts - 1) throw error;
      }
    }

    throw new Error(`Timeout after ${maxAttempts * 2} seconds`);
  }

  async getAvailableModels(): Promise<string[]> {
    return [
      'bytedance/seedance-1.5-pro',
      'bytedance/v1-pro-fast-image-to-video',
      'bytedance/v1-pro-image-to-video',
      'bytedance/v1-pro-text-to-video',
      'bytedance/v1-lite-image-to-video',
      'bytedance/v1-lite-text-to-video',
      'grok-imagine/text-to-video',
      'grok-imagine/image-to-video',
      'kling-2.6/text-to-video',
      'kling-2.6/image-to-video',
      'kling/ai-avatar-v1-pro',
      'kling/v1-avatar-standard',
      'kling/v2-1-master-image-to-video',
      'kling/v2-1-master-text-to-video',
      'kling/v2-1-pro',
      'kling/v2-1-standard',
      'hailuo/2-3-image-to-video-pro',
      'hailuo/2-3-image-to-video-standard',
      'hailuo/02-text-to-video-pro',
      'hailuo/02-text-to-video-standard',
      'hailuo/02-image-to-video-pro',
      'hailuo/02-image-to-video-standard',
      'veo3_fast',
      'veo3_quality'
    ];
  }

  supportsFeature(feature: 'audio-generation' | 'camera-control' | 'multi-frame' | 'avatar-sync'): boolean {
    return true; // Kie.ai supports all video features
  }

  getEstimatedCost(options: VideoGenerationOptions): number {
    // Video is more expensive than images
    const duration = parseInt(options.duration || '5');
    return 0.05 * (duration / 5); // Base $0.05 per 5 seconds
  }

  async getCredits(): Promise<VideoProviderCredits> {
    if (!this.apiKey) {
      throw new Error('Kie.ai API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/credit`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch credits: ${response.statusText}`);
      }

      const data: KieAICreditResponse = await response.json();

      if (data.code === 200 && data.data) {
        return {
          remaining: data.data.balance,
          total: data.data.total,
          used: data.data.used
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
      console.error('❌ Kie.ai video connection test failed:', error);
      return false;
    }
  }

  async checkTaskStatus(taskId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: VideoGenerationResult;
    error?: string;
    progress?: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/recordInfo?taskId=${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      const data: KieAITaskStatusResponse = await response.json();

      if (data.code !== 200) {
        throw new Error(data.msg || 'Status check failed');
      }

      const stateMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
        'success': 'completed',
        'failed': 'failed',
        'processing': 'processing',
        'pending': 'pending'
      };

      return {
        status: stateMap[data.data.state] || 'pending',
        error: data.data.failMsg || undefined
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
