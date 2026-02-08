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
    hookStyle: 'direct_wisdom',
    subcategoryPool: ['self-control', 'consistency', 'habits', '75hard', 'routine', 'delayed gratification', 'monk mode', 'willpower', 'accountability', 'daily practice'],
    tonality: 'Direct and unflinching. Speak truth about what discipline actually requires. Be honest about the cost of inconsistency without exaggerating.',
    referenceVoices: 'David Goggins, Jocko Willink, Marcus Aurelius, James Clear',
  },
  'stoicism': {
    hookStyle: 'philosophical_insight',
    subcategoryPool: ['memento mori', 'amor fati', 'temperance', 'virtue', 'inner citadel', 'dichotomy of control', 'premeditatio malorum', 'eudaimonia', 'equanimity', 'logos'],
    tonality: 'Philosophical, precise, and timeless. Ground every statement in actual Stoic principles. Favor accuracy over drama.',
    referenceVoices: 'Marcus Aurelius, Seneca, Epictetus, Ryan Holiday',
  },
  'wealth': {
    hookStyle: 'nuanced_truth',
    subcategoryPool: ['financial freedom', 'passive income', 'investing', 'money mindset', 'automation', 'compound interest', 'leverage', 'silent wealth', 'financial literacy', 'risk management'],
    tonality: 'Wise and nuanced. Acknowledge complexity of wealth building. Never oversimplify financial truths. Quotes should pass the "would a financial advisor agree?" test.',
    referenceVoices: 'Naval Ravikant, Charlie Munger, Warren Buffett, Morgan Housel',
  },
  'grindset': {
    hookStyle: 'action_oriented',
    subcategoryPool: ['hustle', 'work ethic', 'sacrifice', 'ambition', 'lock in', 'no excuses', 'outwork', 'relentless', 'execution', 'momentum'],
    tonality: 'Intense and action-oriented. Emphasize effort and execution but stay grounded in reality. Avoid toxic "never sleep" energy.',
    referenceVoices: 'Gary Vee, Kobe Bryant, Michael Jordan, Alex Hormozi',
  },
  'philosophy': {
    hookStyle: 'deep_reflection',
    subcategoryPool: ['truth', 'meaning', 'existence', 'wisdom', 'consciousness', 'perspective', 'paradox', 'deep thought', 'human nature', 'purpose'],
    tonality: 'Deep and reflective. Explore genuine philosophical insights about life, meaning, and human nature. Be profound, not pretentious.',
    referenceVoices: 'Alan Watts, Jordan Peterson, Dostoevsky, Nietzsche, Aristotle',
  },
  'focus': {
    hookStyle: 'practical_insight',
    subcategoryPool: ['deep work', 'dopamine detox', 'digital minimalism', 'flow state', 'attention', 'second brain', 'productivity', 'monk mode', 'clarity', 'intention'],
    tonality: 'Clear and actionable. Speak to focus as a skill that can be trained. Back claims with how attention actually works.',
    referenceVoices: 'Cal Newport, James Clear, Sahil Bloom, Atomic Habits',
  },
  'resilience': {
    hookStyle: 'earned_wisdom',
    subcategoryPool: ['comeback', 'pain', 'struggle', 'adversity', 'unbreakable', 'anti-fragile', 'survival', 'rock bottom', 'perseverance', 'growth through suffering'],
    tonality: 'Raw and real. Acknowledge that pain is real but growth through it is possible. Never glorify suffering for its own sake.',
    referenceVoices: 'David Goggins, Nelson Mandela, Viktor Frankl, Nassim Taleb',
  },
  'shadow-work': {
    hookStyle: 'inner_truth',
    subcategoryPool: ['self-awareness', 'inner child', 'emotional regulation', 'trauma', 'healing', 'authenticity', 'vulnerability', 'ego death', 'self-honesty', 'integration'],
    tonality: 'Introspective and honest. Explore the uncomfortable truths about self-knowledge and growth. Be psychologically accurate.',
    referenceVoices: 'Carl Jung, Brené Brown, Eckhart Tolle, Gabor Maté',
  },
};

export const MotivationalPromptRefinerService = {
  /**
   * Generate a unique motivational quote with visual prompt
   * Prioritizes ACCURACY + IMPACT: quotes must be factually defensible,
   * logically sound, and hold up under scrutiny while still being powerful.
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

      // Hook-style variation system - balanced between impact and accuracy
      const hookVariations = [
        'a hard truth that challenges a common misconception (accurate and direct)',
        'a contrarian take backed by real logic or philosophy',
        'a deep insight that reframes how people think about the topic',
        'a transformation insight - the before vs after mindset shift (realistic)',
        'a stoic paradox that rewires their thinking',
        'a wisdom nugget that experienced mentors share (practical and true)',
        'a nuanced truth about success/life that most people oversimplify',
        'a quiet, powerful one-liner with maximum density of meaning',
        'an uncomfortable truth about personal responsibility',
        'a philosophical observation about human nature (timeless wisdom)',
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

      const generationPrompt = `You are an elite content strategist who creates PROFOUND, ACCURATE, and IMPACTFUL wisdom. You combine Stoic philosophy, raw authenticity, and deep understanding of human nature. Your quotes are not just catchy—they are TRUTHFUL, nuanced, and hold up under scrutiny. You never sacrifice accuracy for shock value.

🎲 GENERATION SEED: ${uniqueSeed}
🔀 ENERGY: ${randomnessBoost}

═══════════════════════════════════════════════════════
  REFERENCE QUOTES (study the TONE + ACCURACY):
═══════════════════════════════════════════════════════
"The obstacle is the way." — Marcus Aurelius
"He who has a why to live can bear almost any how." — Nietzsche
"Discipline is choosing between what you want now and what you want most."
"We suffer more in imagination than in reality." — Seneca
"The best time to plant a tree was 20 years ago. The second best time is now."
"Knowing yourself is the beginning of all wisdom." — Aristotle
"What stands in the way becomes the way." — Marcus Aurelius
"The unexamined life is not worth living." — Socrates

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
  🎯 QUOTE GENERATION RULES
═══════════════════════════════════════════════════════

🔬 **TRUTH & ACCURACY (HIGHEST PRIORITY)**:
   - Every quote MUST be factually defensible and logically sound
   - Do NOT oversimplify complex topics (finance, psychology, relationships, health)
   - If a statement has nuance, BUILD THE NUANCE INTO THE QUOTE instead of ignoring it
   - Ask yourself: "Would a knowledgeable person critique this as misleading?" If yes, FIX IT.
   - BAD EXAMPLES (too oversimplified):
     * ❌ "Trading time for money chains you to a desk. Buying assets buys your freedom." (ignores that assets need capital, skill, and risk)
     * ❌ "Money is the root of all evil." (misquote - original says "love of money")
     * ❌ "Follow your passion and you'll never work a day." (factually wrong for most people)
     * ❌ "Sleep is for the weak." (medically dangerous advice)
   - GOOD EXAMPLES (accurate AND powerful):
     * ✅ "Discipline is choosing between what you want now and what you want most."
     * ✅ "The first step to getting what you want is knowing what you are willing to give up."
     * ✅ "Active income builds the foundation. Passive income builds the freedom. Skip neither."
     * ✅ "Your habits are your vote for who you are becoming." 
   - The quote should be something a Stoic philosopher, successful entrepreneur, OR wise mentor would stand behind
   - Accuracy makes wisdom TIMELESS. Oversimplification makes it forgettable.

✨ **Quote Requirements**:
   - Length: 80-200 characters (concise but complete thought)
   - TONE: ${categoryTheme.tonality}
   - Be direct and impactful but NEVER at the cost of truth
   - Prefer CONCRETE IMAGERY over abstract fluff (tree/shadow, sharpening the axe, etc.)
   - Use paradox, contrast, or powerful simplicity
   - Should feel timeless like Stoic wisdom, not trendy
   - NO generic clichés like "believe in yourself" or "follow your dreams"
   - NO oversimplified claims about money, health, relationships, or success
   - The quote should work BOTH as motivation AND as actual advice someone could follow
   - Attribution: Leave blank for original OR use real historical figure ONLY if the quote genuinely matches their philosophy

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

🔒 SAFETY, ACCURACY & BRAND GUIDELINES:
✓ Every quote must be FACTUALLY DEFENSIBLE - not just motivationally catchy
✓ Family-friendly (intense but not toxic)
✓ Discipline over motivation - balance both
✓ Raw and authentic, never preachy or fake
✓ Stoic, never whiny or victim-mentality
✓ Nuanced over oversimplified - embrace complexity when the topic demands it
✓ If a topic (wealth, health, relationships) has nuance, the quote should reflect that nuance
✗ NO toxic masculinity, hate speech, or harmful content
✗ NO "I'm better than you" energy - it's about self-improvement
✗ NO medically or financially dangerous oversimplifications
✗ NO false dichotomies ("either X or Y" when reality is both)

Return ONLY valid JSON (no markdown, no backticks):
{
  "quoteText": "Your devastating, scroll-stopping Monk Mode wisdom here (80-200 chars)",
  "title": "Your Viral Hook Title Here (3-8 words, negative/curiosity frame)", 
  "author": "",
  "profession": "",
  "subcategories": ["theme1", "theme2", "theme3"],
  "visualPrompt": "Create a ${palette.name} aesthetic background for a motivational quote image. The quote is: '[INSERT QUOTE TEXT]'. Background scene: [describe scene matching quote emotion - e.g. misty forest, dark library, noir city]. Color palette: primary ${palette.primary}, secondary ${palette.secondary}, accent ${palette.accent}. Mood: ${palette.vibe}. Lighting: dramatic, low-key. Texture: 35mm film grain, atmospheric depth. The text '${`[QUOTE]`}' should be displayed in ${palette.text} color with strong contrast. Keep composition clean with generous negative space for text readability. ${context.contentType === 'video' ? 'Motion: slow camera push-in, atmospheric particles.' : 'Static: layered depth, subtle vignette.'}",
  "suggestedHashtags": "#monkmode #discipline #stoicism ... (15-20 total using 3-tier method)"
}

🔑 CRITICAL INSTRUCTIONS:
1. **AUTHOR**: Leave "" for original quotes. Use REAL Stoic/philosophical figures only if genuinely matches (Marcus Aurelius, Seneca, Nietzsche, etc.)
2. **PROFESSION**: If author provided: "Roman Emperor", "Stoic Philosopher", "German Philosopher", etc. If no author, leave "".
3. **SUBCATEGORIES**: REQUIRED 2-4 from the ${context.category} pool. Analyze quote content to choose most relevant.
4. **VISUAL PROMPT**: 100-150 words MAX. Focus on BACKGROUND SCENE and ATMOSPHERE. The text rendering is handled separately - your visual prompt should describe the MOOD, LIGHTING, COLORS, and BACKGROUND SCENE only. Include the quote text for context but the image generation system will handle text placement.
5. **HOOK TITLE**: This is NOT the quote. It's the Instagram caption hook. Use NEGATIVE FRAMING or CURIOSITY GAP.

🚨 VISUAL PROMPT RULES:
- Keep it SHORT (100-150 words) - long prompts confuse image AI
- Describe the BACKGROUND SCENE (forest at dawn, dark library, noir city, etc.)
- Specify the COLOR PALETTE: primary ${palette.primary}, accent ${palette.accent}, text ${palette.text}
- Include the quote text wrapped in single quotes
- Specify the mood/atmosphere (dramatic lighting, film grain, mist, etc.)
- DO NOT write detailed typography instructions (text rendering is handled by the image system)
- DO NOT describe text placement, font sizes, or text effects
- Focus on creating a visually stunning BACKGROUND that matches the quote's emotion
- For video: Include motion keywords (slow push-in, particles, fog movement)
- Include "imperfection" keywords: 35mm film grain, subtle noise texture, atmospheric fog

🚀 REMEMBER: The best quotes are BOTH powerful AND accurate. Be the wise mentor who speaks truth with impact—not the clickbait page that oversimplifies everything. A quote that is factually wrong gets called out in comments and loses credibility. A quote that is TRUE and HARD-HITTING gets saved, shared, and remembered forever. Accuracy IS the competitive advantage.`;

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

    const simplePrompt = `Generate a unique ${context.category} motivational quote.

SEED: ${uniqueSeed}
LANGUAGE: ${context.language || 'english'}
STYLE: ${palette.name} (${palette.vibe})
COLOR PALETTE: primary ${palette.primary}, accent ${palette.accent}, text ${palette.text}
FONTS: ${palette.fonts.header} / ${palette.fonts.body}

AVOID THESE RECENT QUOTES:
"${avoidQuotes}"

Requirements:
- 80-200 characters
- Original, unique, and FACTUALLY ACCURATE
- ${context.language || 'english'} language only
- Deep, meaningful wisdom - NOT generic or oversimplified
- The quote must be logically sound and hold up under scrutiny
- Do NOT oversimplify complex topics (wealth, health, relationships)
- Should feel timeless and wise, like a Stoic philosopher or experienced mentor
- Not a cliché

Return ONLY valid JSON:
{
  "quoteText": "your accurate, impactful wisdom here",
  "title": "Hook Title (Curiosity/Wisdom Frame)",
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
   - TEXT COLOR: Pure white (#FFFFFF)
   - GLOW: Subtle white glow on key words
   - COMPOSITION: Text centered, generous margins (20%+), instagram square 1:1
   - NO decorations, graphics, or icons - pure typography only
   ${context.contentType === 'video' ? '- MOTION: Words appear one-by-one, powerful word 2x larger with impact' : ''}
   
   ⚠️ Keep visual prompt SHORT (80-120 words). Focus on background mood only. Text rendering is handled separately.`;
    }

    return `
🎨 **Visual Prompt Requirements** (${context.contentType} - ${palette.name.toUpperCase()} AESTHETIC):
   
   🚨 LANGUAGE: ${textInstruction}
   
   ═══ COLORS ═══
   • Primary: ${palette.primary} | Secondary: ${palette.secondary} | Accent: ${palette.accent} | Text: ${palette.text}
   
   ═══ BACKGROUND SCENE (match quote emotion) ═══
   ${context.style === 'monks-midnight' ? '• Deep navy scene, champagne gold rim lighting, dark wood, luxury study at midnight' : ''}
   ${context.style === 'dark-academia' ? '• Dimly lit library, leather-bound books, rain on windows, candle flames' : ''}
   ${context.style === 'noir-cinematic' ? '• Noir lighting, cold blue tints, light trails, motion blur, neon on wet streets' : ''}
   ${context.style === 'olive-spruce' ? '• Dense forest at dawn, morning mist, bark/moss textures, earthy atmosphere' : ''}
   ${context.style === 'plum-noir' ? '• Candlelit scene, velvet textures, wine-dark shadows, antique elements' : ''}
   ${context.style === 'slate-rust' ? '• Industrial textures (leather, wood, stone), worn surfaces, gritty' : ''}
   ${context.style === 'raw-authentic' ? '• Handheld camera look, 35mm film grain, VHS glitch, raw texture' : ''}
   
   ═══ ATMOSPHERE ═══
   • 35mm film grain, noise texture, atmospheric fog, vignette
   • Dramatic low-key lighting, Instagram square 1:1
   • Clean composition with generous negative space for text readability
   • NO faces or people (abstract/symbolic only)
   ${context.contentType === 'video' ? '• MOTION: Slow push-in camera, atmospheric particles, fog drift' : '• STATIC: Layered depth, dramatic shadows'}
   
   ⚠️ IMPORTANT: Keep visual prompt SHORT (100-150 words). Describe BACKGROUND & MOOD only.
   Text rendering is handled separately - do NOT describe fonts, text sizes, or text placement details.`;
  },
};
