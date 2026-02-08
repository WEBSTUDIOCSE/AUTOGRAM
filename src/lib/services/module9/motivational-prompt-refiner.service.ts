/**
 * Module 9: Motivational Quote Prompt Refiner
 * Uses AI to generate unique motivational quotes and visual prompts
 * 
 * 2026 Strategy: "Monk Mode" era - Raw Authenticity, Dark Aesthetics,
 * Negative Framing hooks, Stoic philosophy, and "Quiet Luxury" visuals.
 * Shifted from generic positive motivation to deep, actionable wisdom
 * with premium dark visual identity.
 */

import { genAI, getTextModelName } from '@/lib/ai/gemini';

interface MotivationalGenerationContext {
  category: string; // 'discipline', 'stoicism', 'wealth', 'grindset', 'philosophy', 'focus', 'resilience', 'shadow-work'
  themeDescription: string;
  contentType: 'image' | 'video';
  style: string; // 'monks-midnight', 'dark-academia', 'noir-cinematic', 'olive-spruce', 'plum-noir', 'slate-rust', 'raw-authentic', 'custom'
  language?: 'english' | 'hindi' | 'marathi';
  recentQuotes: string[];
  quoteTemplate?: string;
}

interface GeneratedMotivationalContent {
  quoteText: string;
  title: string; // Short catchy hook-title for caption (uses negative/curiosity framing)
  author?: string;
  profession?: string;
  subcategory: string;
  subcategories: string[];
  visualPrompt: string;
  suggestedHashtags: string;
}

// ═══════════════════════════════════════════════════════════════
// 2026 MONK MODE VISUAL SYSTEM - Strategic Color Palettes
// ═══════════════════════════════════════════════════════════════
const STYLE_PALETTES: Record<string, { name: string; primary: string; secondary: string; accent: string; text: string; psychology: string; fonts: { header: string; body: string }; vibe: string }> = {
  'monks-midnight': {
    name: "Monk's Midnight",
    primary: '#07162A', secondary: '#0B2340', accent: '#E6D3A6', text: '#FDFDFD',
    psychology: 'Authority & Wealth. Deep blues suggest intelligence and stability, champagne gold signals Old Money value.',
    fonts: { header: 'Playfair Display', body: 'Lato' },
    vibe: 'Editorial Luxury, high contrast curves, high-end magazine aesthetic',
  },
  'dark-academia': {
    name: 'Dark Academia',
    primary: '#1A1410', secondary: '#2C2318', accent: '#C4A87C', text: '#E8E0D4',
    psychology: 'Classical wisdom, romanticized learning, heritage and depth. Dim libraries, rain-streaked windows, ancient architecture.',
    fonts: { header: 'Cinzel', body: 'Montserrat' },
    vibe: 'Roman Stoic, marble statues, ancient wisdom, leather and tweed textures',
  },
  'noir-cinematic': {
    name: 'Noir Cinematic',
    primary: '#0A0A0A', secondary: '#1A1A1A', accent: '#FF4444', text: '#E0E0E0',
    psychology: 'Technical, moody, digital-native. Aggressive motion blur, cold tints, digital noir. The Monk in the modern machine.',
    fonts: { header: 'Oswald', body: 'Quicksand' },
    vibe: 'Gen X Soft Club, aggressive focus, high impact, film grain and light trails',
  },
  'olive-spruce': {
    name: 'Olive Spruce',
    primary: '#4A5F3C', secondary: '#2D362B', accent: '#D9D0C1', text: '#E8E5E0',
    psychology: 'Growth & Grounding. Connects viewer to nature and stoic biology. Organic discipline over artificial hustle.',
    fonts: { header: 'DM Serif Display', body: 'Inter' },
    vibe: 'Touch grass, biohacking, natural discipline, forest at dawn',
  },
  'plum-noir': {
    name: 'Plum Noir',
    primary: '#3B1E20', secondary: '#512C3A', accent: '#8E5645', text: '#EDD5B1',
    psychology: 'Deep, emotional, introspective. Used for Shadow Work, emotional regulation, and stoic philosophy.',
    fonts: { header: 'Playfair Display', body: 'Lato' },
    vibe: 'Stoic Philosophy, introspection, candle-lit depth, velvet and wine tones',
  },
  'slate-rust': {
    name: 'Slate & Rust',
    primary: '#2C3241', secondary: '#744033', accent: '#B8A992', text: '#E0E0E0',
    psychology: 'Resilience & Grit. Earthy, gritty tones of leather, wood, and stone. Implies durability and timelessness.',
    fonts: { header: 'Oswald', body: 'Quicksand' },
    vibe: 'Workout grind, physical stoic, worn textures, industrial strength',
  },
  'raw-authentic': {
    name: 'Raw & Authentic',
    primary: '#0D0D0D', secondary: '#1C1C1C', accent: '#FFFFFF', text: '#FFFFFF',
    psychology: 'Anti-curation. Looks like a real moment captured, not a designed post. FaceTime call energy.',
    fonts: { header: 'Inter', body: 'Inter' },
    vibe: 'Handheld camera, 35mm film grain, VHS glitch, flash photography, raw texture',
  },
  'custom': {
    name: 'Pure Black',
    primary: '#000000', secondary: '#000000', accent: '#FFFFFF', text: '#FFFFFF',
    psychology: 'Maximum contrast minimalism. Premium, stops the scroll in dark mode. Batman/Bruce Wayne energy.',
    fonts: { header: 'Integral CF / The Bold Font', body: 'Helvetica Neue' },
    vibe: 'Pure typography, zero decoration, white on black, glow effect on keywords',
  },
};

// ═══════════════════════════════════════════════════════════════
// 2026 CATEGORY THEME SYSTEM
// ═══════════════════════════════════════════════════════════════  
const CATEGORY_THEMES: Record<string, { hookStyle: string; subcategoryPool: string[]; tonality: string; referenceVoices: string }> = {
  'discipline': {
    hookStyle: 'negative_warning',
    subcategoryPool: ['self-control', 'consistency', 'habits', '75hard', 'routine', 'delayed gratification', 'monk mode', 'willpower'],
    tonality: 'Aggressive and direct. Use imperatives. "Stop doing X." "You are failing because Y."',
    referenceVoices: 'David Goggins, Jocko Willink, Marcus Aurelius',
  },
  'stoicism': {
    hookStyle: 'contrarian',
    subcategoryPool: ['memento mori', 'amor fati', 'temperance', 'virtue', 'inner citadel', 'dichotomy of control', 'premeditatio malorum', 'eudaimonia'],
    tonality: 'Philosophical and ancient. Short, devastating truths. "Motivation is a lie." "Stop trying to be happy."',
    referenceVoices: 'Marcus Aurelius, Seneca, Epictetus, Ryan Holiday',
  },
  'wealth': {
    hookStyle: 'forbidden_knowledge',
    subcategoryPool: ['financial freedom', 'passive income', 'investing', 'money mindset', 'automation', 'compound interest', 'leverage', 'silent wealth'],
    tonality: 'Secretive and exclusive. "The 1% don\'t want you to know..." "This feels illegal to know."',
    referenceVoices: 'Naval Ravikant, Charlie Munger, Warren Buffett, Robert Kiyosaki',
  },
  'grindset': {
    hookStyle: 'attack_identity',
    subcategoryPool: ['hustle', 'work ethic', 'sacrifice', 'ambition', 'lock in', 'no excuses', 'outwork', 'relentless'],
    tonality: 'Intense and confrontational. "If you wake up past 8 AM, you\'re already behind." Pure action energy.',
    referenceVoices: 'Andrew Tate (cleaned), Gary Vee, Kobe Bryant, Michael Jordan',
  },
  'philosophy': {
    hookStyle: 'regret_frame',
    subcategoryPool: ['truth', 'meaning', 'existence', 'wisdom', 'consciousness', 'perspective', 'paradox', 'deep thought'],
    tonality: 'Deep and reflective. "I wish I knew this at 18..." "The truth about your 20s no one tells you."',
    referenceVoices: 'Alan Watts, Jordan Peterson, Dostoevsky, Nietzsche',
  },
  'focus': {
    hookStyle: 'specific_audience',
    subcategoryPool: ['deep work', 'dopamine detox', 'digital minimalism', 'flow state', 'attention', 'second brain', 'productivity', 'monk mode'],
    tonality: 'Technical and precise. "If you\'re a student in your 20s, read this." Calls out the user directly.',
    referenceVoices: 'Cal Newport, James Clear, Sahil Bloom',
  },
  'resilience': {
    hookStyle: 'transformation_story',
    subcategoryPool: ['comeback', 'pain', 'struggle', 'adversity', 'unbreakable', 'anti-fragile', 'survival', 'rock bottom'],
    tonality: 'Raw and emotional. "I ghosted everyone for 6 months. Here is what happened." Show the ugly work.',
    referenceVoices: 'David Goggins, Nelson Mandela, Viktor Frankl',
  },
  'shadow-work': {
    hookStyle: 'secret_frame',
    subcategoryPool: ['self-awareness', 'inner child', 'emotional regulation', 'trauma', 'healing', 'authenticity', 'vulnerability', 'ego death'],
    tonality: 'Introspective and haunting. "They don\'t want you to know this about yourself." Deep emotional territory.',
    referenceVoices: 'Carl Jung, Brené Brown, Eckhart Tolle',
  },
};

export const MotivationalPromptRefinerService = {
  /**
   * Generate a unique motivational quote with visual prompt
   * Updated for 2026 Monk Mode strategy: Dark Aesthetics, Raw Authenticity,
   * Negative Framing hooks, and premium visual architecture.
   */
  async generateUniqueQuote(context: MotivationalGenerationContext): Promise<GeneratedMotivationalContent> {
    try {
      const modelName = getTextModelName();

      // Get time-based context for more variation (Monk Mode scheduling)
      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = now.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isMonday = dayOfWeek === 1;
      const isFriday = dayOfWeek === 5;
      
      let timeContext = '';
      if (hour < 6) {
        timeContext = '4AM grinder energy - you are up while the world sleeps. Deep discipline vibes.';
      } else if (hour < 12) {
        timeContext = 'morning protocol activation - set the tone for domination today';
      } else if (hour < 17) {
        timeContext = 'afternoon lock-in session - deep work, no distractions, monk mode active';
      } else if (hour < 21) {
        timeContext = 'evening reflection and journaling - review the day, plan tomorrow\'s attack';
      } else {
        timeContext = 'late night grind session - the lonely chapter nobody talks about';
      }
      
      let dayContext = '';
      if (isMonday) {
        dayContext = ' (Monday: "Lock In" energy - fresh week, zero excuses)';
      } else if (isFriday) {
        dayContext = ' (Friday: "While they party, you build" theme)';
      } else if (isWeekend) {
        dayContext = ' (Weekend: "The gap widens on weekends" - silent work theme)';
      }

      const avoidanceText = context.recentQuotes.length > 0
        ? `\n\n🚫 RECENT QUOTES - CRITICAL: MUST AVOID THESE (DO NOT use same words, themes, or similar structures):\n${context.recentQuotes.map((q, i) => `${i + 1}. "${q}"`).join('\n')}\n\n⚠️ ANTI-DUPLICATION RULES:\n- Your quote MUST have <50% word overlap with any recent quote (STRICTER than before)\n- Use COMPLETELY DIFFERENT themes, metaphors, and message angles\n- If a recent quote talks about 'dreams', talk about 'action', 'character', 'wisdom', or 'preparation' instead\n- Vary sentence structure: if recent quotes use statements, try questions or imperatives\n- Think of completely new angles and perspectives on ${context.category}\n- Avoid common motivational clichés already in the list\n- Each quote must feel FRESH and UNIQUE in message and delivery`
        : '';

      const templateText = context.quoteTemplate
        ? `\n\n💡 QUOTE TEMPLATE (Use as loose inspiration but transform it completely):\n"${context.quoteTemplate}"`
        : '';

      // 2026 Hook-style variation system based on category
      const hookVariations = [
        'a devastating truth that makes them stop scrolling (negative frame)',
        'a contrarian take that challenges conventional wisdom',
        'a forbidden-knowledge reveal that feels "illegal to know"',
        'a transformation story hook - before vs after mindset shift',
        'a direct attack on comfort zones - confrontational and raw',
        'a stoic paradox that rewires their thinking',
        'a "regret frame" wisdom bomb - "I wish I knew this at 18"',
        'a quiet, deadly one-liner with maximum density of meaning',
      ];
      const randomVariation = hookVariations[Math.floor(Math.random() * hookVariations.length)];

      // Add unique timestamp-based seed to prevent AI caching
      const uniqueSeed = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Add randomness context to force variation
      const randomnessBoosts = [
        'Channel the energy of a 4AM workout. Raw and aggressive.', 
        'Write like Seneca writing his last letter. Urgent wisdom.',
        'Imagine you\'re writing on a black wall at 3AM. Haunting truth.',
        'Think "Peaky Blinders" monologue energy. Cold and calculating.',
        'Channel Marcus Aurelius in his tent before battle. Stoic fire.',
        'Write like a coded message from the future. Cryptic and powerful.',
      ];
      const randomnessBoost = randomnessBoosts[Math.floor(Math.random() * randomnessBoosts.length)];

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

      // Resolve palette and category theme
      const palette = STYLE_PALETTES[context.style] || STYLE_PALETTES['monks-midnight'];
      const categoryTheme = CATEGORY_THEMES[context.category] || CATEGORY_THEMES['discipline'];

      // Build the visual prompt section based on style
      const visualPromptSection = this._buildVisualPromptSection(context, palette, langConfig.textInstruction);

      const generationPrompt = `You are an elite "Monk Mode" content strategist for 2026. You create PROFOUND, DARK, RAW wisdom that STOPS THE SCROLL. The era of generic positive motivation is DEAD. You specialize in Stoic philosophy, raw authenticity, and "Quiet Luxury" aesthetics.

🎲 GENERATION SEED: ${uniqueSeed}
🔀 ENERGY: ${randomnessBoost}

═══════════════════════════════════════════════════════
  2026 MONK MODE REFERENCE QUOTES (study the TONE):
═══════════════════════════════════════════════════════
"The obstacle is the way." — Marcus Aurelius
"He who has a why to live can bear almost any how." — Nietzsche
"Discipline is choosing between what you want now and what you want most."
"You are not lazy. You are just not obsessed enough."
"The graveyard is full of people who had potential."
"Comfort is the enemy of achievement."
"Your silence is your superpower. Let them wonder."
"Pain is the tuition fee for a life of meaning."

📊 GENERATION PARAMETERS:
• LANGUAGE: ${langConfig.quoteLanguage} - ${langConfig.instruction}
• CATEGORY: ${context.category} (${categoryTheme.tonality})
• HOOK STYLE: ${categoryTheme.hookStyle}
• THEME: ${context.themeDescription}
• CONTENT TYPE: ${context.contentType}
• VISUAL STYLE: ${palette.name} (${palette.vibe})
• TIME CONTEXT: ${timeContext}${dayContext}
• VARIATION TYPE: ${randomVariation}
• REFERENCE VOICES: ${categoryTheme.referenceVoices}${templateText}${avoidanceText}

═══════════════════════════════════════════════════════
  🎯 QUOTE GENERATION RULES (2026 MONK MODE)
═══════════════════════════════════════════════════════

✨ **Quote Requirements**:
   - Length: 80-200 characters (let the message breathe)
   - TONE: ${categoryTheme.tonality}
   - Use "NEGATIVE FRAMING" - tell people what they're LOSING, not what they'll gain
   - Transformation examples:
     * Generic: "Be consistent" → Monk Mode: "Your motivation dies by Day 3 because you negotiate with yourself."
     * Generic: "Work hard" → Monk Mode: "While you sleep in, someone hungrier is stealing your future."
     * Generic: "Stay positive" → Monk Mode: "Stop trying to be happy. Start being capable of suffering."
   - Must feel like a PUNCH TO THE GUT, not a warm hug
   - Prefer CONCRETE IMAGERY over abstract fluff (tree/shadow, sharpening the axe, etc.)
   - Use paradox, contrast, or devastating simplicity
   - Should feel timeless like Stoic wisdom, not trendy
   - NO generic clichés like "believe in yourself" or "follow your dreams"
   - Attribution: Leave blank for original OR use real historical Stoic/philosophical figure ONLY if style genuinely matches

📝 **Title Requirements** (THIS IS YOUR INSTAGRAM HOOK):
   - Create a SCROLL-STOPPING hook title (3-8 words)
   - Use one of these 2026 viral hook frameworks:
     * Negative/Warning: "Stop doing this if you want to grow"
     * Contrarian: "Motivation is a lie"
     * Forbidden: "The habit that feels illegal to know"
     * Regret: "I wish I knew this at 18"
     * Transformation: "POV: You disappeared for 6 months"
     * Attack: "Why you are still stuck in 2026"
     * Secret: "The dark truth about success"
   - This title is the FIRST THING people see in their feed
   - The Instagram caption will be: Hook Title + Author + Hashtags
   - The full quote MUST be on the image/video itself

🏷️ **Subcategories** (2-4 from this pool for ${context.category}):
   ${categoryTheme.subcategoryPool.map(s => `"${s}"`).join(', ')}
   - Choose based on the ACTUAL QUOTE CONTENT
   - Use lowercase, no special characters

${visualPromptSection}

📱 **Hashtag Strategy (3-TIER METHOD)**:
   Generate 15-20 hashtags using this EXACT mix:
   
   🔥 TIER 1 - Broad/Viral (3-5): High-volume discovery hashtags
   Examples: #disciplineovermotivation #monkmode #stoicism #grindset #2026vision #mindsetmatters #growthmindset
   
   🎯 TIER 2 - Niche/Specific (5-7): Category-targeted hashtags
   Based on ${context.category}:
     * discipline → #75hard #morningroutine #gymdiscipline #selfmastery #dailydiscipline #noexcuses #lockin
     * stoicism → #stoicwisdom #marcusaurelius #seneca #mementomori #dailystoic #amorFati #innerpeace
     * wealth → #financialfreedom #wealthmindset #passiveincome #silentwealth #moneymindset #buildwealth #investing
     * grindset → #hustlehard #winnermindset #lockingIn #entrepreneurmindset #workethic #nodays off #relentless
     * philosophy → #deepthoughts #lifephilosophy #existentialism #truthbomb #mindexpansion #wisdomquotes #thinking
     * focus → #deepwork #dopaminedetox #digitalminimalism #focusmode #secondbrain #productivityhacks #flowstate
     * resilience → #nevergiveup #comebackstory #unbreakable #painistemporary #keepgoing #fightback #survivor
     * shadow-work → #shadowwork #selfawareness #healingjourney #innerchild #emotionalintelligence #authenticity #selflove
   
   🚀 TIER 3 - Community/Action (2-3): Engagement-driving hashtags
   Examples: #1percentbettereveryday #lockin #claimit #levelup #grinddontstop
   
   - All lowercase, no spaces
   - Mix reach levels: some 100K-500K, some 500K-2M, some 2M+ post volumes

🔒 SAFETY & BRAND GUIDELINES:
✓ Family-friendly (intense but not toxic)
✓ Discipline over motivation - ALWAYS
✓ Raw and authentic, never preachy or fake
✓ Stoic, never whiny or victim-mentality
✓ Empowering through HARD TRUTHS, not sugar-coating
✗ NO toxic masculinity, hate speech, or harmful content
✗ NO "I'm better than you" energy - it's about self-improvement

Return ONLY valid JSON (no markdown, no backticks):
{
  "quoteText": "Your devastating, scroll-stopping Monk Mode wisdom here (80-200 chars)",
  "title": "Your Viral Hook Title Here (3-8 words, negative/curiosity frame)", 
  "author": "",
  "profession": "",
  "subcategories": ["theme1", "theme2", "theme3"],
  "visualPrompt": "Create a ${palette.name} aesthetic ${context.contentType} with the text '[INSERT COMPLETE QUOTE TEXT HERE]' prominently displayed. [Continue with 200+ word visual description including: ${palette.name} color palette (primary: ${palette.primary}, secondary: ${palette.secondary}, accent: ${palette.accent}, text: ${palette.text}), ${palette.fonts.header} header font, ${palette.fonts.body} body font, ${palette.vibe} aesthetic, specific lighting, texture, composition, and mood details that MATCH the quote's meaning. For video: include kinetic typography instructions, camera movement, and motion effects.]",
  "suggestedHashtags": "#monkmode #discipline #stoicism ... (15-20 total using 3-tier method)"
}

🔑 CRITICAL INSTRUCTIONS:
1. **AUTHOR**: Leave "" for original quotes. Use REAL Stoic/philosophical figures only if genuinely matches (Marcus Aurelius, Seneca, Nietzsche, etc.)
2. **PROFESSION**: If author provided: "Roman Emperor", "Stoic Philosopher", "German Philosopher", etc. If no author, leave "".
3. **SUBCATEGORIES**: REQUIRED 2-4 from the ${context.category} pool. Analyze quote content to choose most relevant.
4. **VISUAL PROMPT**: 200+ words. MUST include exact quote text. MUST reference the ${palette.name} color palette with actual hex values. MUST specify ${palette.fonts.header} for headers and ${palette.fonts.body} for body.
5. **HOOK TITLE**: This is NOT the quote. It's the Instagram caption hook. Use NEGATIVE FRAMING or CURIOSITY GAP.

🚨 VISUAL PROMPT MUST:
- Include the EXACT quote text using "[INSERT COMPLETE QUOTE TEXT HERE]" placeholder (replace with actual quote)
- Reference specific hex colors: primary ${palette.primary}, accent ${palette.accent}, text ${palette.text}
- Specify fonts: ${palette.fonts.header} for quote display, ${palette.fonts.body} for any secondary text
- Describe the ${palette.vibe} atmosphere in detail
- For video: Include kinetic typography (word-by-word reveal, "Stomp" effect on key words, synchronized to imagined beat)
- Include "imperfection" keywords for raw authentic feel: 35mm film grain, subtle noise texture, atmospheric fog

🚀 REMEMBER: In 2026, positive sugary motivation is IGNORED. Raw truth STOPS THE SCROLL. Be the mentor who tells hard truths, not the friend who sugarcoats. Make them SAVE this post.`;

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

      // Ensure visual prompt includes the actual quote text and palette references
      let processedVisualPrompt = parsed.visualPrompt;
      if (!processedVisualPrompt.includes(parsed.quoteText) && 
          !processedVisualPrompt.includes('[INSERT COMPLETE QUOTE TEXT HERE]')) {
        processedVisualPrompt = `Create a ${palette.name} aesthetic ${context.contentType} featuring the motivational quote "${parsed.quoteText}" as the main text element. Color palette: primary ${palette.primary}, accent ${palette.accent}, text ${palette.text}. Font: ${palette.fonts.header}. ${processedVisualPrompt}`;
      } else if (processedVisualPrompt.includes('[INSERT COMPLETE QUOTE TEXT HERE]')) {
        processedVisualPrompt = processedVisualPrompt.replace('[INSERT COMPLETE QUOTE TEXT HERE]', parsed.quoteText);
      }

      // Enhance visual prompt with 2026 Monk Mode aesthetic defaults
      if (!processedVisualPrompt.toLowerCase().includes('font') && !processedVisualPrompt.toLowerCase().includes('typography')) {
        const typographyEnhancement = context.style === 'custom' 
          ? ` Use ${palette.fonts.header} typography in pure white against black background. Slight glow effect on key words.`
          : ` Use ${palette.fonts.header} for the quote text, ${palette.fonts.body} for secondary text. ${palette.vibe} aesthetic.`;
        processedVisualPrompt += typographyEnhancement;
      }

      // Inject rawthenticity texture keywords if not present
      if (!processedVisualPrompt.toLowerCase().includes('grain') && !processedVisualPrompt.toLowerCase().includes('texture')) {
        processedVisualPrompt += ' Subtle 35mm film grain overlay, slight noise texture for raw authentic feel, atmospheric depth.';
      }

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
          return true;
        }
        return false;
      });

      if (isTooSimilar) {
        // Retry once with different variation
        if (!context.recentQuotes.includes('__RETRY__')) {
          return this.generateUniqueQuote({
            ...context,
            recentQuotes: [...context.recentQuotes, generatedQuote, '__RETRY__'],
          });
        } else {
          throw new Error('Failed to generate unique quote after multiple attempts');
        }
      }

      const subcategoriesArray = Array.isArray(parsed.subcategories) 
        ? parsed.subcategories.map((s: string) => s.trim().toLowerCase())
        : [];
      
      // Ensure we have 2-4 subcategories, add fallback if needed
      if (subcategoriesArray.length < 2) {
        subcategoriesArray.push('general');
      }
      if (subcategoriesArray.length < 2) {
        subcategoriesArray.push('inspiration');
      }

      return {
        quoteText: parsed.quoteText.trim(),
        title: parsed.title?.trim() || this.generateTitleFromQuote(parsed.quoteText),
        author: parsed.author && parsed.author.trim() !== '' && parsed.author.toLowerCase() !== 'unknown' ? parsed.author.trim() : undefined,
        profession: parsed.profession && parsed.profession.trim() !== '' && parsed.profession.toLowerCase() !== 'unknown' ? parsed.profession.trim() : undefined,
        subcategory: subcategoriesArray[0] || 'general', // Primary for backward compatibility
        subcategories: subcategoriesArray.slice(0, 4), // Limit to max 4
        visualPrompt: processedVisualPrompt.trim(),
        suggestedHashtags: parsed.suggestedHashtags || '#motivation #inspiration #success',
      };

    } catch (error) {
      
      // Try one more time with a simpler prompt
      try {
        return await this.generateSimpleQuote(context);
      } catch (retryError) {
        // Throw error - no fallback quotes, only dynamic generation
        throw new Error(`Failed to generate unique quote after retry. Original error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  },

  /**
   * Simplified quote generation (retry before fallback)
   * Uses a much simpler prompt that's less likely to fail
   * Updated for 2026 Monk Mode aesthetic
   */
  async generateSimpleQuote(context: MotivationalGenerationContext): Promise<GeneratedMotivationalContent> {
    const modelName = getTextModelName();
    
    const avoidQuotes = context.recentQuotes.slice(0, 10).join('"\n"');
    const uniqueSeed = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const palette = STYLE_PALETTES[context.style] || STYLE_PALETTES['monks-midnight'];

    const simplePrompt = `Generate a unique ${context.category} quote in the 2026 "Monk Mode" style.

SEED: ${uniqueSeed}
LANGUAGE: ${context.language || 'english'}
STYLE: ${palette.name} (${palette.vibe})
COLOR PALETTE: primary ${palette.primary}, accent ${palette.accent}, text ${palette.text}
FONTS: ${palette.fonts.header} / ${palette.fonts.body}

AVOID THESE RECENT QUOTES:
"${avoidQuotes}"

Requirements:
- 80-200 characters
- Original and unique
- ${context.language || 'english'} language only
- DARK, RAW, STOIC wisdom - NOT generic positive motivation
- Use negative framing or contrarian perspective
- Should feel like a punch to the gut, not a warm hug
- Not a cliché

Return ONLY valid JSON:
{
  "quoteText": "your devastating monk mode wisdom here",
  "title": "Hook Title (Negative/Curiosity Frame)",
  "author": "",
  "profession": "",
  "subcategories": ["theme1", "theme2"],
  "visualPrompt": "Create a ${palette.name} aesthetic ${context.contentType} with color palette primary ${palette.primary}, accent ${palette.accent}, text ${palette.text}. ${palette.fonts.header} font. ${palette.vibe} aesthetic. Display the quote prominently. 35mm film grain texture, atmospheric depth.",
  "suggestedHashtags": "#monkmode #discipline #stoicism #${context.category} #grindset #lockin #2026vision"
}`;

    const response = await genAI.models.generateContent({
      model: modelName,
      contents: simplePrompt,
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

    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse simplified AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    
    const subcategoriesArray = Array.isArray(parsed.subcategories) 
      ? parsed.subcategories.map((s: string) => s.trim().toLowerCase())
      : [];
    
    // Ensure we have 2-4 subcategories, add fallback if needed
    if (subcategoriesArray.length < 2) {
      subcategoriesArray.push('general');
    }
    if (subcategoriesArray.length < 2) {
      subcategoriesArray.push('inspiration');
    }
    
    return {
      quoteText: parsed.quoteText.trim(),
      title: parsed.title?.trim() || this.generateTitleFromQuote(parsed.quoteText),
      author: parsed.author && parsed.author.trim() !== '' && parsed.author.toLowerCase() !== 'unknown' ? parsed.author.trim() : undefined,
      profession: parsed.profession && parsed.profession.trim() !== '' && parsed.profession.toLowerCase() !== 'unknown' ? parsed.profession.trim() : undefined,
      subcategory: subcategoriesArray[0] || 'general', // Primary for backward compatibility
      subcategories: subcategoriesArray.slice(0, 4), // Limit to max 4
      visualPrompt: parsed.visualPrompt.trim(),
      suggestedHashtags: parsed.suggestedHashtags || '#motivation #inspiration #success',
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
   * Updated for 2026 Monk Mode dark aesthetic
   */
  async refineQuotePrompt(quoteText: string, contentType: 'image' | 'video', style: string): Promise<string> {
    try {
      const modelName = getTextModelName();
      const palette = STYLE_PALETTES[style] || STYLE_PALETTES['monks-midnight'];

      const prompt = `Create a detailed visual prompt for AI ${contentType} generation based on this Monk Mode quote:

"${quoteText}"

CONTENT TYPE: ${contentType}
VISUAL STYLE: ${palette.name}
COLOR PALETTE: primary ${palette.primary}, secondary ${palette.secondary}, accent ${palette.accent}, text ${palette.text}
FONTS: ${palette.fonts.header} (header) / ${palette.fonts.body} (body)
AESTHETIC: ${palette.vibe}

Generate a detailed 2026 "Dark Aesthetic" visual description that:
- Uses the EXACT color palette hex values above
- Specifies ${palette.fonts.header} typography for the quote text
- Creates a ${palette.vibe} atmosphere
- Includes "raw authenticity" texture: 35mm film grain, subtle noise, atmospheric fog
- NO people or faces (abstract/symbolic only)
- ${contentType === 'video' ? 'Includes KINETIC TYPOGRAPHY: word-by-word text reveal synced to beat, "Stomp" effect on key words, camera movement (handheld shake, whip pan), light trails, and motion blur' : 'Focuses on typography hierarchy, layered depth, dramatic lighting, and "Quiet Luxury" composition'}
- Instagram square (1:1) format, mobile optimized
- Premium "Dark Mode" aesthetic that STOPS THE SCROLL

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

      return refinedPrompt || `${palette.name} aesthetic ${contentType} with quote: "${quoteText}". Color palette: ${palette.primary}, ${palette.accent}, ${palette.text}. ${palette.fonts.header} typography. ${palette.vibe}. 35mm film grain texture.`;

    } catch (error) {
      const palette = STYLE_PALETTES[style] || STYLE_PALETTES['monks-midnight'];
      return `${palette.name} aesthetic ${contentType} with quote: "${quoteText}". Color palette: ${palette.primary}, ${palette.accent}, ${palette.text}. ${palette.fonts.header} typography. ${palette.vibe}. 35mm film grain texture.`;
    }
  },

  /**
   * Build the visual prompt section for the main generation prompt
   * Handles style-specific instructions with 2026 Monk Mode aesthetics
   * @internal
   */
  _buildVisualPromptSection(context: MotivationalGenerationContext, palette: typeof STYLE_PALETTES[string], textInstruction: string): string {
    const isCustomBlack = context.style === 'custom';

    if (isCustomBlack) {
      return `
🎨 **Visual Prompt Requirements** (${context.contentType} - PURE BLACK THEME):
   
   🚨 LANGUAGE: ${textInstruction}
   
   - BACKGROUND: Pure black (#000000), completely solid
   - QUOTE TEXT: The COMPLETE quote displayed as the MAIN and ONLY element
   - TYPOGRAPHY: ${palette.fonts.header} or "The Bold Font" / "Integral CF" - BOLD, LARGE
   - TEXT COLOR: Pure white (#FFFFFF) with subtle GLOW EFFECT on key words (slight white bloom/halo)
   - TEXT SIZE: Large, readable on mobile (24px+ equivalent)
   - TEXT PLACEMENT: Centered vertically and horizontally
   - TEXT FORMATTING: Multi-line, generous line spacing (1.5x)
   - NO DECORATIONS: Zero graphics, icons, shapes - pure typography only
   - NO AUTHOR ON IMAGE: Author goes in caption
   - PADDING: 20%+ margins from all edges
   - GLOW EFFECT: Key words in the quote should have a subtle white glow/bloom effect
   - MOBILE: Instagram square (1:1) format
   ${context.contentType === 'video' ? `
   - KINETIC TYPOGRAPHY: Words appear one-by-one ("Spritz" method), synced to an imagined beat
   - "STOMP" EFFECT: The most powerful word appears 2x larger with impact animation
   - TEXT REVEAL: Typewriter effect or word-by-word pop-in
   - DURATION: 5-8 second loop` : ''}`;
    }

    return `
🎨 **Visual Prompt Requirements** (${context.contentType} - ${palette.name.toUpperCase()} AESTHETIC):
   
   🚨 LANGUAGE: ${textInstruction}
   
   ═══ COLOR SYSTEM (MUST USE EXACT HEX VALUES) ═══
   • Primary Background: ${palette.primary}
   • Secondary/Depth: ${palette.secondary}
   • Accent/Highlight: ${palette.accent}
   • Text Color: ${palette.text}
   • Psychology: ${palette.psychology}
   
   ═══ TYPOGRAPHY ═══
   • Header/Quote Font: ${palette.fonts.header} (for the main quote text)
   • Body/Secondary Font: ${palette.fonts.body} (for any supporting text)
   • Visual Vibe: ${palette.vibe}
   • Key word in the quote should be 2x size with "Stomp" animation effect (if video)
   • Text hierarchy: Quote > Key Word Emphasis > Any secondary element
   
   ═══ THEME-MATCHED BACKGROUNDS (Analyze quote meaning FIRST) ═══
   Style-specific backgrounds for ${palette.name}:
   ${context.style === 'monks-midnight' ? '• Deep navy atmospheric scene, champagne gold rim lighting, marble or dark wood textures, luxury study at midnight' : ''}
   ${context.style === 'dark-academia' ? '• Dimly lit library, leather-bound books, rain on windows, candle flames, tweed textures, ancient architecture' : ''}
   ${context.style === 'noir-cinematic' ? '• High contrast noir lighting, cold blue tints, light trails, motion blur, digital noir, neon reflections on wet streets' : ''}
   ${context.style === 'olive-spruce' ? '• Dense forest at dawn, morning mist, natural textures (bark, moss, stone), earthy grounding atmosphere' : ''}
   ${context.style === 'plum-noir' ? '• Candlelit introspection scene, velvet textures, wine-dark shadows, antique elements, philosophical depth' : ''}
   ${context.style === 'slate-rust' ? '• Industrial textures (leather, wood, stone), worn gym equipment, weathered surfaces, gritty determination' : ''}
   ${context.style === 'raw-authentic' ? '• Handheld camera aesthetic, 35mm film grain, VHS glitch, flash photography, CRT monitor glow, rain on lens' : ''}
   
   ═══ RAW AUTHENTICITY TEXTURES (Required for all styles) ═══
   • 35mm film grain overlay (subtle, adds human touch)
   • Slight noise texture (separates from sterile AI look)
   • Atmospheric fog or depth haze
   • Low key dramatic lighting
   • Subtle vignette effect
   
   ═══ COMPOSITION ═══
   • Quote text is the HERO element - large, prominent, 100% readable
   • NO author text on image (goes in caption)
   • NO faces or people (abstract/symbolic only)
   • Mobile optimized: Instagram square (1:1) format
   • "Quiet Luxury" feel - premium, not cluttered
   
   ${context.contentType === 'video' ? `
   ═══ KINETIC TYPOGRAPHY & MOTION (VIDEO-SPECIFIC) ═══
   • TEXT REVEAL: Words appear one-by-one ("Spritz" method) or "Liquid Text" flow
   • "STOMP" EFFECT: The most powerful word in the quote appears 2x larger with impact animation
   • CAMERA MOVEMENT: Slow push-in or handheld drift (adds cinematic depth)
   • BACKGROUND MOTION: Subtle atmospheric particles, drifting fog, or flickering candlelight
   • AUDIO SYNC: Text animations timed to imagined phonk/dark wave beat
   • TRANSITIONS: Smooth crossfade or glitch transitions between text blocks
   • DURATION: 5-10 second loop with text fully readable for 3+ seconds
   • SPLIT-SECOND CHANGES: Camera angle change every 1.5s to maintain retention` : `
   ═══ STATIC IMAGE SPECIFICS ═══
   • Layered depth: Text foreground, atmospheric background
   • Dramatic lighting that matches quote tone (hard shadows for discipline, soft for wisdom)
   • Slight text effects: subtle drop shadow, outer glow on key words, or debossed effect
   • Professional grade composition with generous negative space`}`;
  },
};
