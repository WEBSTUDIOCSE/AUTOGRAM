import { genAI, getTextModelName } from '@/lib/ai/gemini';
import type { FamilyProfile } from '@/lib/firebase/config/types';

/**
 * Module 4: Family Auto-Poster - AI Prompt Generator
 * Generates UNIQUE, VARIED family scene prompts
 * Prevents repetitive content by using AI creativity
 */

interface FamilyGenerationContext {
  timeOfDay: string;
  season: string;
  recentScenes: string[]; // Last 10 scenes to avoid repetition
  memberCount: number;
  familyType: string;
}

export const Module4PromptGenerator = {
  /**
   * Generate a UNIQUE family prompt with AI-powered variation
   * This is called by Firebase triggers for auto-posting
   */
  async generateUniquePrompt(
    profile: FamilyProfile,
    basePrompt: string,
    context: FamilyGenerationContext
  ): Promise<string> {
    try {
      const modelName = getTextModelName();

      // Build family description
      const familyDesc = `${profile.profileName} (${context.memberCount} members)`;

      // Build avoidance list
      const avoidanceText = context.recentScenes.length > 0
        ? `\nRECENT SCENES (DO NOT REPEAT): ${context.recentScenes.join(', ')}`
        : '';

      const generationPrompt = `You are creating a UNIQUE family scene for an auto-posting system.

FAMILY: ${familyDesc}
BASE STYLE: "${basePrompt}"
TIME: ${context.timeOfDay}
SEASON: ${context.season}${avoidanceText}

YOUR TASK: Create a NEW, SPECIFIC family scene that:
1. Shows genuine family interaction
2. Is COMPLETELY DIFFERENT from recent scenes
3. Has specific details (location, activity, mood)
4. Feels warm, natural, and photorealistic
5. Under 200 characters
6. Includes all family members naturally

Be CREATIVE and SPECIFIC with unique scenarios.
Avoid repeating any elements from recent scenes.
Output the prompt only, no explanations.`;

      console.log('🤖 [Module 4] Generating AI-varied family prompt...');

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

      console.log('✅ [Module 4] Generated unique family prompt:', generatedPrompt.length, 'chars');
      return generatedPrompt;

    } catch (error) {
      console.error('❌ [Module 4] Generation error:', error);
      return this.createSimpleVariation(basePrompt, context);
    }
  },

  /**
   * Fallback: Use base prompt with minimal variation if AI fails
   */
  createSimpleVariation(basePrompt: string, context: FamilyGenerationContext): string {
    // Just use the base prompt - no hardcoded variations
    const timeContext = `${context.timeOfDay}, ${context.season}`;
    return `${basePrompt}, ${timeContext}, photorealistic`;
  },

  /**
   * Get context for generation (time, season, recent history)
   */
  getGenerationContext(
    profile: FamilyProfile,
    recentPosts: string[] = []
  ): FamilyGenerationContext {
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
      memberCount: profile.members.length,
      familyType: profile.profileName,
    };
  },
};
