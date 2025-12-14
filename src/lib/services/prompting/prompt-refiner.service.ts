import { genAI, getTextModelName } from '@/lib/ai/gemini';

/**
 * World-Class Prompt Refiner Service
 * Intelligently enhances prompts with context-aware, dynamic improvements
 * No hardcoded patterns - fully adaptive to user input
 */
export const PromptRefinerService = {
  /**
   * Refine a user prompt with intelligent, context-aware enhancements
   * @param userPrompt - Original user prompt
   * @returns Refined prompt with dynamic improvements
   */
  async refinePrompt(userPrompt: string): Promise<string> {
    try {
      const modelName = getTextModelName();

      const refinementPrompt = `You are a professional photography prompt writer.

USER PROMPT: "${userPrompt}"

CRITICAL: Output must be UNDER 200 characters (strict API limit).

TASK: Enhance this prompt for photorealistic images. Be EXTREMELY concise:

1. Keep core subject exactly as user described
2. Add 1-2 photography terms only (lighting OR composition OR camera)
3. Make it sound natural, not robotic
4. NO generic terms like "golden hour", "bokeh", "rule of thirds" - be creative
5. ULTRA-CONCISE - every word must matter

RULES:
- MAXIMUM 200 CHARACTERS (strict limit)
- Preserve user's vision completely
- Add minimal, high-impact enhancements only
- Natural language, not a checklist
- If prompt is good, barely change it

OUTPUT: Refined prompt only. NO explanations. UNDER 200 CHARACTERS MANDATORY.`;

      console.log('🎨 Refining prompt with intelligent analysis...');

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
        throw new Error('No refined prompt received');
      }

      // Clean up any remaining wrapper text
      refinedPrompt = refinedPrompt
        .replace(/^(Refined prompt:|Enhanced prompt:|Here's the refined prompt:)/i, '')
        .replace(/^["']|["']$/g, '')
        .trim();

      // Enforce STRICT character limit
      const MAX_LENGTH = 250; // Safe limit for most APIs
      if (refinedPrompt.length > MAX_LENGTH) {
        console.warn(`⚠️ Refined prompt too long (${refinedPrompt.length} chars), truncating to ${MAX_LENGTH}`);
        // Smart truncation at last complete word
        refinedPrompt = refinedPrompt.substring(0, MAX_LENGTH).trim();
        const lastSpace = refinedPrompt.lastIndexOf(' ');
        if (lastSpace > MAX_LENGTH * 0.8) {
          refinedPrompt = refinedPrompt.substring(0, lastSpace).trim();
        }
        // Add ellipsis if truncated mid-sentence
        if (!refinedPrompt.endsWith('.') && !refinedPrompt.endsWith(',')) {
          refinedPrompt += '...';
        }
      }

      console.log('✅ Prompt refined successfully');
      console.log('📝 Original:', userPrompt, `(${userPrompt.length} chars)`);
      console.log('✨ Refined:', refinedPrompt, `(${refinedPrompt.length} chars)`);

      return refinedPrompt;

    } catch (error) {
      console.error('❌ Prompt refinement error:', error);
      // Return original prompt on error
      return userPrompt;
    }
  },

  /**
   * Refine a character scene prompt with intelligent context awareness
   * @param characterName - Name of the character
   * @param scenePrompt - Original scene description
   * @returns Refined prompt maintaining character consistency
   */
  async refineCharacterPrompt(characterName: string, scenePrompt: string): Promise<string> {
    try {
      const modelName = getTextModelName();

      const refinementPrompt = `You are a professional photography prompt writer for character scenes.

CHARACTER: ${characterName}
SCENE: "${scenePrompt}"

CRITICAL: Output UNDER 200 characters (strict API limit).

TASK: Enhance scene while keeping character consistency. Be EXTREMELY concise:

MANDATORY:
- ALWAYS use "this character" or "this person" (NEVER character name)
- Character is MAIN SUBJECT
- Keep it ULTRA-CONCISE

RULES:
1. Add 1-2 photography details only (lighting OR angle OR setting)
2. Natural language, not a list
3. NO generic terms - be creative
4. MAXIMUM 200 CHARACTERS (strict limit)
5. Preserve scene essence completely

OUTPUT: Refined prompt only. NO explanations. UNDER 200 CHARACTERS MANDATORY.`;

      console.log('🎨 Refining character scene prompt with intelligent analysis...');

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
        throw new Error('No refined prompt received');
      }

      // Clean up any remaining wrapper text
      refinedPrompt = refinedPrompt
        .replace(/^(Refined prompt:|Enhanced prompt:|Here's the refined prompt:)/i, '')
        .replace(/^["']|["']$/g, '')
        .trim();

      // Enforce STRICT character limit
      const MAX_LENGTH = 250; // Safe limit for most APIs
      if (refinedPrompt.length > MAX_LENGTH) {
        console.warn(`⚠️ Refined character prompt too long (${refinedPrompt.length} chars), truncating to ${MAX_LENGTH}`);
        // Smart truncation at last complete word
        refinedPrompt = refinedPrompt.substring(0, MAX_LENGTH).trim();
        const lastSpace = refinedPrompt.lastIndexOf(' ');
        if (lastSpace > MAX_LENGTH * 0.8) {
          refinedPrompt = refinedPrompt.substring(0, lastSpace).trim();
        }
        // Add ellipsis if truncated mid-sentence
        if (!refinedPrompt.endsWith('.') && !refinedPrompt.endsWith(',')) {
          refinedPrompt += '...';
        }
      }

      console.log('✅ Character prompt refined successfully');
      console.log('📝 Original:', scenePrompt, `(${scenePrompt.length} chars)`);
      console.log('✨ Refined:', refinedPrompt, `(${refinedPrompt.length} chars)`);

      return refinedPrompt;

    } catch (error) {
      console.error('❌ Character prompt refinement error:', error);
      // Return original prompt on error
      return scenePrompt;
    }
  },
};
