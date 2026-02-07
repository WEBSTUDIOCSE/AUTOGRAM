import { genAI, getTextModelName } from '@/lib/ai/gemini';

/**
 * Module 1: AI Generator - Prompt Refiner Service
 * Simple enhancement for manual image generation
 */
export const Module1PromptRefiner = {
  /**
   * Refine a user prompt for manual image generation
   * SIMPLE enhancement - no complex variations
   */
  async refinePrompt(userPrompt: string): Promise<string> {
    try {
      const modelName = getTextModelName();

      // Ultra-concise refinement instructions
      const refinementPrompt = `Enhance this image prompt for photorealistic generation.

USER PROMPT: "${userPrompt}"

Photorealistic, ultra‑realistic: ${userPrompt}, natural soft lighting, subtle shadows, 50mm lens, eye‑level angle, shallow depth of field, sharp focus on subject, background bokeh, realistic textures and skin tones, balanced composition, professional photography style.

Keep it under 500 characters. Output refined prompt only.`;

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
        return userPrompt;
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

      return refinedPrompt;

    } catch (error) {
      return userPrompt;
    }
  },
};
