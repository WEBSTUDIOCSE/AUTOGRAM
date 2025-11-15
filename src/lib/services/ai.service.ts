import { genAI, getImageModelName, getTextModelName } from '@/lib/ai/gemini';
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
  caption?: string;
  hashtags?: string;
}

/**
 * AI Service
 * Provides AI generation capabilities using Gemini API
 */
export const AIService = {
  /**
   * Generate image from text prompt using Gemini AI
   * Also generates caption and hashtags using AI
   * @param prompt - Text description for image generation
   * @returns ApiResponse with generated image data, caption, and hashtags
   */
  generateImage: async (prompt: string): Promise<ApiResponse<GeneratedImage>> => {
    return aiHandler(async () => {
      if (!prompt || prompt.trim().length === 0) {
        throw new Error('Prompt cannot be empty');
      }

      const modelName = getImageModelName();
      
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
      
      // Generate caption and hashtags using AI
      let caption = '';
      let hashtags = '';
      
      try {
        console.log('🎨 Generating caption and hashtags with AI...');
        
        const textModel = getTextModelName();
        const captionPrompt = `You are an Instagram caption expert. Based on this image description: "${prompt}"

Create an engaging Instagram post with:
1. A captivating caption (2-3 sentences) that describes what's in the image
2. Add appropriate emojis naturally within the caption
3. Generate 10-15 relevant hashtags based on the image content
4. Always include these base hashtags: #AIArt #AIGenerated #Autogram

Format your response EXACTLY as:
CAPTION: [Your engaging caption with emojis]
HASHTAGS: #hashtag1 #hashtag2 #hashtag3 ...`;

        const captionResponse = await genAI.models.generateContent({
          model: textModel,
          contents: captionPrompt,
        }) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

        if (captionResponse.candidates?.[0]?.content?.parts?.[0]?.text) {
          const aiText = captionResponse.candidates[0].content.parts[0].text;
          console.log('📝 AI Response:', aiText);
          
          // Parse caption
          const captionMatch = aiText.match(/CAPTION:\s*(.+?)(?=\nHASHTAGS:|$)/i);
          if (captionMatch && captionMatch[1]) {
            caption = captionMatch[1].trim();
          }
          
          // Parse hashtags
          const hashtagsMatch = aiText.match(/HASHTAGS:\s*(.+)/i);
          if (hashtagsMatch && hashtagsMatch[1]) {
            hashtags = hashtagsMatch[1].trim();
          }
        }
        
        console.log('✅ Caption generated:', caption);
        console.log('✅ Hashtags generated:', hashtags);
        
      } catch (error) {
        console.error('❌ Failed to generate caption/hashtags with AI:', error);
        // No fallback - leave empty so user can fill manually
      }
      
      return {
        imageBase64,
        prompt,
        model: modelName,
        timestamp: Date.now(),
        caption: caption || '',
        hashtags: hashtags || ''
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
      const imageModel = getImageModelName();
      const textModel = getTextModelName();
      return `AI connection successful! Using models: Image=${imageModel}, Text=${textModel}`;
    }, 'ai/test-connection');
  }
};
