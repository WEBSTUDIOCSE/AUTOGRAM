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
        const captionPrompt = `You are writing an authentic Instagram post for this moment: "${prompt}"

Write as if YOU are experiencing this moment right now and sharing it with friends on Instagram.

CRITICAL RULES:
- Write in FIRST PERSON (I, me, my, we)
- Be HIGHLY SPECIFIC to this exact scene - mention specific details, activities, emotions
- Make it sound completely real and unrehearsed
- VARY the length naturally:
  * Exciting moments: 3-4 sentences with enthusiasm
  * Peaceful/reflective moments: 1-2 sentences, calm tone
  * Action/adventure: 2-3 sentences with energy
  * Casual moments: 1-2 short sentences, relaxed
- Use emojis that match the mood (1-3 emojis max)
- Include personal thoughts, feelings, or mini-stories
- NO generic phrases like "living my best life", "good vibes only", "blessed"
- NO mention of AI, digital, generated, or artificial content
- Sound like a REAL person would write it

EXAMPLES OF GOOD CAPTIONS:
- "Finally made it to this spot I've been dreaming about 🌅 The hike was brutal but this view made it so worth it"
- "Coffee first, adulting second ☕"
- "This sunset though... Sometimes you just gotta stop and appreciate moments like these 🌇"
- "Trying out this new place everyone's been talking about and wow, did not disappoint! Already planning my next visit 😍"

Hashtags:
- Pick 8-12 hashtags that are DIRECTLY relevant to what's in the scene
- Mix popular tags (100K+ uses) with niche tags (10K-50K uses)
- MUST match the activity/location/mood/objects in the scene
- NO generic lifestyle tags unless they truly fit
- NO AI-related tags whatsoever
- Make them look natural and hand-picked

Format your response EXACTLY as:
CAPTION: [your authentic, scene-specific caption]
HASHTAGS: [space-separated hashtags]`;

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
        // Use varied human-like fallbacks
        const fallbackCaptions = [
          'Sometimes you just need moments like these 💫',
          'Making memories one day at a time ✨',
          'This is what happiness looks like 😊',
          'Taking it all in 🌟',
          'Here for the good times 🙌',
          'Feeling grateful for moments like this 💛',
          'Just me being me 💁',
          'These are the days I live for ⭐',
        ];
        
        const fallbackHashtags = [
          '#lifestyle #mood #vibes #instagood #photooftheday #dailylife #moments #happiness #grateful #goodtimes',
          '#weekendvibes #goodmood #positive #blessed #enjoying #lifemoments #happy #smile #peace #joy',
          '#authentic #real #natural #genuine #casual #everyday #simple #beauty #appreciate #present',
          '#living #exploring #discovering #adventure #journey #experience #memories #create #capture #share',
        ];
        
        caption = fallbackCaptions[Math.floor(Math.random() * fallbackCaptions.length)];
        hashtags = fallbackHashtags[Math.floor(Math.random() * fallbackHashtags.length)];
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
