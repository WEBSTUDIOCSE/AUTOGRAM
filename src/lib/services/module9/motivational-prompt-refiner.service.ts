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
  language?: 'english' | 'hindi' | 'marathi'; // Language preference for quote generation
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
        ? `\n\n🚫 RECENT QUOTES - CRITICAL: MUST AVOID THESE (DO NOT use same words, themes, or similar structures):\n${context.recentQuotes.map((q, i) => `${i + 1}. "${q}"`).join('\n')}\n\n⚠️ ANTI-DUPLICATION RULES:\n- Your quote MUST have <50% word overlap with any recent quote (STRICTER than before)\n- Use COMPLETELY DIFFERENT themes, metaphors, and message angles\n- If a recent quote talks about 'dreams', talk about 'action', 'character', 'wisdom', or 'preparation' instead\n- Vary sentence structure: if recent quotes use statements, try questions or imperatives\n- Think of completely new angles and perspectives on ${context.category}\n- Avoid common motivational clichés already in the list\n- Each quote must feel FRESH and UNIQUE in message and delivery`
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

      // Add unique timestamp-based seed to prevent AI caching
      const uniqueSeed = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Add randomness context to force variation
      const randomnessBoost = Math.random() > 0.5 
        ? 'Be bold and unexpected in your word choices.' 
        : 'Use fresh perspectives and uncommon phrasing.';

      console.log(`🎲 [Generation Seed] ${uniqueSeed} | Variation: ${randomVariation}`);

      // Language configuration
      const language = context.language || 'english';
      const languageInstructions = {
        english: {
          quoteLanguage: 'English',
          instruction: 'Generate the quote in English only. Use clear, grammatically correct English.',
          textInstruction: 'ALL TEXT MUST BE IN ENGLISH. No Chinese, Arabic, or any other language characters.',
        },
        hindi: {
          quoteLanguage: 'Hindi (Devanagari script)',
          instruction: 'Generate the quote in Hindi using Devanagari script. Ensure proper Hindi grammar and authentic expressions.',
          textInstruction: 'ALL TEXT MUST BE IN HINDI (Devanagari script). Use proper Hindi words and grammar.',
        },
        marathi: {
          quoteLanguage: 'Marathi (Devanagari script)',
          instruction: 'Generate the quote in Marathi using Devanagari script. Ensure proper Marathi grammar and authentic expressions.',
          textInstruction: 'ALL TEXT MUST BE IN MARATHI (Devanagari script). Use proper Marathi words and grammar.',
        },
      };

      const langConfig = languageInstructions[language];

      const generationPrompt = `You are an elite motivational quote creator specializing in profound, meaningful wisdom that resonates deeply with audiences.

🎲 GENERATION SEED: ${uniqueSeed} - This ensures every generation is unique
🔀 RANDOMNESS BOOST: ${randomnessBoost}

STUDY THESE REFERENCE QUOTES (for inspiration on style and depth):
"The best way to predict your future is to create it."
"Whatever you are, be a good one."
"Give me six hours to chop down a tree and I will spend the first four sharpening the axe."
"I am a slow walker, but I never walk back."
"You cannot escape the responsibility of tomorrow by evading it today."
"Character is like a tree and reputation like its shadow. The shadow is what we think of it; the tree is the real thing."

📊 GENERATION PARAMETERS:
• LANGUAGE: ${langConfig.quoteLanguage} - ${langConfig.instruction}
• CATEGORY: ${context.category}
• THEME: ${context.themeDescription}
• CONTENT TYPE: ${context.contentType}
• VISUAL STYLE: ${context.style}
• TIME CONTEXT: ${timeContext}${dayContext}
• VARIATION TYPE: ${randomVariation}${templateText}${avoidanceText}

🎯 YOUR MISSION: Create a profound, ORIGINAL quote IN ${langConfig.quoteLanguage.toUpperCase()} that delivers deep wisdom and actionable insight.

✨ **Quote Requirements**:
   - Length: 80-180 characters (dynamic based on message complexity)
   - Aim for substance over brevity - let the message breathe
   - Use concrete metaphors and vivid imagery like the reference quotes
   - Focus on character, action, responsibility, and personal growth
   - Structure should be clear and memorable (use paradox, comparison, or practical wisdom)
   - Must be 100% unique - NO recycled motivational clichés
   - Should feel timeless and wise, not trendy or shallow
   - Attribution: Leave blank or use real historical figure ONLY if quote style genuinely matches
   - Prefer philosophical depth over surface-level motivation

📝 **Title Requirements**:
   - Create a SHORT catchy title (2-5 words)
   - Should capture the essence of the wisdom
   - Examples: "Shape Your Future", "The Real Thing", "Walk Forward Always"
   
💡 **Creative Techniques to Use**:
   - Use concrete metaphors (like tree/shadow, walking, building, etc.)
   - Focus on character, preparation, perseverance, wisdom
   - Create visual imagery the reader can picture
   - Include practical wisdom and life principles
   - Use comparison to reveal deeper truths
   - Build to a powerful conclusion
   - Ground abstract concepts in tangible examples
   - Balance simple language with profound meaning

🎨 **Visual Prompt Requirements** (for AI ${context.contentType} generation):
   
   🚨 CRITICAL LANGUAGE REQUIREMENT: ${langConfig.textInstruction}
   
   CRITICAL: Analyze the quote's meaning and theme FIRST, then design visuals that REFLECT that meaning.
   
   ${context.style === 'custom' ? `
   - BACKGROUND: Pure black background (#000000), completely solid
   - QUOTE TEXT: The complete quote must be prominently displayed as the main element
   - TYPOGRAPHY: Select font that matches quote's tone (modern sans-serif for action quotes, elegant serif for wisdom quotes)
   - FONT EXAMPLES: Helvetica/Open Sans for bold action, Playfair Display/Merriweather for wisdom, Montserrat for balance
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
   - THEME-MATCHED BACKGROUND: Choose background that RESONATES with the quote's message:
     * Nature/Growth quotes → Natural landscapes, forests, mountains, sunrise
     * Strength/Power quotes → Bold geometric patterns, strong architectural elements, dramatic skies
     * Wisdom/Character quotes → Textured backgrounds, aged paper, classic elements, deep colors
     * Action/Success quotes → Dynamic elements, movement, energy, vibrant gradients
     * Reflection/Life quotes → Calm scenes, water, horizons, peaceful atmospheres
   
   - QUOTE INTEGRATION: The complete motivational quote MUST be embedded in the image as readable text
   - TYPOGRAPHY: Font choice must match quote personality:
     * Wisdom/Philosophy → Elegant serif fonts (Playfair Display, Merriweather, Crimson Text)
     * Action/Motivation → Strong sans-serif (Montserrat Bold, Poppins SemiBold, Raleway Bold)
     * Life/Balance → Clean modern fonts (Inter, Nunito Sans, Source Sans Pro)
   - TEXT PLACEMENT: Quote text should be the focal point - large, prominent, and perfectly readable
   - TEXT SIZE: Large enough to read easily on mobile devices (minimum 22-28pt)
   - TEXT COLOR: Choose based on background AND quote tone (not just contrast):
     * White/Light for dark, dramatic backgrounds
     * Dark/Navy for light, calm backgrounds
     * Gold/Warm tones for wisdom quotes
     * Bold colors for action quotes
   - TEXT EFFECTS: Subtle shadows, outlines, or glows if needed for readability
   - BACKGROUND DETAILS: ${context.style} aesthetic that CONNECTS to the quote's metaphor or message
   ${context.contentType === 'image' ? `
   - COMPOSITION: Balanced layout with quote as the hero element
   - VISUAL ELEMENTS: A (15-20 high-quality hashtags):
   - 3 broad trending: #motivation #inspiration #success
   - 6-8 category-specific for ${context.category}:
     * success → #successmindset #achieveyourgoals #winnersmentality #growthmindset #hustlehard #ambition
     * mindset → #mindsetiseverything #positivevibes #mentalstrength #selfimprovement #personaldevelopment #mindfulness
     * motivation → #dailymotivation #motivationalquotes #keepgoing #nevergiveup #pushyourself #staystrong
     * inspiration → #inspiredaily #lifeinspiration #dreambig #believeinyourself #inspirationalquotes #positivity
     * life → #lifelessons #wisdom #livewell #lifequotes #truthbomb #perspective
     * wisdom → #dailywisdom #lifewisdom #wordsofwisdom #philosophy #deepthoughts #truth
   - 4-5 engagement hashtags: #quoteoftheday #quotestagram #quotesdaily #motivationalpost #instaquotes
   - 2-3 size-varied hashtags for reach: mix of 100K-500K, 500K-2M, and 2M+ post volumes
   - All lowercase, no spaces
   - Include action-oriented tags based on quote theme
   - Avoid generic or oversaturated hashtags
   - DEPTH: Layered design with text in foreground, thematic visuals in background
   - MOOD: Visual atmosphere that AMPLIFIES the quote's message
   - LIGHTING: Lighting that matches quote tone (dramatic for power, soft for wisdom)` : `
   - MOTION: Smooth text animations, kinetic typography that enhances message
   - TEXT REVEAL: Dynamic text appearance effects aligned with quote's rhythm
   - BACKGROUND ANIMATION: Subtle moving elements that SUPPORT the quote's theme
   - TRANSITIONS: Elegant text transitions and effects
   - CINEMATIC: Professional video quality with smooth movements
   - DURATION: 5-10 second loops with text fully visible for reading`}
   - MOBILE OPTIMIZED: Perfect for Instagram square (1:1) format
   - NO FACES/PEOPLE: Abstract, symbolic, or landscape elements only
   - TEXT READABILITY: Ensure quote is 100% readable and prominent
   - BRAND QUALITY: Professional, polished, and visually striking
   - QUOTE PROMINENCE: The quote text should be the undisputed main element
   - THEMATIC COHERENCE: Every visual element should feel connected to the quote's core message`}

📱 **Hashtag Strategy**:
   - 12-15 hashtags total
   - Mix: 3 trending (#motivation), 5 niche (category-specific), 4 branded
   - All lowercase, no spaces
   - Focus on ${context.category} + ${context.style} keywords
   - Include 2-3 action hashtags (#hustlehard #growthmindset)

🔒 SAFETY & BRAND GUIDELINES:
✓ Family-friendly, universally appropriate
✓ Empowering, never preachy
✓ Action-oriented, noprofound, meaningful quote here (80-180 characters)",
  "title": "Short Catchy Title", 
  "author": "",
  "visualPrompt": "Create a ${context.style === 'custom' ? 'minimalist black background image' : `${context.style} style ${context.contentType}`} with the text '[INSERT COMPLETE QUOTE TEXT HERE]' prominently displayed. [Continue with detailed 200+ word visual description that ANALYZES the quote's meaning and designs visuals to MATCH that meaning. Include typography choice based on quote tone, background elements that symbolize the quote's message, color palette that evokes the right emotion, and complete styling specifications.]",
  "suggestedHashtags": "#motivation #success #category1 #category2 #category3 #quoteoftheday #quotestagram #quotesdaily #motivationalpost ... (15-20 total)"
}

🔑 CRITICAL INSTRUCTIONS:
1. **AUTHOR FIELD**: Leave author empty "" UNLESS the quote style genuinely matches a specific historical figure. Do NOT use "Unknown" or generic attributions.

2. **VISUAL PROMPT**: Must be 200+ words and follow this structure:
   - First, analyze what the quote means and its core message
   - Then specify background that SYMBOLIZES that message
   - Choose typography that matches the quote's personality (wisdom=serif, action=bold sans)
   - Select colors that evoke the quote's emotional tone
   - Include exact quote text: "Display the text '[ACTUAL QUOTE]' in [specific font] font..."
   - Describe how ALL visual elements connect to the quote's theme

3. **HASHTAGS**: Generate 15-20 hashtags with strong category relevance, mixing reach levels

🚀 REMEMBER: Create profound wisdom that resonates deeply, paired with visuals that amplify the messag

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
        // Check if quotes are identical or very similar (>50% word overlap)
        if (generatedQuote === recentLower) return true;
        
        const genWords = new Set(generatedQuote.split(/\s+/));
        const recentWords = new Set(recentLower.split(/\s+/));
        const genWordsArray = Array.from(genWords) as string[];
        const intersection = new Set(genWordsArray.filter(w => recentWords.has(w)));
        const similarity = intersection.size / Math.min(genWords.size, recentWords.size);
        
        // Much stricter threshold: 50% similarity triggers duplicate detection (was 60%)
        if (similarity > 0.5) {
          console.warn(`⚠️ [Similarity Check] ${(similarity * 100).toFixed(1)}% overlap detected`);
          console.warn(`   Generated: "${generatedQuote.substring(0, 60)}..."`);
          console.warn(`   Similar to: "${recentLower.substring(0, 60)}..."`);
          return true;
        }
        return false;
      });

      if (isTooSimilar) {
        console.warn('⚠️ [Module 9] Generated quote too similar to recent ones');
        console.warn('   Generated:', generatedQuote.substring(0, 80));
        console.warn('   Retrying with more strict uniqueness requirements...');
        // Retry once with different variation
        if (!context.recentQuotes.includes('__RETRY__')) {
          return this.generateUniqueQuote({
            ...context,
            recentQuotes: [...context.recentQuotes, generatedQuote, '__RETRY__'],
          });
        } else {
          console.warn('⚠️ [Module 9] Retry limit reached, using fallback quote');
          return this.generateFallbackQuote(context);
        }
      }

      console.log('✅ [Module 9] Generated unique motivational quote');
      console.log('   Quote:', parsed.quoteText.substring(0, 60) + '...');

      return {
        quoteText: parsed.quoteText.trim(),
        title: parsed.title?.trim() || this.generateTitleFromQuote(parsed.quoteText),
        author: parsed.author && parsed.author.trim() !== '' && parsed.author.toLowerCase() !== 'unknown' ? parsed.author.trim() : undefined,
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
      success: "The measure of success is not in never falling, but in rising every time we fall.",
      mindset: "What we think, we become. What we feel, we attract. What we imagine, we create.",
      motivation: "The difference between who you are and who you want to be is what you do.",
      inspiration: "Your limitation is only your imagination. Push beyond what you think is possible.",
      life: "Life is not about finding yourself. Life is about creating yourself with every choice you make.",
      wisdom: "The only true wisdom is in knowing you know nothing, and being open to learning everything.",
    };

    const quoteText = fallbackQuotes[context.category as keyof typeof fallbackQuotes] || fallbackQuotes.motivation;

    const visualPrompt = context.contentType === 'image'
      ? `Create a ${context.style === 'custom' ? 'minimalist black background image' : `${context.style} style image with thematic background elements that resonate with personal growth and ${context.category}`} featuring the motivational quote "${quoteText}" as the main text element. Use ${context.style === 'custom' ? 'clean white typography on pure black background' : 'modern, elegant typography that matches the wisdom tone of the quote with high contrast'}. Center the text with generous padding and ensure maximum readability on mobile devices.`
      : `Create a ${context.style} style video with the motivational text "${quoteText}" prominently displayed. Use smooth text animations, elegant transitions, and typography that conveys wisdom and depth. The quote should be the focal point with cinematic quality.`;

    return {
      quoteText,
      title: this.generateTitleFromQuote(quoteText),
      author: undefined,
      visualPrompt,
      suggestedHashtags: '#motivation #inspiration #success #mindset #quotes #quoteoftheday #dailymotivation #quotestagram #motivationalquotes #lifequotes #wisdom #personalgrowth #growthmindset #positivevibes #successmindset',
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
