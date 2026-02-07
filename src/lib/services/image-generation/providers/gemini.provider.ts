import { genAI, getImageModelName, getTextModelName } from '@/lib/ai/gemini';
import type { 
  ImageGenerationProvider, 
  ImageGenerationOptions, 
  ImageGenerationResult 
} from '../base.provider';

/**
 * Gemini Image Generation Provider
 * Wraps existing Gemini AI logic
 */
export class GeminiProvider implements ImageGenerationProvider {
  name = 'gemini';

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const { prompt, model } = options;
    
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    const modelName = model || getImageModelName();
    
    
    // Enhanced prompt for better image generation
    const enhancedPrompt = `Create a high-quality, detailed, professional picture of: ${prompt}. The image should be visually appealing, well-composed, and suitable for Instagram posting.`;
    
    
    // Call Gemini Image Generation API
    const response = await genAI.models.generateContent({
      model: modelName,
      contents: enhancedPrompt,
    }) as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data: string } }> } }> };

    // Extract image from response
    let imageBase64 = '';
    
    if (response.candidates && Array.isArray(response.candidates) && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
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
    
    // Generate caption and hashtags
    const { caption, hashtags } = await this.generateCaptionAndHashtags(prompt);
    
    return {
      imageBase64,
      prompt,
      model: modelName,
      provider: 'gemini',
      timestamp: Date.now(),
      caption,
      hashtags,
      cost: 0.01 // Approximate cost per image
    };
  }

  async generateWithReference(
    options: ImageGenerationOptions,
    referenceImageBase64: string,
    imageUrl?: string // Accepted for interface compatibility but not used (Gemini uses base64)
  ): Promise<ImageGenerationResult> {
    // Gemini supports reference images via base64
    const { prompt, model } = options;
    const modelName = model || getImageModelName();
    
    const enhancedPrompt = `CRITICAL: Using EXACT SAME PERSON from reference image, create ultra-realistic photograph: ${prompt}`;
    
    const response = await genAI.models.generateContent({
      model: modelName,
      contents: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: referenceImageBase64.split(',')[1] || referenceImageBase64
          }
        },
        enhancedPrompt
      ],
    }) as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data: string } }> } }> };

    let imageBase64 = '';
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          imageBase64 = part.inlineData.data;
          break;
        }
      }
    }

    if (!imageBase64) {
      throw new Error('No image generated with reference');
    }

    const { caption, hashtags } = await this.generateCaptionAndHashtags(prompt);

    return {
      imageBase64,
      prompt,
      model: modelName,
      provider: 'gemini',
      timestamp: Date.now(),
      caption,
      hashtags,
      cost: 0.015 // Higher cost for reference images
    };
  }

  async getAvailableModels(): Promise<string[]> {
    return ['gemini-2.0-flash-exp', 'gemini-1.5-flash'];
  }

  supportsFeature(feature: 'reference-image' | 'style-control' | 'negative-prompt' | 'async-generation'): boolean {
    return feature === 'reference-image';
  }

  getEstimatedCost(options: ImageGenerationOptions): number {
    return 0.01; // $0.01 per image
  }

  async testConnection(): Promise<boolean> {
    try {
      const modelName = getImageModelName();
      return !!modelName;
    } catch {
      return false;
    }
  }

  private async generateCaptionAndHashtags(prompt: string): Promise<{ caption: string; hashtags: string }> {
    try {
      const textModel = getTextModelName();
      const captionPrompt = `You are writing an authentic Instagram post for this moment: "${prompt}"

Write as if YOU are experiencing this moment right now and sharing it with friends on Instagram.

CRITICAL RULES:
- Write in FIRST PERSON (I, me, my, we)
- Be HIGHLY SPECIFIC to this exact scene
- VARY the length naturally (1-4 sentences)
- Use emojis that match the mood (1-3 max)
- NO generic phrases
- Sound like a REAL person

Hashtags: 8-12 relevant hashtags

Format:
CAPTION: [your caption]
HASHTAGS: [space-separated hashtags]`;

      const response = await genAI.models.generateContent({
        model: textModel,
        contents: captionPrompt,
      }) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

      if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
        const aiText = response.candidates[0].content.parts[0].text;
        
        const captionMatch = aiText.match(/CAPTION:\s*(.+?)(?=\nHASHTAGS:|$)/i);
        const hashtagsMatch = aiText.match(/HASHTAGS:\s*(.+)/i);
        
        return {
          caption: captionMatch?.[1]?.trim() || 'Making memories ✨',
          hashtags: hashtagsMatch?.[1]?.trim() || '#lifestyle #instagood'
        };
      }
    } catch (error) {
    }

    return {
      caption: 'Making memories ✨',
      hashtags: '#lifestyle #instagood #photooftheday'
    };
  }
}
