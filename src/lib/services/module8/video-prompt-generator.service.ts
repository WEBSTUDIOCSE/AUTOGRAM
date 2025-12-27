/**
 * Module 8: Video Auto-Poster - AI Prompt Generator
 * Generates UNIQUE, VARIED video prompts for automatic posting
 * Prevents repetitive content by using AI creativity
 */

import { genAI, getTextModelName } from '@/lib/ai/gemini';

interface VideoGenerationContext {
  timeOfDay: string;
  season: string;
  recentPrompts: string[]; // Last 10 prompts to avoid repetition
  videoType: 'text-to-video' | 'image-to-video';
  characterName?: string; // For image-to-video
}

export const Module8PromptGenerator = {
  /**
   * Generate a UNIQUE video prompt with AI-powered variation
   * This is called by Firebase triggers for auto-posting
   */
  async generateUniquePrompt(
    basePrompt: string,
    context: VideoGenerationContext
  ): Promise<string> {
    try {
      const modelName = getTextModelName();

      // Build avoidance list
      const avoidanceText = context.recentPrompts.length > 0
        ? `\nRECENT PROMPTS (DO NOT REPEAT): ${context.recentPrompts.join(', ')}`
        : '';

      const characterContext = context.videoType === 'image-to-video' && context.characterName
        ? `\nCHARACTER: ${context.characterName} (use "this person" for consistency)`
        : '';

      const generationPrompt = `You are creating a COMPLETELY UNIQUE video prompt for an auto-posting system.

VIDEO TYPE: ${context.videoType === 'text-to-video' ? 'Text-to-Video' : 'Image-to-Video'}
BASE STYLE REFERENCE: "${basePrompt}"
TIME: ${context.timeOfDay}
SEASON: ${context.season}${characterContext}${avoidanceText}

🚨 CRITICAL: Create a video concept with a COMPLETELY DIFFERENT TOPIC/THEME from recent prompts.
Do NOT just change location/time - change the ENTIRE CONCEPT, ACTIVITY, and SETTING.

YOUR TASK: Create a NEW video concept that:
1. ${context.videoType === 'image-to-video' ? 'Shows the character in a COMPLETELY DIFFERENT activity/scenario than before' : 'Shows a COMPLETELY DIFFERENT scene/story than before'}
2. Changes BOTH the topic AND the setting (e.g., if recent was beach → try urban/forest/studio/fantasy)
3. Changes the action/activity (e.g., if recent was dancing → try reading/cooking/exploring/creating)
4. Uses specific details (weather, emotions, colors, textures)
5. Has dynamic movement and energy
6. Under 250 characters
7. Cinematic and professional
${context.videoType === 'image-to-video' ? '8. Uses "this person" for character consistency\n9. Natural movements and authentic expressions' : '8. Dynamic camera work\n9. Engaging visual storytelling'}
10. FAMILY-FRIENDLY AND WHOLESOME - avoid any suggestive or provocative language

🚨 CONTENT SAFETY RULES (CRITICAL):
- NO suggestive words: teasing, flirty, seductive, provocative, sultry, alluring
- NO romantic/intimate scenarios: date scenes, bedroom settings, close-up gazes
- NO focus on body parts or appearance: curves, figure, physique, body
- YES to wholesome activities: cooking, reading, exploring, creating, learning, helping
- YES to positive emotions: happy, joyful, cheerful, peaceful, content, excited
- YES to safe settings: kitchen, library, park, studio, garden, cafe, market

Examples of GOOD variety:
- Beach dancing → Urban rooftop sunset meditation
- Cafe reading → Forest hiking adventure
- Party celebration → Quiet studio art creation
- Garden stroll → Library book browsing

Be BOLD. Change the ENTIRE concept. Make it feel like a different creator.
Keep it CLEAN, WHOLESOME, and FAMILY-FRIENDLY.
Output the prompt only, no explanations.`;

      console.log('🤖 [Module 8] Generating AI-varied video prompt...');

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
        .replace(/^(Prompt:|Video Concept:|Scene:)/i, '')
        .replace(/^["']|["']$/g, '')
        .trim();

      const MAX_LENGTH = 300;
      if (generatedPrompt.length > MAX_LENGTH) {
        generatedPrompt = generatedPrompt.substring(0, MAX_LENGTH).trim();
        const lastSpace = generatedPrompt.lastIndexOf(' ');
        if (lastSpace > MAX_LENGTH * 0.8) {
          generatedPrompt = generatedPrompt.substring(0, lastSpace).trim();
        }
      }

      console.log('✅ [Module 8] Generated unique video prompt:', generatedPrompt.length, 'chars');
      return generatedPrompt;

    } catch (error) {
      console.error('❌ [Module 8] Generation error:', error);
      return this.createSimpleVariation(basePrompt, context);
    }
  },

  /**
   * Fallback: Create simple variation with random elements
   */
  createSimpleVariation(basePrompt: string, context: VideoGenerationContext): string {
    const times = ['morning', 'afternoon', 'evening', 'night', 'golden hour', 'blue hour'];
    const moods = ['peaceful', 'energetic', 'dramatic', 'serene', 'vibrant', 'mysterious'];
    const movements = ['slow pan', 'smooth tracking', 'gentle zoom', 'dynamic rotation', 'steady glide'];
    
    const randomTime = times[Math.floor(Math.random() * times.length)];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    const randomMovement = movements[Math.floor(Math.random() * movements.length)];

    if (context.videoType === 'image-to-video') {
      return `${basePrompt}, ${randomMood} atmosphere, ${randomTime} lighting, cinematic ${randomMovement} camera movement`;
    } else {
      return `${basePrompt}, ${randomMood} mood, ${randomTime} setting, professional cinematography with ${randomMovement}`;
    }
  },

  /**
   * Get time of day context
   */
  getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 20) return 'evening';
    return 'night';
  },

  /**
   * Get current season
   */
  getSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  },
};
