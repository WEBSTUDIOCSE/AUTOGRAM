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
 * Get configured model name
 */
export const getModelName = () => {
  return config.model;
};

/**
 * Get model configuration
 */
export const getModelConfig = () => {
  return {
    model: config.model,
    apiKey: config.apiKey ? '****' + config.apiKey.slice(-4) : 'Not configured'
  };
};

// Log initialization in development
if (process.env.NODE_ENV === 'development') {
  console.log('🤖 Gemini AI initialized:', config.model);
  console.log('🔑 API Key:', config.apiKey ? 'Configured' : 'Missing');
}
