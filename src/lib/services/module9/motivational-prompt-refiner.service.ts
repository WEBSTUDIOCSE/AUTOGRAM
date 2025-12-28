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
  title: string; // Short catchy title for caption
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

📝 **Title Requirements**:
   - Create a SHORT catchy title (3-6 words)
   - This will be the Instagram caption header
   - Should capture the essence of the quote
   - Examples: "Rise Above Limits", "Your Power Moment", "Break The Cycle"
   
💡 **Creative Techniques to Use**:
   - Play with contrasts and paradoxes
   - Use powerful action verbs
   - Include numbers or specific details when relevant
   - Create rhythm and cadence
   - End with impact - last word should be memorable
   - Avoid: "Don't", "Never", negative phrasing (stay positive)

🎨 **Visual Prompt Requirements** (for AI ${context.contentType} generation):
   ${context.style === 'custom' ? `
   - BACKGROUND: Pure black background (#000000), completely solid
   - QUOTE TEXT: The complete quote must be prominently displayed as the main element
   - TYPOGRAPHY: White, bold, modern sans-serif font (like Helvetica or Open Sans)
   - TEXT SIZE: Large enough to be easily readable on mobile (minimum 24px equivalent)
   - TEXT PLACEMENT: Perfectly centered both horizontally and vertically
   - TEXT FORMATTING: Multi-line layout if needed, with proper line spacing (1.4x line height)
   - CONTRAST: Maximum contrast - pure white text on pure black background
   - NO DECORATIONS: No graphics, icons, shapes, or decorative elements
   - NO AUTHOR ON IMAGE: Only the quote text, author will be in caption
   - PADDING: Generous margins around text (20% minimum from all edges)
   - TEXT HIERARCHY: Quote text should be the only visual element
   - READABILITY: Font weight should be bold/semi-bold for clarity
   - PROFESSIONAL: Clean, minimalist design focusing purely on typography` : `
   - QUOTE INTEGRATION: The complete motivational quote MUST be embedded in the image as readable text
   - TYPOGRAPHY: Professional, bold fonts with high readability
   - TEXT PLACEMENT: Quote text should be the focal point - large, prominent, and perfectly readable
   - FONT STYLE: Modern sans-serif or elegant serif fonts (like Montserrat, Poppins, or Playfair Display)
   - TEXT SIZE: Large enough to read easily on mobile devices
   - TEXT COLOR: High contrast with background (white on dark, dark on light)
   - TEXT EFFECTS: Subtle shadows, outlines, or glows if needed for readability
   - BACKGROUND: ${context.style} aesthetic with Instagram-worthy visual appeal
   ${context.contentType === 'image' ? `
   - COMPOSITION: Balanced layout with quote as the hero element
   - VISUAL ELEMENTS: Abstract shapes, gradients, or textures that complement but don't compete with text
   - COLOR PALETTE: Trending Instagram colors - gradients, pastels, or bold contrasts
   - DEPTH: Layered design with text in foreground, visuals in background
   - MOOD: Inspiring and uplifting visual atmosphere
   - LIGHTING: Soft or dramatic lighting that enhances text readability` : `
   - MOTION: Smooth text animations, kinetic typography
   - TEXT REVEAL: Dynamic text appearance effects
   - BACKGROUND ANIMATION: Subtle moving elements that don't distract from text
   - TRANSITIONS: Elegant text transitions and effects
   - CINEMATIC: Professional video quality with smooth movements
   - DURATION: 5-10 second loops with text fully visible for reading`}
   - MOBILE OPTIMIZED: Perfect for Instagram square (1:1) format
   - NO FACES/PEOPLE: Abstract, symbolic, or landscape elements only
   - TEXT READABILITY: Ensure quote is 100% readable and prominent
   - BRAND QUALITY: Professional, polished, and visually striking
   - QUOTE PROMINENCE: The quote text should be the undisputed main element`}

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
  "title": "Short Catchy Title", 
  "author": "Unknown",
  "visualPrompt": "Create a ${context.style === 'custom' ? 'minimalist black background image' : `${context.style} style ${context.contentType}`} with the text '[INSERT COMPLETE QUOTE TEXT HERE]' prominently displayed. [Continue with detailed 150+ word visual description including typography, layout, colors, and styling specifications. The quote text must be the main focal point and completely readable.]",
  "suggestedHashtags": "#motivation #success #inspiration #mindset ..."
}

🔑 CRITICAL INSTRUCTION FOR VISUAL PROMPT:
- You MUST include the exact quote text in the visualPrompt using the placeholder "[INSERT COMPLETE QUOTE TEXT HERE]"
- Replace this placeholder with the actual quote you generated
- The visual prompt should describe HOW to display this specific quote text beautifully
- Example: "Create a modern gradient background with the motivational text 'Your dreams are closer than you think' displayed in bold white Montserrat font, centered vertically..."

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

      // Ensure visual prompt includes the actual quote text
      let processedVisualPrompt = parsed.visualPrompt;
      if (!processedVisualPrompt.includes(parsed.quoteText) && 
          !processedVisualPrompt.includes('[INSERT COMPLETE QUOTE TEXT HERE]')) {
        // Add quote text to visual prompt if not included
        processedVisualPrompt = `Create a ${context.style === 'custom' ? 'minimalist black background image' : `${context.style} style ${context.contentType}`} featuring the motivational quote "${parsed.quoteText}" as the main text element. ${processedVisualPrompt}`;
      } else if (processedVisualPrompt.includes('[INSERT COMPLETE QUOTE TEXT HERE]')) {
        // Replace placeholder with actual quote
        processedVisualPrompt = processedVisualPrompt.replace('[INSERT COMPLETE QUOTE TEXT HERE]', parsed.quoteText);
      }

      // Enhance visual prompt with specific typography instructions
      if (!processedVisualPrompt.toLowerCase().includes('font') && !processedVisualPrompt.toLowerCase().includes('typography')) {
        const typographyEnhancement = context.style === 'custom' 
          ? ' Use clean, bold sans-serif typography in pure white color against the black background.'
          : ' Use modern, readable typography with high contrast and professional styling.';
        processedVisualPrompt += typographyEnhancement;
      }

      console.log('✅ [Module 9] Visual prompt enhanced with quote text integration');

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
        title: parsed.title?.trim() || this.generateTitleFromQuote(parsed.quoteText),
        author: parsed.author || 'Unknown',
        visualPrompt: processedVisualPrompt.trim(),
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
      ? `Create a ${context.style === 'custom' ? 'minimalist black background image' : `${context.style} style image`} featuring the motivational quote "${quoteText}" as the main text element. Use ${context.style === 'custom' ? 'clean white typography on pure black background' : 'modern, readable typography with high contrast'}. Center the text with generous padding and ensure maximum readability on mobile devices.`
      : `Create a ${context.style} style video with the motivational text "${quoteText}" prominently displayed. Use smooth text animations, elegant transitions, and modern typography. The quote should be the focal point with cinematic quality.`;

    return {
      quoteText,
      title: this.generateTitleFromQuote(quoteText),
      author: 'Unknown',
      visualPrompt,
      suggestedHashtags: '#motivation #inspiration #success #mindset #quotes #dailyinspiration #personalgrowth #positivevibes #lifequotes #wisdom',
    };
  },

  /**
   * Generate a short title from quote text
   */
  generateTitleFromQuote(quoteText: string): string {
    // Take first 3-6 words as title
    const words = quoteText.split(' ').slice(0, 4);
    return words.join(' ').replace(/[.,!?]$/, '');
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
