/**
 * Model Registry
 * Centralized registry for all available AI image and video generation models
 */

export interface ModelMetadata {
  id: string;
  name: string;
  provider: 'gemini' | 'kieai';
  type: 'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video';
  speed: 'very-fast' | 'fast' | 'medium' | 'slow';
  quality: 'basic' | 'good' | 'excellent' | 'ultra';
  costLevel: 'low' | 'medium' | 'high';
  description: string;
  category?: string;
  aspectRatios?: string[];
  features?: string[];
  durations?: string[]; // For video models
  resolutions?: string[]; // For video models
}

/**
 * Available Kie.ai Models
 */
export const KIEAI_MODELS: Record<string, ModelMetadata> = {
  // === GOOGLE MODELS ===
  'google/imagen4': {
    id: 'google/imagen4',
    name: 'Imagen 4',
    provider: 'kieai',
    type: 'text-to-image',
    speed: 'medium',
    quality: 'ultra',
    costLevel: 'high',
    category: 'Google',
    description: 'Google\'s flagship Imagen 4 model with exceptional quality',
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    features: ['Highest quality', 'Best details', 'Photorealistic']
  },
  'google/imagen4-fast': {
    id: 'google/imagen4-fast',
    name: 'Imagen 4 Fast',
    provider: 'kieai',
    type: 'text-to-image',
    speed: 'very-fast',
    quality: 'excellent',
    costLevel: 'medium',
    category: 'Google',
    description: 'Fast variant of Imagen 4 optimized for speed',
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    features: ['Fastest', 'Great quality', 'Quick posts']
  },
  'google/imagen4-ultra': {
    id: 'google/imagen4-ultra',
    name: 'Imagen 4 Ultra',
    provider: 'kieai',
    type: 'text-to-image',
    speed: 'slow',
    quality: 'ultra',
    costLevel: 'high',
    category: 'Google',
    description: 'Ultra quality Imagen 4 for professional hero images',
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    features: ['Ultra quality', 'Professional', 'Hero images']
  },
  'google/nano-banana': {
    id: 'google/nano-banana',
    name: 'Nano Banana',
    provider: 'kieai',
    type: 'text-to-image',
    speed: 'fast',
    quality: 'good',
    costLevel: 'low',
    category: 'Google',
    description: 'Compact and efficient model for general use',
    aspectRatios: ['1:1', '16:9', '9:16'],
    features: ['Compact', 'Efficient', 'Low cost']
  },
  'nano-banana-pro': {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    provider: 'kieai',
    type: 'text-to-image',
    speed: 'fast',
    quality: 'excellent',
    costLevel: 'medium',
    category: 'Google',
    description: 'Pro version with enhanced quality and control',
    aspectRatios: ['1:1', '16:9', '9:16'],
    features: ['Enhanced quality', 'Better control', 'Professional']
  },
  'google/nano-banana-edit': {
    id: 'google/nano-banana-edit',
    name: 'Nano Banana Edit',
    provider: 'kieai',
    type: 'image-to-image',
    speed: 'fast',
    quality: 'good',
    costLevel: 'low',
    category: 'Google',
    description: 'Efficient image editing and enhancement',
    aspectRatios: ['1:1', '16:9', '9:16'],
    features: ['Image editing', 'Fast processing', 'Low cost']
  },

  // === FLUX MODELS ===
  'flux-2/pro-text-to-image': {
    id: 'flux-2/pro-text-to-image',
    name: 'Flux 2 Pro',
    provider: 'kieai',
    type: 'text-to-image',
    speed: 'medium',
    quality: 'ultra',
    costLevel: 'high',
    category: 'Flux',
    description: 'Professional-grade Flux 2 for text-to-image generation',
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    features: ['Professional', 'Ultra quality', 'High resolution']
  },
  'flux-2/flex-text-to-image': {
    id: 'flux-2/flex-text-to-image',
    name: 'Flux 2 Flex',
    provider: 'kieai',
    type: 'text-to-image',
    speed: 'fast',
    quality: 'excellent',
    costLevel: 'medium',
    category: 'Flux',
    description: 'Flexible Flux 2 model balancing speed and quality',
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    features: ['Flexible', 'Balanced', 'Fast']
  },
  'flux-2/pro-image-to-image': {
    id: 'flux-2/pro-image-to-image',
    name: 'Flux 2 Pro Edit',
    provider: 'kieai',
    type: 'image-to-image',
    speed: 'medium',
    quality: 'ultra',
    costLevel: 'high',
    category: 'Flux',
    description: 'Professional Flux 2 for image-to-image with character consistency',
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    features: ['Character consistency', 'Ultra quality', 'Professional']
  },
  'flux-2/flex-image-to-image': {
    id: 'flux-2/flex-image-to-image',
    name: 'Flux 2 Flex Edit',
    provider: 'kieai',
    type: 'image-to-image',
    speed: 'fast',
    quality: 'excellent',
    costLevel: 'medium',
    category: 'Flux',
    description: 'Flexible Flux 2 for quick image editing with references',
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    features: ['Fast editing', 'Good consistency', 'Balanced cost']
  },

  // === BYTEDANCE MODELS (SeeDream) ===
  'bytedance/seedream': {
    id: 'bytedance/seedream',
    name: 'SeeDream 3.0',
    provider: 'kieai',
    type: 'text-to-image',
    speed: 'medium',
    quality: 'excellent',
    costLevel: 'medium',
    category: 'ByteDance',
    description: 'SeeDream 3.0 - High quality image generation with safety checker',
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    features: ['High quality', 'Safety checker', 'Versatile']
  },
  'bytedance/seedream-v4-text-to-image': {
    id: 'bytedance/seedream-v4-text-to-image',
    name: 'SeeDream 4.0',
    provider: 'kieai',
    type: 'text-to-image',
    speed: 'medium',
    quality: 'ultra',
    costLevel: 'medium',
    category: 'ByteDance',
    description: 'SeeDream 4.0 - Enhanced quality for text-to-image generation',
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    features: ['Ultra quality', 'Enhanced details', 'Text rendering']
  },
  'bytedance/seedream-v4-edit': {
    id: 'bytedance/seedream-v4-edit',
    name: 'SeeDream 4.0 Edit',
    provider: 'kieai',
    type: 'image-to-image',
    speed: 'medium',
    quality: 'ultra',
    costLevel: 'medium',
    category: 'ByteDance',
    description: 'SeeDream 4.0 - Image editing and transformation with reference',
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    features: ['Image editing', 'Reference support', 'Ultra quality']
  },
  'seedream/4.5-text-to-image': {
    id: 'seedream/4.5-text-to-image',
    name: 'SeeDream 4.5',
    provider: 'kieai',
    type: 'text-to-image',
    speed: 'fast',
    quality: 'ultra',
    costLevel: 'medium',
    category: 'ByteDance',
    description: 'SeeDream 4.5 - Latest version with improved quality and speed',
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    features: ['Latest version', 'Ultra quality', 'Fast generation']
  },
  'seedream/4.5-edit': {
    id: 'seedream/4.5-edit',
    name: 'SeeDream 4.5 Edit',
    provider: 'kieai',
    type: 'image-to-image',
    speed: 'fast',
    quality: 'ultra',
    costLevel: 'medium',
    category: 'ByteDance',
    description: 'SeeDream 4.5 - Advanced image editing and transformation',
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    features: ['Advanced editing', 'Reference support', 'Fast processing']
  },

  // === OTHER MODELS ===
  'z-image': {
    id: 'z-image',
    name: 'Z-Image',
    provider: 'kieai',
    type: 'text-to-image',
    speed: 'medium',
    quality: 'good',
    costLevel: 'medium',
    category: 'Other',
    description: 'Balanced model for general image generation',
    aspectRatios: ['1:1', '16:9', '9:16'],
    features: ['Balanced', 'Versatile', 'Reliable']
  },
  'grok-imagine/text-to-image': {
    id: 'grok-imagine/text-to-image',
    name: 'Grok Imagine',
    provider: 'kieai',
    type: 'text-to-image',
    speed: 'medium',
    quality: 'excellent',
    costLevel: 'medium',
    category: 'Other',
    description: 'X.AI\'s creative image generation model',
    aspectRatios: ['1:1', '16:9', '9:16', '3:2', '4:3'],
    features: ['Creative', 'Artistic', 'Unique style']
  },
  'qwen/image-to-image': {
    id: 'qwen/image-to-image',
    name: 'Qwen Edit',
    provider: 'kieai',
    type: 'image-to-image',
    speed: 'medium',
    quality: 'good',
    costLevel: 'low',
    category: 'Other',
    description: 'Qwen model for image editing and enhancement',
    aspectRatios: ['1:1', '16:9', '9:16'],
    features: ['Image editing', 'Good quality', 'Affordable']
  }
};

/**
 * Video Generation Models (Kie.ai)
 */
export const VIDEO_MODELS: Record<string, ModelMetadata> = {
  // === BYTEDANCE VIDEO MODELS ===
  'bytedance/seedance-1.5-pro': {
    id: 'bytedance/seedance-1.5-pro',
    name: 'SeeDance 1.5 Pro',
    provider: 'kieai',
    type: 'image-to-video',
    speed: 'medium',
    quality: 'ultra',
    costLevel: 'high',
    category: 'ByteDance',
    description: 'Advanced image-to-video with audio generation support',
    aspectRatios: ['1:1', '16:9', '9:16'],
    resolutions: ['720p', '1080p'],
    durations: ['5', '8', '10'],
    features: ['Audio generation', 'Camera control', 'High quality']
  },
  'bytedance/v1-pro-fast-image-to-video': {
    id: 'bytedance/v1-pro-fast-image-to-video',
    name: 'V1 Pro Fast (Image)',
    provider: 'kieai',
    type: 'image-to-video',
    speed: 'very-fast',
    quality: 'excellent',
    costLevel: 'medium',
    category: 'ByteDance',
    description: 'Fast image-to-video generation for quick results',
    resolutions: ['720p'],
    durations: ['5'],
    features: ['Fast generation', 'Good quality', 'Quick turnaround']
  },
  'bytedance/v1-pro-image-to-video': {
    id: 'bytedance/v1-pro-image-to-video',
    name: 'V1 Pro (Image)',
    provider: 'kieai',
    type: 'image-to-video',
    speed: 'medium',
    quality: 'ultra',
    costLevel: 'high',
    category: 'ByteDance',
    description: 'Professional image-to-video with camera controls',
    resolutions: ['720p'],
    durations: ['5'],
    features: ['Camera control', 'Safety checker', 'Professional quality']
  },
  'bytedance/v1-pro-text-to-video': {
    id: 'bytedance/v1-pro-text-to-video',
    name: 'V1 Pro (Text)',
    provider: 'kieai',
    type: 'text-to-video',
    speed: 'medium',
    quality: 'ultra',
    costLevel: 'high',
    category: 'ByteDance',
    description: 'Professional text-to-video generation',
    aspectRatios: ['16:9', '9:16', '1:1'],
    resolutions: ['720p'],
    durations: ['5'],
    features: ['Multi-shot support', 'Camera control', 'Safety checker']
  },
  'bytedance/v1-lite-image-to-video': {
    id: 'bytedance/v1-lite-image-to-video',
    name: 'V1 Lite (Image)',
    provider: 'kieai',
    type: 'image-to-video',
    speed: 'fast',
    quality: 'good',
    costLevel: 'low',
    category: 'ByteDance',
    description: 'Budget-friendly image-to-video generation',
    resolutions: ['720p'],
    durations: ['5'],
    features: ['Affordable', 'Camera control', 'End frame support']
  },
  'bytedance/v1-lite-text-to-video': {
    id: 'bytedance/v1-lite-text-to-video',
    name: 'V1 Lite (Text)',
    provider: 'kieai',
    type: 'text-to-video',
    speed: 'fast',
    quality: 'good',
    costLevel: 'low',
    category: 'ByteDance',
    description: 'Budget-friendly text-to-video generation',
    aspectRatios: ['16:9', '9:16', '1:1'],
    resolutions: ['720p'],
    durations: ['5'],
    features: ['Affordable', 'Camera control', 'Safety checker']
  },

  // === GROK IMAGINE VIDEO MODELS ===
  'grok-imagine/text-to-video': {
    id: 'grok-imagine/text-to-video',
    name: 'Grok Imagine (Text)',
    provider: 'kieai',
    type: 'text-to-video',
    speed: 'medium',
    quality: 'excellent',
    costLevel: 'medium',
    category: 'Grok',
    description: 'X.AI\'s creative text-to-video generation',
    aspectRatios: ['1:1', '2:3', '3:2', '16:9', '9:16'],
    features: ['Creative style', 'Multi-aspect support', 'Artistic']
  },
  'grok-imagine/image-to-video': {
    id: 'grok-imagine/image-to-video',
    name: 'Grok Imagine (Image)',
    provider: 'kieai',
    type: 'image-to-video',
    speed: 'medium',
    quality: 'excellent',
    costLevel: 'medium',
    category: 'Grok',
    description: 'X.AI\'s creative image-to-video generation',
    features: ['Creative style', 'Multiple frame support', 'Artistic']
  },

  // === KLING VIDEO MODELS ===
  'kling-2.6/text-to-video': {
    id: 'kling-2.6/text-to-video',
    name: 'Kling 2.6 (Text)',
    provider: 'kieai',
    type: 'text-to-video',
    speed: 'medium',
    quality: 'ultra',
    costLevel: 'high',
    category: 'Kling',
    description: 'Advanced text-to-video with dialogue support',
    aspectRatios: ['1:1', '16:9', '9:16'],
    durations: ['5', '10'],
    features: ['Dialogue support', 'Audio generation', 'Ultra quality']
  },
  'kling-2.6/image-to-video': {
    id: 'kling-2.6/image-to-video',
    name: 'Kling 2.6 (Image)',
    provider: 'kieai',
    type: 'image-to-video',
    speed: 'medium',
    quality: 'ultra',
    costLevel: 'high',
    category: 'Kling',
    description: 'Advanced image-to-video with audio support',
    durations: ['5', '10'],
    features: ['Audio generation', 'Ultra quality', 'Dialogue support']
  },
  'kling/ai-avatar-v1-pro': {
    id: 'kling/ai-avatar-v1-pro',
    name: 'Kling AI Avatar Pro',
    provider: 'kieai',
    type: 'image-to-video',
    speed: 'medium',
    quality: 'ultra',
    costLevel: 'high',
    category: 'Kling',
    description: 'AI avatar animation with audio synchronization',
    features: ['Lip sync', 'Audio sync', 'Avatar animation']
  },
  'kling/v1-avatar-standard': {
    id: 'kling/v1-avatar-standard',
    name: 'Kling V1 Avatar Standard',
    provider: 'kieai',
    type: 'image-to-video',
    speed: 'fast',
    quality: 'excellent',
    costLevel: 'medium',
    category: 'Kling',
    description: 'Standard AI avatar animation with audio',
    features: ['Lip sync', 'Audio sync', 'Avatar animation']
  },
  'kling/v2-1-master-image-to-video': {
    id: 'kling/v2-1-master-image-to-video',
    name: 'Kling V2.1 Master (Image)',
    provider: 'kieai',
    type: 'image-to-video',
    speed: 'slow',
    quality: 'ultra',
    costLevel: 'high',
    category: 'Kling',
    description: 'Master quality image-to-video with advanced controls',
    durations: ['5', '10'],
    features: ['Negative prompt', 'CFG scale', 'Master quality']
  },
  'kling/v2-1-master-text-to-video': {
    id: 'kling/v2-1-master-text-to-video',
    name: 'Kling V2.1 Master (Text)',
    provider: 'kieai',
    type: 'text-to-video',
    speed: 'slow',
    quality: 'ultra',
    costLevel: 'high',
    category: 'Kling',
    description: 'Master quality text-to-video with advanced controls',
    aspectRatios: ['16:9', '9:16', '1:1'],
    durations: ['5', '10'],
    features: ['Negative prompt', 'CFG scale', 'Master quality']
  },
  'kling/v2-1-pro': {
    id: 'kling/v2-1-pro',
    name: 'Kling V2.1 Pro',
    provider: 'kieai',
    type: 'image-to-video',
    speed: 'medium',
    quality: 'ultra',
    costLevel: 'high',
    category: 'Kling',
    description: 'Pro quality image-to-video with tail frame support',
    durations: ['5', '10'],
    features: ['Negative prompt', 'CFG scale', 'Tail image support']
  },
  'kling/v2-1-standard': {
    id: 'kling/v2-1-standard',
    name: 'Kling V2.1 Standard',
    provider: 'kieai',
    type: 'image-to-video',
    speed: 'fast',
    quality: 'excellent',
    costLevel: 'medium',
    category: 'Kling',
    description: 'Standard quality image-to-video generation',
    durations: ['5', '10'],
    features: ['Negative prompt', 'CFG scale', 'Good quality']
  },

  // === HAILUO VIDEO MODELS ===
  'hailuo/2-3-image-to-video-pro': {
    id: 'hailuo/2-3-image-to-video-pro',
    name: 'Hailuo 2.3 Pro (Image)',
    provider: 'kieai',
    type: 'image-to-video',
    speed: 'medium',
    quality: 'ultra',
    costLevel: 'high',
    category: 'Hailuo',
    description: 'Professional image-to-video generation',
    durations: ['6'],
    resolutions: ['768P'],
    features: ['High quality', 'Natural motion', 'Professional grade']
  },
  'hailuo/2-3-image-to-video-standard': {
    id: 'hailuo/2-3-image-to-video-standard',
    name: 'Hailuo 2.3 Standard (Image)',
    provider: 'kieai',
    type: 'image-to-video',
    speed: 'fast',
    quality: 'excellent',
    costLevel: 'medium',
    category: 'Hailuo',
    description: 'Standard quality image-to-video generation',
    durations: ['6'],
    resolutions: ['768P'],
    features: ['Fast generation', 'Good quality', 'Reliable']
  },
  'hailuo/02-text-to-video-pro': {
    id: 'hailuo/02-text-to-video-pro',
    name: 'Hailuo 02 Pro (Text)',
    provider: 'kieai',
    type: 'text-to-video',
    speed: 'medium',
    quality: 'ultra',
    costLevel: 'high',
    category: 'Hailuo',
    description: 'Professional text-to-video with prompt optimizer',
    features: ['Prompt optimizer', 'High quality', 'Creative']
  },
  'hailuo/02-text-to-video-standard': {
    id: 'hailuo/02-text-to-video-standard',
    name: 'Hailuo 02 Standard (Text)',
    provider: 'kieai',
    type: 'text-to-video',
    speed: 'fast',
    quality: 'excellent',
    costLevel: 'medium',
    category: 'Hailuo',
    description: 'Standard text-to-video with prompt optimizer',
    durations: ['6'],
    features: ['Prompt optimizer', 'Good quality', 'Fast generation']
  },
  'hailuo/02-image-to-video-pro': {
    id: 'hailuo/02-image-to-video-pro',
    name: 'Hailuo 02 Pro (Image)',
    provider: 'kieai',
    type: 'image-to-video',
    speed: 'medium',
    quality: 'ultra',
    costLevel: 'high',
    category: 'Hailuo',
    description: 'Pro image-to-video with end frame and optimizer',
    features: ['Prompt optimizer', 'End frame support', 'High quality']
  },
  'hailuo/02-image-to-video-standard': {
    id: 'hailuo/02-image-to-video-standard',
    name: 'Hailuo 02 Standard (Image)',
    provider: 'kieai',
    type: 'image-to-video',
    speed: 'fast',
    quality: 'excellent',
    costLevel: 'medium',
    category: 'Hailuo',
    description: 'Standard image-to-video with end frame support',
    durations: ['10'],
    resolutions: ['768P'],
    features: ['End frame support', 'Prompt optimizer', 'Good quality']
  },

  // === VEO VIDEO MODELS ===
  'veo3_fast': {
    id: 'veo3_fast',
    name: 'Veo 3.1 Fast',
    provider: 'kieai',
    type: 'text-to-video',
    speed: 'fast',
    quality: 'excellent',
    costLevel: 'medium',
    category: 'Veo',
    description: 'Fast video generation with quality balance',
    aspectRatios: ['16:9', '9:16', '1:1'],
    features: ['Fast generation', 'Translation support', 'Multiple references']
  },
  'veo3_quality': {
    id: 'veo3_quality',
    name: 'Veo 3.1 Quality',
    provider: 'kieai',
    type: 'text-to-video',
    speed: 'slow',
    quality: 'ultra',
    costLevel: 'high',
    category: 'Veo',
    description: 'Maximum quality video generation',
    aspectRatios: ['16:9', '9:16', '1:1'],
    features: ['Ultra quality', 'Translation support', 'Multiple references']
  }
};

/**
 * Gemini Models
 */
export const GEMINI_MODELS: Record<string, ModelMetadata> = {
  'gemini-2.5-flash-image': {
    id: 'gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    type: 'text-to-image',
    speed: 'fast',
    quality: 'excellent',
    costLevel: 'medium',
    description: 'Google\'s Gemini image generation with excellent quality',
    features: ['High quality', 'Fast generation', 'Reliable']
  },
  'gemini-2.5-flash-reference': {
    id: 'gemini-2.5-flash-reference',
    name: 'Gemini 2.5 Flash (Reference)',
    provider: 'gemini',
    type: 'image-to-image',
    speed: 'fast',
    quality: 'excellent',
    costLevel: 'medium',
    description: 'Gemini with reference image support for character consistency',
    features: ['Character consistency', 'High quality', 'Native support']
  }
};

/**
 * Get all models by type
 */
export function getModelsByType(
  type: 'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video', 
  provider?: 'gemini' | 'kieai'
): ModelMetadata[] {
  const allModels = { ...KIEAI_MODELS, ...GEMINI_MODELS, ...VIDEO_MODELS };
  
  return Object.values(allModels).filter(model => {
    const typeMatch = model.type === type;
    const providerMatch = provider ? model.provider === provider : true;
    return typeMatch && providerMatch;
  });
}

/**
 * Get model by ID
 */
export function getModelById(modelId: string): ModelMetadata | undefined {
  return KIEAI_MODELS[modelId] || GEMINI_MODELS[modelId] || VIDEO_MODELS[modelId];
}

/**
 * Get default model for provider and type
 */
export function getDefaultModel(provider: 'gemini' | 'kieai', type: 'text-to-image' | 'image-to-image'): string {
  if (provider === 'gemini') {
    return type === 'text-to-image' ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash-reference';
  } else {
    return type === 'text-to-image' ? 'google/imagen4-fast' : 'flux-2/pro-image-to-image';
  }
}
