import { genAI, getTextModelName } from '@/lib/ai/gemini';

/**
 * Module 4: Family Auto-Poster - Prompt Refiner Service
 * Simple refinement for manual prompt entry
 */
export const Module4PromptRefiner = {
  /**
   * Refine a family prompt template (manual entry)
   * Used when user manually creates/edits prompt templates
   */
  async refinePrompt(basePrompt: string, familyContext: string): Promise<string> {
    try {
      const modelName = getTextModelName();

      const refinementPrompt = `Enhance this family scene prompt template.

BASE PROMPT: "${basePrompt}"
FAMILY CONTEXT: ${familyContext}

Requirements:
- Include family relationship naturally
- Add scene details naturally
- Under 200 characters

Output refined prompt only.`;

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
        return basePrompt;
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
      return basePrompt;
    }
  },
};
