/**
 * Model Registry
 * Centralized registry for all available AI image generation models
 */

export interface ModelMetadata {
  id: string;
  name: string;
  provider: 'gemini' | 'kieai';
  type: 'text-to-image' | 'image-to-image';
  speed: 'very-fast' | 'fast' | 'medium' | 'slow';
  quality: 'basic' | 'good' | 'excellent' | 'ultra';
  costLevel: 'low' | 'medium' | 'high';
  description: string;
  category?: string;
  aspectRatios?: string[];
  features?: string[];
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

  // === BYTEDANCE MODELS ===
  // Note: SeeDream models temporarily disabled - API parameters not documented
  // 'bytedance/seedream': { ... },
  // 'bytedance/seedream-v4-edit': { ... },
  // 'seedream/4.5-edit': { ... },

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
export function getModelsByType(type: 'text-to-image' | 'image-to-image', provider?: 'gemini' | 'kieai'): ModelMetadata[] {
  const allModels = { ...KIEAI_MODELS, ...GEMINI_MODELS };
  
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
  return KIEAI_MODELS[modelId] || GEMINI_MODELS[modelId];
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
