/**
 * Module 9: Motivational Quote Prompt Refiner
 * Uses AI to generate unique motivational quotes and visual prompts
 */

import { genAI, getTextModelName } from '@/lib/ai/gemini';

interface MotivationalGenerationContext {
  category: string; // 'success', 'mindset', 'motivation', 'inspiration', 'life', 'wisdom'
  themeDescription: string;
  contentType: 'image' | 'video';
  style: string;
  recentQuotes: string[]; // Last 10 quotes to avoid repetition
  quoteTemplate?: string; // Optional template to base on
}

interface GeneratedMotivationalContent {
  quoteText: string;
  author?: string;
  visualPrompt: string; // For AI image/video generation
  suggestedHashtags: string;
}

export const MotivationalPromptRefinerService = {
  /**
   * Generate a unique motivational quote with visual prompt
   */
  async generateUniqueQuote(context: MotivationalGenerationContext): Promise<GeneratedMotivationalContent> {
    try {
      const modelName = getTextModelName();

      const avoidanceText = context.recentQuotes.length > 0
        ? `\n\nRECENT QUOTES (DO NOT REPEAT):\n${context.recentQuotes.map((q, i) => `${i + 1}. "${q}"`).join('\n')}`
        : '';

      const templateText = context.quoteTemplate
        ? `\n\nQUOTE TEMPLATE (Use as inspiration but make it unique):\n"${context.quoteTemplate}"`
        : '';

      const generationPrompt = `You are a motivational content creator generating inspiring quotes for Instagram.

CATEGORY: ${context.category}
THEME: ${context.themeDescription}
CONTENT TYPE: ${context.contentType}
VISUAL STYLE: ${context.style}${templateText}${avoidanceText}

🎯 YOUR TASK: Generate a completely NEW and UNIQUE motivational quote that:

1. **Quote Requirements**:
   - Short and impactful (max 100 characters for ${context.contentType})
   - Inspiring and actionable
   - Fits the ${context.category} category
   - Completely different from recent quotes
   - Can be attributed to "Unknown" or a famous person (if appropriate)
   - No clichés or overused phrases

2. **Visual Prompt Requirements** (for AI ${context.contentType} generation):
   - Describe the visual scene/composition
   - Match the ${context.style} style
   - For IMAGE: Static composition, typography, colors, mood
   - For VIDEO: Motion, transitions, camera movement, dynamic elements
   - Include: background, text placement, visual effects, atmosphere
   - Professional and Instagram-ready aesthetic
   - NO people or faces (abstract/symbolic visuals only)

3. **Hashtag Requirements**:
   - 10-15 relevant hashtags
   - Mix of popular and niche tags
   - Motivational/inspirational focus
   - No spaces, all lowercase

🚨 CONTENT SAFETY RULES:
- Family-friendly and appropriate for all audiences
- Positive and uplifting tone
- No controversial topics
- No religious or political content
- Focus on universal themes: growth, success, perseverance, wisdom

OUTPUT FORMAT (JSON):
{
  "quoteText": "Your inspiring quote here",
  "author": "Unknown" or "Famous Person Name",
  "visualPrompt": "Detailed visual description for AI generation",
  "suggestedHashtags": "#motivation #success #inspiration ..."
}`;

      console.log('🤖 [Module 9] Generating motivational quote with Gemini AI...');

      const response = await genAI.models.generateContent({
        model: modelName,
        contents: generationPrompt,
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
        throw new Error('AI generation returned no content');
      }

      // Parse JSON response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response as JSON');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate response
      if (!parsed.quoteText || !parsed.visualPrompt) {
        throw new Error('AI response missing required fields');
      }

      console.log('✅ [Module 9] Generated unique motivational quote');

      return {
        quoteText: parsed.quoteText.trim(),
        author: parsed.author || 'Unknown',
        visualPrompt: parsed.visualPrompt.trim(),
        suggestedHashtags: parsed.suggestedHashtags || '#motivation #inspiration #success',
      };

    } catch (error) {
      console.error('❌ [Module 9] Quote generation error:', error);
      
      // Fallback to simple generation
      return this.generateFallbackQuote(context);
    }
  },

  /**
   * Fallback quote generation (if AI fails)
   */
  generateFallbackQuote(context: MotivationalGenerationContext): GeneratedMotivationalContent {
    const fallbackQuotes = {
      success: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      mindset: "Your mindset is everything. What you think, you become.",
      motivation: "Don't watch the clock; do what it does. Keep going.",
      inspiration: "The only way to do great work is to love what you do.",
      life: "Life is 10% what happens to you and 90% how you react to it.",
      wisdom: "The wise man doesn't give the right answers, he poses the right questions.",
    };

    const quoteText = fallbackQuotes[context.category as keyof typeof fallbackQuotes] || fallbackQuotes.motivation;

    const visualPrompt = context.contentType === 'image'
      ? `Minimalist ${context.style} design with centered text, gradient background, elegant typography, modern aesthetic`
      : `Smooth text animation, ${context.style} style, gradient transitions, kinetic typography, professional motion graphics`;

    return {
      quoteText,
      author: 'Unknown',
      visualPrompt,
      suggestedHashtags: '#motivation #inspiration #success #mindset #quotes #dailyinspiration #personalgrowth #positivevibes #lifequotes #wisdom',
    };
  },

  /**
   * Refine existing quote for better visual generation
   */
  async refineQuotePrompt(quoteText: string, contentType: 'image' | 'video', style: string): Promise<string> {
    try {
      const modelName = getTextModelName();

      const prompt = `Create a detailed visual prompt for AI ${contentType} generation based on this motivational quote:

"${quoteText}"

CONTENT TYPE: ${contentType}
STYLE: ${style}

Generate a detailed visual description that:
- Matches the quote's theme and emotion
- Describes composition, colors, mood, atmosphere
- ${contentType === 'video' ? 'Includes motion, transitions, and camera movements' : 'Focuses on static composition and typography'}
- Professional and Instagram-ready
- NO people or faces (abstract/symbolic only)
- ${style} aesthetic

Output only the visual prompt description, no other text.`;

      const response = await genAI.models.generateContent({
        model: modelName,
        contents: prompt,
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

      return refinedPrompt || `${style} ${contentType} with motivational quote: ${quoteText}`;

    } catch (error) {
      console.error('Error refining quote prompt:', error);
      return `${style} ${contentType} with motivational quote: ${quoteText}`;
    }
  },
};
