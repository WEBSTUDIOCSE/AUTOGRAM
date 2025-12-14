import { genAI, getTextModelName } from '@/lib/ai/gemini';
import type { Character } from '@/lib/firebase/config/types';

/**
 * Module 3: Auto-Poster - AI Prompt Generator
 * Generates UNIQUE, VARIED prompts for automatic posting
 * Prevents repetitive content by using AI creativity
 */

interface GenerationContext {
  timeOfDay: string;
  season: string;
  recentScenes: string[]; // Last 10 scenes to avoid repetition
}

export const Module3PromptGenerator = {
  /**
   * Generate a UNIQUE prompt with AI-powered variation
   * This is called by Firebase triggers for auto-posting
   */
  async generateUniquePrompt(
    character: Character,
    basePrompt: string,
    context: GenerationContext
  ): Promise<string> {
    try {
      const modelName = getTextModelName();

      // Build avoidance list
      const avoidanceText = context.recentScenes.length > 0
        ? `\nRECENT SCENES (DO NOT REPEAT): ${context.recentScenes.join(', ')}`
        : '';

      const generationPrompt = `You are creating a UNIQUE scene for this character in an auto-posting system.

CHARACTER: ${character.name}
BASE STYLE: "${basePrompt}"
TIME: ${context.timeOfDay}
SEASON: ${context.season}${avoidanceText}

YOUR TASK: Create a NEW, SPECIFIC scene that:
1. Uses "this person" for character consistency
2. Is COMPLETELY DIFFERENT from recent scenes
3. Has specific details (location, activity, lighting, mood)
4. Feels fresh and creative
5. Under 200 characters
6. Photorealistic style

Create a unique scenario that stands out from recent posts.
Be CREATIVE and SPECIFIC. Avoid generic descriptions.
Output the prompt only, no explanations.`;

      console.log('🤖 [Module 3] Generating AI-varied prompt...');

      const response = await genAI.models.generateContent({
        model: modelName,
        contents: generationPrompt,
      });

      let generatedPrompt = '';
      
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.text) {
            generatedPrompt = part.text.trim();
            break;
          }
        }
      }

      if (!generatedPrompt) {
        console.warn('AI generation failed, using base prompt with random variation');
        return this.createSimpleVariation(basePrompt, context);
      }

      // Clean and truncate
      generatedPrompt = generatedPrompt
        .replace(/^(Prompt:|Scene:)/i, '')
        .replace(/^["']|["']$/g, '')
        .trim();

      const MAX_LENGTH = 250;
      if (generatedPrompt.length > MAX_LENGTH) {
        generatedPrompt = generatedPrompt.substring(0, MAX_LENGTH).trim();
        const lastSpace = generatedPrompt.lastIndexOf(' ');
        if (lastSpace > MAX_LENGTH * 0.8) {
          generatedPrompt = generatedPrompt.substring(0, lastSpace).trim();
        }
      }

      console.log('✅ [Module 3] Generated unique prompt:', generatedPrompt.length, 'chars');
      return generatedPrompt;

    } catch (error) {
      console.error('❌ [Module 3] Generation error:', error);
      return this.createSimpleVariation(basePrompt, context);
    }
  },

  /**
   * Fallback: Use base prompt with minimal variation if AI fails
   */
  createSimpleVariation(basePrompt: string, context: GenerationContext): string {
    // Use base prompt with time context - no hardcoded content
    return `this person ${basePrompt}, ${context.timeOfDay}, ${context.season}, photorealistic`;
  },

  /**
   * Get context for generation (time, season, recent history)
   */
  getGenerationContext(recentPosts: string[] = []): GenerationContext {
    const hour = new Date().getHours();
    let timeOfDay = 'afternoon';
    if (hour < 6) timeOfDay = 'early morning';
    else if (hour < 12) timeOfDay = 'morning';
    else if (hour < 17) timeOfDay = 'afternoon';
    else if (hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    const month = new Date().getMonth();
    let season = 'summer';
    if (month >= 2 && month <= 4) season = 'spring';
    else if (month >= 5 && month <= 8) season = 'summer';
    else if (month >= 9 && month <= 10) season = 'autumn';
    else season = 'winter';

    return {
      timeOfDay,
      season,
      recentScenes: recentPosts.slice(0, 10), // Last 10 to avoid
    };
  },
};
