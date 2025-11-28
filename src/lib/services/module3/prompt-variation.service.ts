import { genAI, getTextModelName } from '@/lib/ai/gemini';
import { DailyContextService, type DailyContext, type ContentOpportunity } from './daily-context.service';
import { InstagramPostService } from './post-history.service';
import type { Character } from '@/lib/firebase/config/types';

/**
 * Prompt Variation Settings
 */
export interface PromptVariationSettings {
  enabled: boolean;
  tone: 'casual' | 'professional' | 'fun' | 'elegant';
  allowTrending?: boolean; // Allow viral/trending topics
  avoidTopics?: string[]; // Topics to avoid
  includeLocation?: boolean; // Include India-specific context
  trackHistory?: boolean; // Track and avoid recent themes (default true)
  avoidRepetitionDays?: number; // How many days back to check (default 14)
  creativityLevel?: 'low' | 'medium' | 'high'; // How creative to be (default medium)
}

/**
 * Generated Prompt with Context
 */
export interface GeneratedPrompt {
  prompt: string;
  opportunity: ContentOpportunity; // Which opportunity was used
  contextUsed: string; // What context influenced this prompt
  originalBasePrompt: string;
}

/**
 * Service for generating prompt variations using Gemini AI
 */
export class PromptVariationService {
  /**
   * Generate a context-aware prompt (REDESIGNED - Fully Dynamic)
   * Uses daily opportunities + post history to create unique, non-repetitive prompts
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
          opportunity: {
            id: 'disabled',
            title: 'Original Prompt',
            description: 'Variations disabled',
            tags: [],
            relevanceScore: 0
          },
          contextUsed: 'Original base prompt (variations disabled)',
          originalBasePrompt: basePrompt
        };
      }

      // Get today's dynamic context with opportunities
      const dailyContext = await DailyContextService.getTodaysContext();
      
      // Get post history to avoid repetition (if enabled)
      const recentThemes: string[] = [];
      const usedOpportunityIds: string[] = [];
      
      if (settings.trackHistory !== false) {
        const historyDays = settings.avoidRepetitionDays || 14;
        // TODO: Implement getRecentThemes and getRecentOpportunities in PostHistoryService
        // For now, we'll skip this until the service is updated
        console.log(`[Variation] Would check history for last ${historyDays} days`);
      }

      // Filter opportunities based on settings
      let availableOpportunities = dailyContext.contentOpportunities;

      // Filter out trending if not allowed
      if (settings.allowTrending === false) {
        availableOpportunities = availableOpportunities.filter(opp => !opp.isViral);
      }

      // Filter out recently used opportunities
      if (usedOpportunityIds.length > 0) {
        availableOpportunities = availableOpportunities.filter(
          opp => !usedOpportunityIds.includes(opp.id)
        );
      }

      // If no opportunities left, use defaults
      if (availableOpportunities.length === 0) {
        availableOpportunities = DailyContextService.getDefaultOpportunities();
      }

      // Select opportunity (weighted by relevance score)
      const selectedOpportunity = this.selectOpportunityWeighted(availableOpportunities);

      // Generate prompt using the opportunity
      const generatedPrompt = await this.generatePromptFromOpportunity(
        character,
        basePrompt,
        selectedOpportunity,
        dailyContext,
        settings,
        recentThemes
      );

      return generatedPrompt;
    } catch (error) {
      console.error('Error generating contextual prompt:', error);
      // Fallback to base prompt on error
      return {
        prompt: basePrompt,
        opportunity: {
          id: 'error',
          title: 'Error Fallback',
          description: 'Error occurred',
          tags: [],
          relevanceScore: 0
        },
        contextUsed: 'Error occurred, using base prompt',
        originalBasePrompt: basePrompt
      };
    }
  }

  /**
   * Select opportunity using weighted random selection
   * Higher relevanceScore = higher chance of selection
   */
  private static selectOpportunityWeighted(opportunities: ContentOpportunity[]): ContentOpportunity {
    // Calculate total weight
    const totalWeight = opportunities.reduce((sum, opp) => sum + opp.relevanceScore, 0);
    
    // Random value between 0 and totalWeight
    let random = Math.random() * totalWeight;
    
    // Select based on weight
    for (const opportunity of opportunities) {
      random -= opportunity.relevanceScore;
      if (random <= 0) {
        return opportunity;
      }
    }
    
    // Fallback to last opportunity
    return opportunities[opportunities.length - 1];
  }

  /**
   * Generate prompt from a selected opportunity
   */
  private static async generatePromptFromOpportunity(
    character: Character,
    basePrompt: string,
    opportunity: ContentOpportunity,
    context: DailyContext,
    settings: PromptVariationSettings,
    recentThemes: string[]
  ): Promise<GeneratedPrompt> {
    const modelName = getTextModelName();

    const avoidText = settings.avoidTopics && settings.avoidTopics.length > 0
      ? `\nAVOID these topics: ${settings.avoidTopics.join(', ')}`
      : '';

    const recentThemesText = recentThemes.length > 0
      ? `\nRECENTLY USED THEMES (avoid these): ${recentThemes.join(', ')}`
      : '';

    const locationText = settings.includeLocation && context.locationContext
      ? `\nLocation Context: ${context.locationContext}`
      : '';

    const creativityGuidance = {
      low: 'Stay close to the original style, make subtle variations only',
      medium: 'Balance familiarity with creativity, moderate variations',
      high: 'Be very creative and unexpected, push boundaries while staying tasteful'
    };

    const creativityLevel = settings.creativityLevel || 'medium';

    const prompt = `You are creating a UNIQUE, NON-REPETITIVE image generation prompt for Instagram.

CHARACTER: "${character.name}"
BASE VISUAL STYLE: ${basePrompt}

TODAY'S CONTENT OPPORTUNITY:
Title: ${opportunity.title}
Description: ${opportunity.description}
Tags: ${opportunity.tags.join(', ')}
${opportunity.isViral ? '⚡ TRENDING/VIRAL TOPIC' : ''}

CONTEXT: ${context.summary}${locationText}${avoidText}${recentThemesText}

TONE: ${settings.tone}
CREATIVITY LEVEL: ${creativityGuidance[creativityLevel]}

Task: Create a NEW, SPECIFIC image generation prompt that:
1. Maintains the character's visual style from base prompt (appearance, quality)
2. Incorporates the opportunity "${opportunity.title}" naturally and creatively
3. Matches the ${settings.tone} tone
4. Is SPECIFIC and DESCRIPTIVE for AI image generation
5. Feels FRESH and UNIQUE - not generic or repetitive
6. Is appropriate for Instagram
7. Uses concrete visual elements (lighting, setting, mood, composition)

IMPORTANT:
- Keep character's core appearance/style
- Be SPECIFIC (not "festive look" but "silver-sequined lehenga with golden zari work, diya decorations")
- Make it visually rich and detailed
- Avoid clichés and overused phrases
- Output ONLY the prompt, no explanations or meta-text

Generate the prompt now:`;

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
        opportunity,
        contextUsed: 'Generation failed, using base prompt',
        originalBasePrompt: basePrompt
      };
    }

    return {
      prompt: generatedText,
      opportunity,
      contextUsed: `Opportunity: ${opportunity.title} | ${context.summary}`,
      originalBasePrompt: basePrompt
    };
  }

  /**
   * Get default variation settings
   */
  static getDefaultSettings(): PromptVariationSettings {
    return {
      enabled: true,
      tone: 'casual',
      allowTrending: true,
      avoidTopics: [],
      includeLocation: true,
      trackHistory: true,
      avoidRepetitionDays: 14,
      creativityLevel: 'medium'
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
