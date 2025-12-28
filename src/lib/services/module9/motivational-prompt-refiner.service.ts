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

      // Get time-based context for more variation
      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = now.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isMonday = dayOfWeek === 1;
      const isFriday = dayOfWeek === 5;
      
      let timeContext = '';
      if (hour < 12) {
        timeContext = 'morning inspiration to start the day strong';
      } else if (hour < 17) {
        timeContext = 'afternoon motivation to keep pushing forward';
      } else {
        timeContext = 'evening reflection and tomorrow\'s possibilities';
      }
      
      let dayContext = '';
      if (isMonday) {
        dayContext = ' (Monday fresh start theme)';
      } else if (isFriday) {
        dayContext = ' (Friday celebration of progress theme)';
      } else if (isWeekend) {
        dayContext = ' (weekend growth and self-improvement theme)';
      }

      const avoidanceText = context.recentQuotes.length > 0
        ? `\n\n🚫 RECENT QUOTES (MUST BE COMPLETELY DIFFERENT - use different words, structures, and themes):\n${context.recentQuotes.map((q, i) => `${i + 1}. "${q}"`).join('\n')}`
        : '';

      const templateText = context.quoteTemplate
        ? `\n\n💡 QUOTE TEMPLATE (Use as loose inspiration but transform it completely):\n"${context.quoteTemplate}"`
        : '';

      // Random variation in prompt structure for more diversity
      const variations = [
        'a powerful one-liner that hits hard',
        'an actionable call-to-action quote',
        'a thought-provoking question-based quote',
        'a metaphor-rich inspirational statement',
        'a contrast-based quote (before vs after mindset)',
        'a future-focused vision statement',
      ];
      const randomVariation = variations[Math.floor(Math.random() * variations.length)];

      const generationPrompt = `You are an elite motivational content creator for Instagram, known for creating UNIQUE quotes that go viral.

📊 GENERATION PARAMETERS:
• CATEGORY: ${context.category}
• THEME: ${context.themeDescription}
• CONTENT TYPE: ${context.contentType}
• VISUAL STYLE: ${context.style}
• TIME CONTEXT: ${timeContext}${dayContext}
• VARIATION TYPE: ${randomVariation}${templateText}${avoidanceText}

🎯 YOUR MISSION: Create a COMPLETELY ORIGINAL motivational quote that has NEVER been seen before.

✨ **Quote Requirements**:
   - Length: ${context.contentType === 'video' ? '60-120 characters (for video overlay)' : '50-100 characters (for image text)'}
   - Style: ${randomVariation}
   - Must be 100% unique - NO common motivational phrases
   - Use unexpected word combinations and fresh perspectives
   - Make it instantly shareable and memorable
   - Attribution: "Unknown" (or real famous person if naturally fitting)
   - Vary the structure: try different formats each time
   
💡 **Creative Techniques to Use**:
   - Play with contrasts and paradoxes
   - Use powerful action verbs
   - Include numbers or specific details when relevant
   - Create rhythm and cadence
   - End with impact - last word should be memorable
   - Avoid: "Don't", "Never", negative phrasing (stay positive)

🎨 **Visual Prompt Requirements** (for AI ${context.contentType} generation):
   - Style: ${context.style} aesthetic with modern Instagram appeal
   ${context.contentType === 'image' ? `
   - Composition: Rule of thirds, dynamic balance
   - Typography: Bold, readable, artistically placed
   - Colors: Trending palettes (gradients, neons, pastels, or bold contrasts)
   - Elements: Abstract shapes, geometric patterns, natural textures
   - Depth: Layered composition with foreground/background separation
   - Lighting: Dramatic or soft mood lighting` : `
   - Motion: Smooth, cinematic camera movements
   - Animation: Text reveals, zoom effects, particle systems
   - Transitions: Seamless flow between scenes
   - Dynamics: Kinetic typography, morphing shapes
   - Effects: Glow, light leaks, bokeh, film grain
   - Duration: 5-10 second loop potential`}
   - Professional quality, Instagram-optimized
   - NO people, faces, or hands (purely abstract/symbolic)
   - Make it VISUALLY DISTINCTIVE from typical motivational posts

📱 **Hashtag Strategy**:
   - 12-15 hashtags total
   - Mix: 3 trending (#motivation), 5 niche (category-specific), 4 branded
   - All lowercase, no spaces
   - Focus on ${context.category} + ${context.style} keywords
   - Include 2-3 action hashtags (#hustlehard #growthmindset)

🔒 SAFETY & BRAND GUIDELINES:
✓ Family-friendly, universally appropriate
✓ Empowering, never preachy
✓ Action-oriented, not passive
✓ Inclusive language
✗ No clichés ("shoot for the moon", "every cloud", etc.)
✗ No religious/political content
✗ No gender-specific pronouns

📦 OUTPUT FORMAT (Valid JSON):
{
  "quoteText": "Your completely unique quote here",
  "author": "Unknown",
  "visualPrompt": "Ultra-detailed visual description for AI generation (150+ words)",
  "suggestedHashtags": "#motivation #success #inspiration #mindset ..."
}

🚀 REMEMBER: The goal is to create something that makes people stop scrolling. Be bold, be different, be memorable!`;

      console.log('🤖 [Module 9] Generating motivational quote with Gemini AI...');
      console.log('   Category:', context.category, '| Style:', context.style, '| Time:', timeContext);

      // Note: Using higher randomness through prompt engineering since generationConfig
      // temperature is not supported in this Gemini API version
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

      // Check for similarity with recent quotes (basic deduplication)
      const generatedQuote = parsed.quoteText.toLowerCase().trim();
      const isTooSimilar = context.recentQuotes.some(recent => {
        const recentLower = recent.toLowerCase().trim();
        // Check if quotes are identical or very similar (>70% word overlap)
        if (generatedQuote === recentLower) return true;
        
        const genWords = new Set(generatedQuote.split(/\s+/));
        const recentWords = new Set(recentLower.split(/\s+/));
        const genWordsArray = Array.from(genWords) as string[];
        const intersection = new Set(genWordsArray.filter(w => recentWords.has(w)));
        const similarity = intersection.size / Math.min(genWords.size, recentWords.size);
        
        return similarity > 0.7; // 70% word overlap threshold
      });

      if (isTooSimilar) {
        console.warn('⚠️ [Module 9] Generated quote too similar to recent ones, retrying...');
        // Retry once with different variation
        if (!context.recentQuotes.includes('__RETRY__')) {
          return this.generateUniqueQuote({
            ...context,
            recentQuotes: [...context.recentQuotes, generatedQuote, '__RETRY__'],
          });
        }
      }

      console.log('✅ [Module 9] Generated unique motivational quote');
      console.log('   Quote:', parsed.quoteText.substring(0, 60) + '...');

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
