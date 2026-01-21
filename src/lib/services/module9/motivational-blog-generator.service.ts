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

    console.log(`📝 [Blog Generator] Generating blog content for quote in ${langConfig.name}...`);

    const prompt = `Create a comprehensive, beautifully formatted blog post about this motivational quote: "${context.quoteText}"${context.author ? ` by ${context.author}${context.profession ? ` (${context.profession})` : ''}` : ''}.

Category: ${context.category}
Themes: ${context.subcategories.join(', ')}

🌍 **LANGUAGE**: ${langConfig.instruction}

🎨 **DESIGN SYSTEM - CLASSIC EDITORIAL STYLE**
Follow the EliteMindsetForge newspaper/editorial aesthetic - minimal, sophisticated, timeless.

✅ **DESIGN PRINCIPLES**:
- **Minimalist Color Palette**: Use only zinc/gray tones - NO bright colors
- **Typography Focus**: Let the words shine through clean hierarchy
- **Subtle Elegance**: Delicate borders, generous whitespace, refined details
- **Editorial Feel**: Think high-quality newspaper or literary magazine

🎯 **STRICT STYLING RULES**:

**Color Palette (ONLY USE THESE)**:
- Background (Paper): #FAFAFA (light) / #09090B (dark)
- Foreground (Ink): #18181B (light) / #FAFAFA (dark)
- Card/Surface: #FFFFFF (light) / #18181B (dark)
- Borders: #E4E4E7 (light) / #27272A (dark)
- Muted Text: #71717A (metadata, captions)
- Secondary Background: #F4F4F5 (light) / #27272A (dark)

**Container Styling** (use throughout):
- Insight Boxes: white background, border: 1px solid #E4E4E7, border-radius: 0.5rem
- Quote Blocks: border-left: 3px solid #18181B, padding-left: 1.5rem, italic, color: #71717A
- Key Sections: background: #FFFFFF, border: 1px solid #E4E4E7, rounded corners
- Highlighted Text: background: #F4F4F5 (subtle gray), NO bright colors
- Metadata Sections: uppercase text, letter-spacing: 0.05em, color: #71717A, font-size: 0.75rem

**Typography**:
- Headings: font-weight: 700, letter-spacing: -0.02em, color: #18181B
- Body: line-height: 1.75, color: #18181B, font-size: 1.125rem (18px)
- Captions/Meta: text-transform: uppercase, letter-spacing: 0.1em, font-size: 0.75rem
- Short paragraphs: 2-4 sentences max

**Spacing & Layout**:
- Section spacing: margin: 2.5rem 0
- Container padding: 1.5rem to 2rem
- Line height: 1.75 for readability
- Border radius: 0.5rem (8px) - consistent throughout

📝 **CONTENT STRUCTURE** (arrange dynamically in editorial style):

**Opening Section**:
- Start with a centered, prominent quote block (see styling example above)
- Follow with metadata tags (category, themes) in uppercase small text
- Opening analysis paragraph(s) - what THIS specific quote means

**Main Content Sections** (use editorial hierarchy):
- Section headings with bottom borders (#E4E4E7)
- Mix of regular paragraphs and styled containers
- Real-world examples in subtle gray boxes (#F4F4F5 background)
- Psychological/scientific backing in clean white bordered boxes
- Supporting quotes as side-bordered blockquotes

**Practical Application**:
- Action steps in organized list format within bordered container
- Implementation advice in clear, scannable format
- Concrete, specific guidance

**Closing Section**:
- Key insights/takeaways in prominent styled container
- Reflection questions in clean layout
- Final thoughts connecting back to the main quote

**Visual Variety**:
- Mix plain paragraphs with styled containers (70% plain, 30% styled)
- Strategic use of spacing for visual rhythm
- Clean scannable sections with clear typography hierarchy
- Balance text-heavy sections with visual breaks
- Minimal but impactful use of emojis (🎯 💡 📖 ✨)

**Content Quality**:
- Length: 1500-3000 words for depth
- 100% specific to THIS quote: "${context.quoteText}"
- NO generic templates - unique analysis for this wisdom
- Short paragraphs (2-4 sentences max) for readability
- Concrete, specific examples with details (names, situations, outcomes)
- Actionable and practical advice
- Inspirational yet evidence-based
- Engaging tone (use "you" to connect with readers)
- Editorial voice: sophisticated, thoughtful, authoritative yet approachable

🎨 **VISUAL BALANCE**:
- 70% clean paragraphs, 30% styled containers
- Use white space generously (margin: 2.5rem between major sections)
- Maintain consistent border styling (#E4E4E7, 1px)
- Keep colors minimal - only zinc/gray palette
- Typography does the heavy lifting - let words breathe
- Scannable sections with clear visual hierarchy
- Modern editorial aesthetic - timeless, not trendy

⛔ **FORBIDDEN**:
- NO bright colors (blue, green, yellow, indigo, etc.)
- NO gradient backgrounds
- NO heavy shadows or effects
- NO cluttered layouts
- NO excessive decoration
- Keep it clean, minimal, editorial

**Remember**: The EliteMindsetForge aesthetic is about sophisticated minimalism - think *The New Yorker* or *Medium*, not colorful blogs. Let typography, spacing, and subtle borders create the visual interest.

⚡ **STYLING EXAMPLES** (Editorial Aesthetic):

**Main Quote Block** (prominent feature):
<div style="background: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 0.5rem; padding: 2rem; margin: 2.5rem 0; text-align: center;">
  <blockquote style="font-size: 1.5rem; font-style: italic; color: #18181B; line-height: 1.6; margin: 0; font-weight: 600; letter-spacing: -0.02em;">
    "${context.quoteText}"
  </blockquote>
  <p style="margin-top: 1rem; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.1em; color: #71717A; font-weight: 500;">
    — ${context.author}${context.profession ? `, ${context.profession}` : ''}
  </p>
</div>

**Insight/Key Point Box** (clean, minimal):
<div style="background: #FFFFFF; border: 1px solid #E4E4E7; border-left: 3px solid #18181B; border-radius: 0.5rem; padding: 1.5rem; margin: 2rem 0;">
  <p style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #71717A; margin-bottom: 0.75rem;">
    💡 Key Insight
  </p>
  <p style="color: #18181B; line-height: 1.75; margin: 0; font-size: 1.125rem;">
    Your insight text here...
  </p>
</div>

**Story/Example Section** (subtle gray background):
<div style="background: #F4F4F5; border: 1px solid #E4E4E7; border-radius: 0.5rem; padding: 1.5rem; margin: 2rem 0;">
  <h3 style="font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; color: #18181B; margin-bottom: 1rem;">
    📖 Real-World Example
  </h3>
  <p style="color: #18181B; line-height: 1.75; margin: 0; font-size: 1rem;">
    Story content here...
  </p>
</div>

**Section Heading** (minimal, editorial):
<h2 style="font-size: 1.875rem; font-weight: 700; letter-spacing: -0.02em; color: #18181B; margin-top: 3rem; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid #E4E4E7;">
  Section Title
</h2>

**Supporting Quote** (side-bordered):
<blockquote style="border-left: 3px solid #18181B; padding-left: 1.5rem; margin: 2rem 0; font-style: italic; color: #71717A; font-size: 1.125rem; line-height: 1.75;">
  "Supporting quote text here..."
</blockquote>

**Action Steps List** (clean, organized):
<div style="background: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 0.5rem; padding: 2rem; margin: 2rem 0;">
  <h3 style="font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; color: #18181B; margin-bottom: 1.5rem;">
    Practical Steps
  </h3>
  <ol style="color: #18181B; line-height: 2; margin: 0; padding-left: 1.5rem; font-size: 1.125rem;">
    <li style="margin-bottom: 1rem;">First action step...</li>
    <li style="margin-bottom: 1rem;">Second action step...</li>
  </ol>
</div>

**Metadata/Caption Style**:
<p style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #71717A; margin: 1rem 0; font-weight: 500;">
  Research • Psychology • Mindset
</p>

**Highlighted Text** (inline emphasis):
<span style="background: #F4F4F5; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-weight: 500;">
  important term
</span>

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

      console.log('📄 [Blog Generator] Raw response length:', generatedText.length);

      // Try to extract JSON from response - handle markdown code blocks
      let jsonString = '';
      
      // Remove markdown code blocks if present
      generatedText = generatedText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      
      // Find JSON object
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Failed to find JSON in response:', generatedText.substring(0, 300));
        throw new Error('Failed to parse blog content response - no JSON found');
      }

      jsonString = jsonMatch[0];
      
      // Try to parse JSON with error recovery
      let parsed;
      try {
        parsed = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Problematic JSON substring:', jsonString.substring(0, 500));
        
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
          console.error('Failed to fix JSON:', fixError);
          throw new Error(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        }
      }

      // Validate content
      if (!parsed.htmlContent) {
        throw new Error('Incomplete blog content generated - missing htmlContent field');
      }

      console.log('✅ [Blog Generator] Blog content generated successfully');
      console.log(`   HTML Content: ${parsed.htmlContent.length} chars`);

      return {
        htmlContent: parsed.htmlContent.trim(),
      };

    } catch (error) {
      console.error('❌ [Blog Generator] Error:', error);
      
      // Don't use fallback - throw error so caller knows generation failed
      throw new Error(`Blog content generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
};

