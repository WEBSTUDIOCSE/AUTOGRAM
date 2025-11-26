import { genAI, getTextModelName } from '@/lib/ai/gemini';
import { DailyContextService, type DailyContext } from './daily-context.service';
import type { Character } from '@/lib/firebase/config/types';

/**
 * Prompt Category for content variation
 */
export type PromptCategory = 
  | 'festival' 
  | 'event' 
  | 'seasonal' 
  | 'travel' 
  | 'lifestyle' 
  | 'trending'
  | 'daily';

/**
 * Prompt Variation Settings
 */
export interface PromptVariationSettings {
  enabled: boolean;
  preferredCategories: PromptCategory[];
  tone: 'casual' | 'professional' | 'fun' | 'elegant';
  avoidTopics?: string[]; // Topics to avoid
  includeLocation?: boolean; // Include India-specific context
}

/**
 * Generated Prompt with Context
 */
export interface GeneratedPrompt {
  prompt: string;
  category: PromptCategory;
  contextUsed: string; // What context influenced this prompt
  originalBasePrompt: string;
}

/**
 * Service for generating prompt variations using Gemini AI
 */
export class PromptVariationService {
  /**
   * Generate a context-aware prompt (NEW - Main Method)
   * Uses daily context (festivals, events, seasons) to create relevant prompts
   */
  static async generateContextualPrompt(
    character: Character,
    basePrompt: string,
    settings: PromptVariationSettings
  ): Promise<GeneratedPrompt> {
    try {
      // If variations disabled, return original prompt
      if (!settings.enabled) {
        return {
          prompt: basePrompt,
          category: 'daily',
          contextUsed: 'Original base prompt (variations disabled)',
          originalBasePrompt: basePrompt
        };
      }

      // Get today's context
      const dailyContext = await DailyContextService.getTodaysContext();
      
      // Determine which category to use
      const category = this.selectCategory(dailyContext, settings);
      
      // Generate the varied prompt
      const generatedPrompt = await this.generatePromptWithContext(
        character,
        basePrompt,
        dailyContext,
        category,
        settings
      );

      return generatedPrompt;
    } catch (error) {
      console.error('Error generating contextual prompt:', error);
      // Fallback to base prompt on error
      return {
        prompt: basePrompt,
        category: 'daily',
        contextUsed: 'Error occurred, using base prompt',
        originalBasePrompt: basePrompt
      };
    }
  }

  /**
   * Select prompt category based on context and settings
   */
  private static selectCategory(
    context: DailyContext,
    settings: PromptVariationSettings
  ): PromptCategory {
    const available: PromptCategory[] = [];

    // Check what's relevant today
    if (context.festivals.length > 0 && settings.preferredCategories.includes('festival')) {
      available.push('festival');
    }
    
    if (context.specialEvents.length > 0 && settings.preferredCategories.includes('event')) {
      available.push('event');
    }
    
    if (context.seasonalThemes.length > 0 && settings.preferredCategories.includes('seasonal')) {
      available.push('seasonal');
    }
    
    if (settings.preferredCategories.includes('travel')) {
      available.push('travel');
    }
    
    if (settings.preferredCategories.includes('lifestyle')) {
      available.push('lifestyle');
    }
    
    if (context.trendingTopics.length > 0 && settings.preferredCategories.includes('trending')) {
      available.push('trending');
    }

    // If nothing matches, use daily
    if (available.length === 0) {
      return 'daily';
    }

    // Randomly select from available categories
    return available[Math.floor(Math.random() * available.length)];
  }

  /**
   * Generate prompt with daily context
   */
  private static async generatePromptWithContext(
    character: Character,
    basePrompt: string,
    context: DailyContext,
    category: PromptCategory,
    settings: PromptVariationSettings
  ): Promise<GeneratedPrompt> {
    const modelName = getTextModelName();

    // Build context information
    let contextInfo = '';
    
    if (category === 'festival' && context.festivals.length > 0) {
      contextInfo = `Today's Festivals: ${context.festivals.join(', ')}`;
    } else if (category === 'event' && context.specialEvents.length > 0) {
      contextInfo = `Today's Special Events: ${context.specialEvents.join(', ')}`;
    } else if (category === 'seasonal' && context.seasonalThemes.length > 0) {
      contextInfo = `Season: ${context.season}. Themes: ${context.seasonalThemes.join(', ')}`;
    } else if (category === 'trending' && context.trendingTopics.length > 0) {
      contextInfo = `Trending Topics: ${context.trendingTopics.join(', ')}`;
    } else if (category === 'travel') {
      contextInfo = `Season: ${context.season}. Popular activities: ${context.seasonalThemes.slice(0, 2).join(', ')}`;
    } else if (category === 'lifestyle') {
      contextInfo = `General lifestyle content with ${settings.tone} tone`;
    } else {
      contextInfo = 'Daily lifestyle content';
    }

    const avoidText = settings.avoidTopics && settings.avoidTopics.length > 0
      ? `\nAVOID these topics: ${settings.avoidTopics.join(', ')}`
      : '';

    const locationText = settings.includeLocation && context.locationContext
      ? `\nLocation Context: ${context.locationContext}`
      : '';

    const prompt = `You are creating an image generation prompt for a character named "${character.name}" for Instagram.

BASE STYLE: ${basePrompt}

CONTEXT: ${contextInfo}${locationText}${avoidText}

TONE: ${settings.tone}

CATEGORY: ${category}

Task: Create a NEW image generation prompt that:
1. Maintains the visual style from the base prompt (appearance, quality, aesthetics)
2. Incorporates today's context (${category}) naturally and relevantly
3. Matches the ${settings.tone} tone
4. Is specific and descriptive for image generation
5. Stays appropriate for Instagram
6. Feels fresh and not repetitive

IMPORTANT:
- Keep the character's appearance/style from base prompt
- Make it feel natural, not forced
- Focus on visual elements that can be generated
- Don't just add "celebrating [festival]" - be creative and specific
- Output ONLY the new prompt, no explanations

Example transformations:
- Festival: "Beautiful Indian model in traditional festive attire with diyas and marigold decorations, warm golden lighting"
- Travel: "Beautiful model at a scenic hill station, morning mist, adventure vibes, candid travel photography"
- Lifestyle: "Beautiful model in casual chic outfit, cozy home setting, natural window light, relaxed morning vibe"

Generate the new prompt:`;

    const response = await genAI.models.generateContent({
      model: modelName,
      contents: prompt,
    });

    let generatedText = '';
    
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          generatedText = part.text.trim();
          break;
        }
      }
    }

    if (!generatedText) {
      // Fallback if generation fails
      return {
        prompt: basePrompt,
        category: 'daily',
        contextUsed: 'Generation failed, using base prompt',
        originalBasePrompt: basePrompt
      };
    }

    return {
      prompt: generatedText,
      category,
      contextUsed: contextInfo,
      originalBasePrompt: basePrompt
    };
  }

  /**
   * Get default variation settings
   */
  static getDefaultSettings(): PromptVariationSettings {
    return {
      enabled: true,
      preferredCategories: ['festival', 'event', 'seasonal', 'lifestyle', 'trending'],
      tone: 'casual',
      avoidTopics: [],
      includeLocation: true
    };
  }

  /**
   * Generate a creative variation of a base prompt (EXISTING METHOD - Kept for compatibility)
   */
  static async generateVariation(basePrompt: string): Promise<string> {
    try {
      if (!basePrompt.trim()) {
        throw new Error('Base prompt cannot be empty');
      }

      const modelName = getTextModelName();

      const variationPrompt = `You are a creative AI assistant helping generate variations of image prompts for character-based photoshoots.

Base prompt: "${basePrompt}"

Create ONE creative variation of this prompt that:
1. Maintains the same core theme and setting
2. Changes specific details (clothing, time of day, weather, mood, accessories, etc.)
3. Adds rich descriptive details suitable for photorealistic AI image generation
4. Keeps it appropriate for Instagram posting
5. Makes it unique and interesting compared to the original
6. Should be concise (1-2 sentences max)
7. DO NOT include any explanations or meta-text, just return the variation prompt

Examples:
- Base: "wearing elegant dress in a modern cafe"
  Variation: "wearing flowing emerald silk gown in a vintage Parisian cafe at twilight, soft candlelight illuminating the scene"

- Base: "standing by the beach at golden sunset"
  Variation: "standing on weathered wooden pier overlooking ocean at sunrise, misty atmosphere with seagulls in background"

Now create a variation for the base prompt. Return ONLY the variation prompt text, nothing else:`;

      const response = await genAI.models.generateContent({
        model: modelName,
        contents: variationPrompt,
      });

      let variation = '';
      
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.text) {
            variation = part.text.trim();
            break;
          }
        }
      }

      if (!variation) {
        throw new Error('No variation generated');
      }
      
      // Clean up the response
      const cleaned = variation
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes
        .replace(/^Variation:\s*/i, '') // Remove "Variation:" prefix if present
        .replace(/^\d+\.\s*/, ''); // Remove numbered list format
      
      return cleaned;
    } catch (error) {
      console.error('Error generating prompt variation:', error);
      throw new Error('Failed to generate prompt variation');
    }
  }

  /**
   * Generate multiple variations at once
   */
  static async generateMultipleVariations(
    basePrompt: string,
    count: number = 3
  ): Promise<string[]> {
    try {
      if (count < 1 || count > 10) {
        throw new Error('Count must be between 1 and 10');
      }

      const variations: string[] = [];
      
      // Generate variations sequentially to avoid rate limiting
      for (let i = 0; i < count; i++) {
        const variation = await this.generateVariation(basePrompt);
        variations.push(variation);
        
        // Small delay between requests
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      return variations;
    } catch (error) {
      console.error('Error generating multiple variations:', error);
      throw new Error('Failed to generate prompt variations');
    }
  }

  /**
   * Enhance a prompt with more details
   */
  static async enhancePrompt(prompt: string): Promise<string> {
    try {
      if (!prompt.trim()) {
        throw new Error('Prompt cannot be empty');
      }

      const modelName = getTextModelName();

      const enhancePromptText = `You are an expert at enhancing image generation prompts for photorealistic results.

Original prompt: "${prompt}"

Enhance this prompt by:
1. Adding specific lighting details (golden hour, dramatic, soft, etc.)
2. Including atmosphere/mood descriptors
3. Adding technical photography details (depth of field, composition, etc.)
4. Making it more vivid and descriptive
5. Keeping it concise and focused
6. Ensuring it's suitable for character-based photorealistic AI generation

Return ONLY the enhanced prompt, nothing else:`;

      const response = await genAI.models.generateContent({
        model: modelName,
        contents: enhancePromptText,
      });

      let enhanced = '';
      
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.text) {
            enhanced = part.text.trim();
            break;
          }
        }
      }

      if (!enhanced) {
        throw new Error('No enhanced prompt generated');
      }
      
      return enhanced.replace(/^["']|["']$/g, '');
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      throw new Error('Failed to enhance prompt');
    }
  }

  /**
   * Generate variations based on time of day
   */
  static async generateTimeBasedVariation(
    basePrompt: string,
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  ): Promise<string> {
    try {
      const timeDescriptions = {
        morning: 'golden morning light, fresh atmosphere, soft shadows',
        afternoon: 'bright daylight, clear and vibrant, high contrast',
        evening: 'warm sunset glow, golden hour lighting, long shadows',
        night: 'nighttime ambiance, dramatic lighting, bokeh city lights',
      };

      const enhancedPrompt = `${basePrompt}, ${timeDescriptions[timeOfDay]}`;
      return this.generateVariation(enhancedPrompt);
    } catch (error) {
      console.error('Error generating time-based variation:', error);
      throw new Error('Failed to generate time-based variation');
    }
  }

  /**
   * Generate variations based on weather/season
   */
  static async generateSeasonalVariation(
    basePrompt: string,
    season: 'spring' | 'summer' | 'autumn' | 'winter'
  ): Promise<string> {
    try {
      const seasonalElements = {
        spring: 'cherry blossoms, fresh greenery, light spring rain',
        summer: 'bright sunshine, clear blue skies, vibrant colors',
        autumn: 'fall foliage, warm orange tones, crisp air',
        winter: 'soft snowfall, cozy atmosphere, cool tones',
      };

      const enhancedPrompt = `${basePrompt}, ${seasonalElements[season]}`;
      return this.generateVariation(enhancedPrompt);
    } catch (error) {
      console.error('Error generating seasonal variation:', error);
      throw new Error('Failed to generate seasonal variation');
    }
  }

  /**
   * Generate a variation with specific mood
   */
  static async generateMoodBasedVariation(
    basePrompt: string,
    mood: 'happy' | 'dramatic' | 'peaceful' | 'energetic' | 'romantic'
  ): Promise<string> {
    try {
      const moodDescriptions = {
        happy: 'joyful atmosphere, bright and cheerful, warm colors',
        dramatic: 'dramatic lighting, intense mood, high contrast',
        peaceful: 'serene and calm, soft tones, tranquil setting',
        energetic: 'dynamic and vibrant, bold colors, action-oriented',
        romantic: 'romantic ambiance, soft lighting, dreamy atmosphere',
      };

      const enhancedPrompt = `${basePrompt}, ${moodDescriptions[mood]}`;
      return this.generateVariation(enhancedPrompt);
    } catch (error) {
      console.error('Error generating mood-based variation:', error);
      throw new Error('Failed to generate mood-based variation');
    }
  }
}
