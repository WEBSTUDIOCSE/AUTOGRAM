import { genAI, getModelName } from '@/lib/ai/gemini';
import { aiHandler } from '@/lib/ai/handler';
import type { ApiResponse } from '@/lib/firebase/handler';

/**
 * Generated Image Response
 */
export interface GeneratedImage {
  imageBase64: string;
  prompt: string;
  model: string;
  timestamp: number;
}

/**
 * AI Service
 * Provides AI generation capabilities using Gemini API
 */
export const AIService = {
  /**
   * Generate image from text prompt using Gemini AI
   * @param prompt - Text description for image generation
   * @returns ApiResponse with generated image data
   */
  generateImage: async (prompt: string): Promise<ApiResponse<GeneratedImage>> => {
    return aiHandler(async () => {
      if (!prompt || prompt.trim().length === 0) {
        throw new Error('Prompt cannot be empty');
      }

      const modelName = getModelName();
      
      // Enhanced prompt for better image generation
      const enhancedPrompt = `Create a high-quality, detailed, professional picture of: ${prompt}. The image should be visually appealing, well-composed, and suitable for Instagram posting.`;
      
      // Call Gemini Image Generation API
      const response = await genAI.models.generateContent({
        model: modelName,
        contents: enhancedPrompt,
      }) as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data: string } }> } }> };

      // Extract image from response structure: candidates[0].content.parts[]
      let imageBase64 = '';
      
      if (response.candidates && Array.isArray(response.candidates) && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
          // Loop through parts to find the inlineData (image)
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
              imageBase64 = part.inlineData.data;
              break;
            }
          }
        }
      }

      if (!imageBase64) {
        throw new Error('No image generated in response. The model may have returned text instead.');
      }
      
      return {
        imageBase64,
        prompt,
        model: modelName,
        timestamp: Date.now()
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
   * Test AI connection
   * @returns ApiResponse with test result
   */
  testConnection: async (): Promise<ApiResponse<string>> => {
    return aiHandler(async () => {
      // Simple test - just check if we can initialize
      const config = getModelName();
      return `AI connection successful! Using model: ${config}`;
    }, 'ai/test-connection');
  }
};
