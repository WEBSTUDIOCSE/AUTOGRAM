import { genAI, getTextModelName } from '@/lib/ai/gemini';

/**
 * Prompt Refiner Service
 * Enhances user prompts with professional photography and artistic terms
 */
export const PromptRefinerService = {
  /**
   * Refine a user prompt to generate photorealistic, high-quality images
   * @param userPrompt - Original user prompt
   * @returns Refined prompt with photography details
   */
  async refinePrompt(userPrompt: string): Promise<string> {
    try {
      const modelName = getTextModelName();

      const refinementPrompt = `You are an expert AI image generation prompt engineer. Refine the following prompt to create photorealistic, professional-quality images.

Original prompt: "${userPrompt}"

Enhance this prompt by adding:
1. **Photography terms**: Camera angles (eye-level, bird's eye, low angle, etc.)
2. **Lens specifications**: (50mm portrait lens, wide-angle 24mm, telephoto 85mm, etc.)
3. **Lighting details**: (natural sunlight, golden hour, studio lighting, soft diffused light, dramatic shadows, etc.)
4. **Fine details**: (sharp focus, bokeh background, texture details, color grading, etc.)
5. **Composition**: (rule of thirds, centered, symmetrical, leading lines, etc.)
6. **Quality markers**: (high resolution, 8K, professional photography, cinematic, etc.)

IMPORTANT:
- Keep the CORE subject and action from the original prompt
- Make it sound natural, not like a list
- Focus on photorealistic style
- Keep it under 150 words
- Don't add unrealistic or fantasy elements unless in original prompt

Return ONLY the refined prompt, nothing else.`;

      console.log('🎨 Refining prompt with AI...');

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

      console.log('✅ Prompt refined successfully');
      console.log('📝 Original:', userPrompt);
      console.log('✨ Refined:', refinedPrompt);

      return refinedPrompt;

    } catch (error) {
      console.error('❌ Prompt refinement error:', error);
      // Return original prompt on error
      return userPrompt;
    }
  },

  /**
   * Refine a character scene prompt for Module 2
   * @param characterName - Name of the character
   * @param scenePrompt - Original scene description
   * @returns Refined prompt maintaining character consistency
   */
  async refineCharacterPrompt(characterName: string, scenePrompt: string): Promise<string> {
    try {
      const modelName = getTextModelName();

      const refinementPrompt = `You are an expert AI image generation prompt engineer specializing in character-consistent scene generation.

Character: ${characterName}
Scene prompt: "${scenePrompt}"

Enhance this scene prompt by adding:
1. **Photography terms**: Camera angles, framing, perspective
2. **Lens details**: Portrait lens (85mm), shallow depth of field, etc.
3. **Lighting**: Natural light, studio lighting, golden hour, rim lighting, etc.
4. **Environment details**: Background setting, atmosphere, time of day
5. **Quality markers**: High resolution, photorealistic, professional photography

CRITICAL REQUIREMENTS:
- MUST maintain "this character" or "this person" to ensure consistency with reference image
- Keep the character as the MAIN FOCUS
- Describe the scene and setting naturally
- Add photographic/cinematic details
- Keep under 120 words
- Sound natural, not robotic

Return ONLY the refined prompt, nothing else.`;

      console.log('🎨 Refining character scene prompt...');

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

      console.log('✅ Character prompt refined successfully');
      console.log('📝 Original:', scenePrompt);
      console.log('✨ Refined:', refinedPrompt);

      return refinedPrompt;

    } catch (error) {
      console.error('❌ Character prompt refinement error:', error);
      // Return original prompt on error
      return scenePrompt;
    }
  },
};
