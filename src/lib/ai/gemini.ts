import { GoogleGenAI } from '@google/genai';
import { getGeminiConfig } from '@/lib/firebase/config/environments';

/**
 * Gemini AI Client Initialization
 * Reuses environment configuration from Firebase config
 */
const config = getGeminiConfig();

// Initialize GoogleGenAI with API key
export const genAI = new GoogleGenAI({
  apiKey: config.apiKey
});

/**
 * Get configured image model name
 */
export const getImageModelName = () => {
  return config.imageModel;
};

/**
 * Get configured text model name
 */
export const getTextModelName = () => {
  return config.textModel;
};

/**
 * Get model configuration
 */
export const getModelConfig = () => {
  return {
    imageModel: config.imageModel,
    textModel: config.textModel,
    apiKey: config.apiKey ? '****' + config.apiKey.slice(-4) : 'Not configured'
  };
};

// Log initialization in development
if (process.env.NODE_ENV === 'development') {
}
