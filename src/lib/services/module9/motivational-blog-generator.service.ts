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

🎨 **CREATIVE FREEDOM**: You have FULL creative freedom to design a beautiful, engaging blog post. Create dynamic HTML that provides an exceptional reading experience.

✅ **YOU CAN USE**:
- All HTML elements (div, section, article, span, etc.)
- Inline styles for beautiful formatting
- Colored backgrounds, borders, shadows, spacing
- Custom layouts with varied visual hierarchy
- Emojis and visual markers where appropriate
- Any styling that enhances readability and engagement

🎯 **DESIGN GUIDELINES**:

**Visual Hierarchy**:
- Use different text sizes, weights, and colors for clear hierarchy
- Create generous spacing between sections (margin: 2-2.5rem)
- Add comfortable padding inside containers (1.5rem)
- Ensure proper line height for readability (1.6-1.8)

**Styled Containers** (use creatively throughout):
- Insight/key point boxes with subtle backgrounds (e.g., background: #f3f4f6; border-left: 4px solid #6366f1; padding: 1.5rem)
- Example/story boxes with distinct styling (e.g., background: #fefce8; border: 1px solid #fde047)
- Quote blocks with beautiful formatting (border-left, italic, larger font)
- Action steps in visually organized sections (background: #ecfdf5)
- Statistics/research in highlighted containers (background: #eff6ff)
- Key takeaways with prominent styling (gradient backgrounds, bold headers)

**Color & Styling Suggestions**:
- Subtle backgrounds: #f3f4f6 (gray), #eff6ff (blue), #fefce8 (yellow), #ecfdf5 (green)
- Accent colors for borders: #6366f1 (indigo), #3b82f6 (blue), #10b981 (green)
- Keep text readable: dark colors on light backgrounds
- Use border-radius (0.5-0.75rem) for modern look
- Add visual interest with border-left highlights

📝 **CONTENT TO INCLUDE** (be creative with structure):

**Essential Elements** (arrange dynamically):
- Opening analysis of what THIS specific quote means
- The main quote in a beautifully styled blockquote
- 3-5 real-world examples/stories (with names, situations, outcomes) in styled boxes
- Psychological/scientific backing in highlighted sections
- Practical action steps in visually organized format
- Key insights/takeaways in a prominent styled section
- At least 1-2 additional supporting quotes
- Concrete implementation advice
- Reflection questions or thought prompts

**Content Quality**:
- Length: 1500-3000 words for depth
- 100% specific to THIS quote: "${context.quoteText}"
- NO generic templates - unique analysis for this wisdom
- Short paragraphs (2-4 sentences)
- Concrete, specific examples with details
- Actionable and practical advice
- Inspirational yet evidence-based
- Engaging tone (use "you" to connect with readers)

🎨 **VISUAL VARIETY**:
- Mix plain paragraphs with styled containers
- Use visual breaks and spacing strategically
- Create scannable sections with clear headers
- Highlight important concepts with distinctive styling
- Balance aesthetics with readability
- Make it visually engaging without overwhelming

⚡ **STYLE EXAMPLES** (use as inspiration, adapt creatively):

Insight Box:
<div style="background: #f3f4f6; border-left: 4px solid #6366f1; padding: 1.5rem; margin: 2rem 0; border-radius: 0.5rem;">
  <p style="font-weight: 600; margin-bottom: 0.5rem;">💡 Key Insight</p>
  <p style="margin: 0;">Your insight here...</p>
</div>

Story Box:
<div style="background: #fefce8; border: 1px solid #fde047; padding: 1.5rem; margin: 2rem 0; border-radius: 0.75rem;">
  <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.75rem; color: #854d0e;">📖 Real Example</h3>
  <p style="margin: 0; color: #713f12;">Story here...</p>
</div>

Styled Quote:
<blockquote style="border-left: 4px solid #6366f1; padding-left: 1.5rem; margin: 2rem 0; font-style: italic; color: #6b7280; font-size: 1.125rem;">
  "Quote text here"
</blockquote>

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
