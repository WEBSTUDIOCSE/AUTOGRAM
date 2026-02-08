/**
 * Module 9: Motivational Quote Blog Content Generator
 * Generates comprehensive blog content based on motivational quotes
 */

import { genAI, getTextModelName } from '@/lib/ai/gemini';

export interface BlogContent {
  htmlContent: string; // Complete HTML-formatted blog post (800-1200 words)
}

interface BlogGenerationContext {
  quoteText: string;
  author?: string;
  profession?: string;
  category: string;
  subcategories: string[];
  language?: string;
}

export const MotivationalBlogGeneratorService = {
  /**
   * Generate comprehensive blog content for a motivational quote
   */
  async generateBlogContent(context: BlogGenerationContext): Promise<BlogContent> {
    const modelName = getTextModelName();
    
    const language = context.language || 'english';
    const langConfig = language === 'hindi' 
      ? { name: 'Hindi', instruction: 'Write all content in Hindi (Devanagari script)' }
      : language === 'marathi'
      ? { name: 'Marathi', instruction: 'Write all content in Marathi (Devanagari script)' }
      : { name: 'English', instruction: 'Write all content in English' };

    const prompt = `Create a comprehensive, beautifully formatted blog post about this motivational quote: "${context.quoteText}"${context.author ? ` by ${context.author}${context.profession ? ` (${context.profession})` : ''}` : ''}.

Category: ${context.category}
Themes: ${context.subcategories.join(', ')}

🌍 **LANGUAGE**: ${langConfig.instruction}

═══════════════════════════════════════════════════════
  2026 "DIGITAL STOIC" BLOG VOICE
═══════════════════════════════════════════════════════

You are writing as "The Digital Stoic" — a modern mentor who combines ancient philosophy with 2026 realities. Your voice is:
- DIRECT: Address the reader as "You". No fluff, no filler.
- AUTHORITATIVE: Like a letter from Seneca meets James Clear's Atomic Habits.
- RAW: Short paragraphs (2-4 sentences MAX). Punchy. Cuts through the noise.
- HONEST: Not afraid to tell hard truths. Discipline > feelings.
- PRACTICAL: Every section must have actionable takeaways.

Stylistic Rules:
- Use "Bionic Reading" principle: Bold the first few letters of KEY words for skimming
- Frequent line breaks. No walls of text.
- Short, devastating sentences that hit like punches.
- Concrete examples with real names, situations, outcomes
- Open with a pattern interrupt or negative frame hook
- Close with a "Protocol" or actionable system, not just inspiration

🎨 **DESIGN SYSTEM - MONK MODE DARK EDITORIAL**
Think high-quality dark mode editorial. Premium. "Quiet Luxury" aesthetic.

✅ **DESIGN PRINCIPLES**:
- **Dark Mode First**: Content designed for nighttime readers (prime Monk Mode demographic)
- **Typography Focus**: Let the words shine through clean hierarchy
- **Subtle Elegance**: Delicate borders, generous whitespace, refined details
- **Monk Mode Feel**: Think dimly lit study, not bright office

🎯 **STRICT STYLING RULES**:

**Color Palette (DARK MODE - MONK'S MIDNIGHT)**:
- Background: #07162A (Deep Navy) — primary surface
- Card/Surface: #0B2340 (Midnight Blue) — elevated elements
- Text (Primary): #FDFDFD (Off-White) — body and headers
- Text (Muted): #8899AA (Slate Blue) — metadata, captions
- Accent/Highlight: #E6D3A6 (Champagne Gold) — key terms, borders, emphasis
- Secondary Accent: #B8A992 (Universal Khaki) — subtle highlights
- Borders: #1A3355 (Dark Border) — card and section borders
- Error/Warning: #FF6B6B — for "hard truth" callouts

**Container Styling**:
- Insight Boxes: background #0B2340, border: 1px solid #1A3355, border-radius: 0.5rem
- Quote Blocks: border-left: 3px solid #E6D3A6, padding-left: 1.5rem, italic, color: #8899AA
- "Hard Truth" Callouts: background #1A0A0A, border-left: 3px solid #FF6B6B
- Key Sections: background #0B2340, border: 1px solid #1A3355, rounded corners
- Highlighted Text: background: #1A3355 (subtle navy), color: #E6D3A6 (gold)
- Metadata Sections: uppercase text, letter-spacing: 0.05em, color: #8899AA, font-size: 0.75rem

**Typography**:
- Headings: font-weight: 700, letter-spacing: -0.02em, color: #FDFDFD
- Body: line-height: 1.75, color: #FDFDFD, font-size: 1.125rem (18px)
- Captions/Meta: text-transform: uppercase, letter-spacing: 0.1em, font-size: 0.75rem, color: #8899AA
- Short paragraphs: 2-4 sentences max — the "Digital Stoic" way
- Bold key terms: <strong style="color: #E6D3A6"> for emphasis (gold highlights)

**Spacing & Layout**:
- Section spacing: margin: 2.5rem 0
- Container padding: 1.5rem to 2rem
- Line height: 1.75 for readability
- Border radius: 0.5rem (8px) — consistent throughout

📝 **CONTENT STRUCTURE** (2026 Digital Stoic editorial):

**Opening Section**:
- Start with a PATTERN INTERRUPT or negative frame hook (first line must stop the scroll)
- Example openings: "You've been lied to." / "Stop reading this if you're comfortable." / "Most people will ignore this."
- Follow with the centered, prominent quote block (styled as below)
- Metadata tags (category, themes) in uppercase small gold text
- Opening analysis: what THIS specific quote means in the context of 2026

**The Core Analysis** (use "Digital Stoic" voice):
- Break down the quote word by word - what EXACTLY does it mean
- Reference Stoic philosophers (Marcus Aurelius, Seneca, Epictetus) where relevant
- Use concrete modern examples: a coder at 3AM, an entrepreneur burning through savings, a student studying while friends party
- "Hard Truth" callout boxes for uncomfortable wisdom
- Short paragraphs. Punchy sentences. No filler.

**The Protocol Section** (Actionable System):
- Don't just inspire - give a SYSTEM
- "The 3-Step Protocol" or "The Monk Mode Implementation"
- Concrete action steps in numbered format
- Include time-specific guidance ("Week 1: ...", "Day 1-7: ...")
- This section differentiates from generic motivation blogs

**Closing Section**:
- Key insight in a prominent gold-accented container
- A "Hard Truth" final statement
- Reflection question that haunts the reader
- NO fluffy "you can do it!" ending - end with a challenge or stoic reflection
- Reflection questions in clean layout
- Final thoughts connecting back to the main quote

**Visual Variety**:
- Mix plain paragraphs with styled containers (65% plain, 35% styled)
- Strategic use of spacing for visual rhythm
- Clean scannable sections with clear typography hierarchy
- Balance text-heavy sections with visual breaks
- Minimal but impactful use of emojis (⚡ 🎯 📖 💀 🔥 ⚔️)
- Use "Hard Truth" callout boxes sparingly (max 2-3 per post)

**Content Quality**:
- Length: 1500-3000 words for depth
- 100% specific to THIS quote: "${context.quoteText}"
- NO generic templates - unique analysis rooted in Stoic philosophy
- Short paragraphs (2-4 sentences max) - the "Digital Stoic" standard
- Concrete, specific examples with details (names, situations, outcomes)
- Actionable "Protocol" section - systems, not just inspiration
- RAW and HONEST tone - uncomfortable truths > comfortable lies
- "You" voice throughout - direct address to the reader
- Editorial voice: sophisticated, stoic, authoritative, no-nonsense
- Reference real philosophical sources where applicable

🎨 **VISUAL BALANCE**:
- 65% clean paragraphs, 35% styled containers
- Use white space generously (margin: 2.5rem between major sections)
- Maintain consistent border styling (#1A3355, 1px) with gold accents (#E6D3A6)
- Dark Mode first - all colors designed for #07162A background
- Typography does the heavy lifting - let words breathe
- Scannable sections with clear visual hierarchy
- Monk Mode editorial aesthetic - premium, timeless, dark

⛔ **FORBIDDEN**:
- NO bright happy colors (yellow, lime green, sky blue, etc.)
- NO gradient backgrounds
- NO heavy shadows or effects
- NO "You can do it!" or "Believe in yourself!" generic motivation
- NO cluttered layouts
- NO emoji overload
- NO preachy or condescending tone
- Keep it dark, clean, premium, editorial

**Remember**: The "Digital Stoic" aesthetic is about DARK PREMIUM MINIMALISM. Think *The New Yorker* at midnight, not a colorful motivational blog. Deep Navy backgrounds, Champagne Gold accents, and typography that commands respect.

⚡ **STYLING EXAMPLES** (Monk Mode Dark Editorial):

**Main Quote Block** (prominent feature - gold accent):
<div style="background: #0B2340; border: 1px solid #1A3355; border-radius: 0.5rem; padding: 2rem; margin: 2.5rem 0; text-align: center;">
  <blockquote style="font-size: 1.5rem; font-style: italic; color: #E6D3A6; line-height: 1.6; margin: 0; font-weight: 600; letter-spacing: -0.02em;">
    "${context.quoteText}"
  </blockquote>
  <p style="margin-top: 1rem; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.1em; color: #8899AA; font-weight: 500;">
    — ${context.author || 'The Digital Stoic'}${context.profession ? `, ${context.profession}` : ''}
  </p>
</div>

**"Hard Truth" Callout Box** (uncomfortable wisdom):
<div style="background: #1A0A0A; border: 1px solid #331A1A; border-left: 3px solid #FF6B6B; border-radius: 0.5rem; padding: 1.5rem; margin: 2rem 0;">
  <p style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #FF6B6B; margin-bottom: 0.75rem;">
    💀 Hard Truth
  </p>
  <p style="color: #FDFDFD; line-height: 1.75; margin: 0; font-size: 1.125rem;">
    Your hard truth text here...
  </p>
</div>

**Insight/Key Point Box** (clean, dark):
<div style="background: #0B2340; border: 1px solid #1A3355; border-left: 3px solid #E6D3A6; border-radius: 0.5rem; padding: 1.5rem; margin: 2rem 0;">
  <p style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #E6D3A6; margin-bottom: 0.75rem;">
    ⚡ Key Insight
  </p>
  <p style="color: #FDFDFD; line-height: 1.75; margin: 0; font-size: 1.125rem;">
    Your insight text here...
  </p>
</div>

**Story/Example Section** (subtle dark background):
<div style="background: #0B2340; border: 1px solid #1A3355; border-radius: 0.5rem; padding: 1.5rem; margin: 2rem 0;">
  <h3 style="font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; color: #E6D3A6; margin-bottom: 1rem;">
    📖 The Real Story
  </h3>
  <p style="color: #FDFDFD; line-height: 1.75; margin: 0; font-size: 1rem;">
    Story content here...
  </p>
</div>

**Section Heading** (dark editorial with gold accent border):
<h2 style="font-size: 1.875rem; font-weight: 700; letter-spacing: -0.02em; color: #FDFDFD; margin-top: 3rem; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid #E6D3A6;">
  Section Title
</h2>

**Supporting Quote** (side-bordered, gold):
<blockquote style="border-left: 3px solid #E6D3A6; padding-left: 1.5rem; margin: 2rem 0; font-style: italic; color: #8899AA; font-size: 1.125rem; line-height: 1.75;">
  "Supporting quote text here..."
</blockquote>

**"The Protocol" Action Steps** (clean, dark, organized):
<div style="background: #0B2340; border: 1px solid #1A3355; border-radius: 0.5rem; padding: 2rem; margin: 2rem 0;">
  <h3 style="font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; color: #E6D3A6; margin-bottom: 1.5rem;">
    ⚔️ The Protocol
  </h3>
  <ol style="color: #FDFDFD; line-height: 2; margin: 0; padding-left: 1.5rem; font-size: 1.125rem;">
    <li style="margin-bottom: 1rem;">First action step...</li>
    <li style="margin-bottom: 1rem;">Second action step...</li>
  </ol>
</div>

**Metadata/Caption Style**:
<p style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #8899AA; margin: 1rem 0; font-weight: 500;">
  Discipline • Stoicism • Monk Mode
</p>

**Highlighted Text** (inline gold emphasis):
<strong style="color: #E6D3A6;">important term</strong>

Return ONLY valid JSON with properly escaped HTML:
{
  "htmlContent": "Your beautifully formatted HTML here"
}

**JSON ESCAPING**: Escape double quotes as \\" and use \\n for line breaks where needed.`;

    try {
      const response = await genAI.models.generateContent({
        model: modelName,
        contents: prompt,
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
        throw new Error('No response from AI model');
      }

      // Try to extract JSON from response - handle markdown code blocks
      let jsonString = '';
      
      // Remove markdown code blocks if present
      generatedText = generatedText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      
      // Find JSON object
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse blog content response - no JSON found');
      }

      jsonString = jsonMatch[0];
      
      // Try to parse JSON with error recovery
      let parsed;
      try {
        parsed = JSON.parse(jsonString);
      } catch (parseError) {
        
        // Attempt to fix common JSON issues
        // 1. Fix unescaped quotes in HTML content
        try {
          // Extract the htmlContent value more carefully
          const contentMatch = jsonString.match(/"htmlContent"\s*:\s*"([\s\S]*?)"\s*\}/);
          if (contentMatch) {
            let htmlContent = contentMatch[1];
            
            // The content is already in the JSON, so we just need to extract it properly
            // Try parsing with a more lenient approach
            const fixedJson = jsonString
              .replace(/\\n/g, '\\n')  // Ensure line breaks are properly escaped
              .replace(/\\'/g, "'")    // Unescape single quotes
              .replace(/\\"/g, '"');   // Handle escaped quotes
            
            parsed = JSON.parse(fixedJson);
          } else {
            throw parseError; // Re-throw if we can't extract content
          }
        } catch (fixError) {
          throw new Error(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        }
      }

      // Validate content
      if (!parsed.htmlContent) {
        throw new Error('Incomplete blog content generated - missing htmlContent field');
      }

      return {
        htmlContent: parsed.htmlContent.trim(),
      };

    } catch (error) {
      
      // Don't use fallback - throw error so caller knows generation failed
      throw new Error(`Blog content generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
};

