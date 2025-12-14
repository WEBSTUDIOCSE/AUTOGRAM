import { genAI, getTextModelName } from '@/lib/ai/gemini';

/**
 * Module 2: Character Generator - Prompt Refiner Service
 * Character-consistent prompt enhancement
 */
export const Module2PromptRefiner = {
  /**
   * Refine a character scene prompt
   * Maintains "this person" for consistency with reference image
   */
  async refineCharacterPrompt(scenePrompt: string): Promise<string> {
    try {
      const modelName = getTextModelName();

      const refinementPrompt = `Enhance this character scene prompt for photorealistic generation.

SCENE PROMPT: "${scenePrompt}"

Requirements:
- MUST use "this person" or "this character" for consistency
- Add photography details naturally
- Keep under 200 characters

Output refined prompt only.`;

      console.log('🎨 [Module 2] Refining character prompt...');

      const response = await genAI.models.generateContent({
        model: modelName,
        contents: refinementPrompt,
      });

      let refinedPrompt = '';
      
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.text) {
            refinedPrompt = part.text.trim();
            break;
          }
        }
      }

      if (!refinedPrompt) {
        console.warn('No refined prompt received, using original');
        return scenePrompt;
      }

      // Clean and truncate
      refinedPrompt = refinedPrompt
        .replace(/^(Refined prompt:|Enhanced prompt:)/i, '')
        .replace(/^["']|["']$/g, '')
        .trim();

      const MAX_LENGTH = 250;
      if (refinedPrompt.length > MAX_LENGTH) {
        refinedPrompt = refinedPrompt.substring(0, MAX_LENGTH).trim();
        const lastSpace = refinedPrompt.lastIndexOf(' ');
        if (lastSpace > MAX_LENGTH * 0.8) {
          refinedPrompt = refinedPrompt.substring(0, lastSpace).trim();
        }
      }

      console.log('✅ [Module 2] Refined:', refinedPrompt.length, 'chars');
      return refinedPrompt;

    } catch (error) {
      console.error('❌ [Module 2] Refinement error:', error);
      return scenePrompt;
    }
  },
};
