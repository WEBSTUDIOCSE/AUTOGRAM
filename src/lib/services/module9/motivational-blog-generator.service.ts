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

    const prompt = `Generate an engaging, well-formatted blog post reflection on the quote: "${context.quoteText}"${context.author ? ` by ${context.author}` : ''}.

Category: ${context.category}
Themes: ${context.subcategories.join(', ')}

🌍 **LANGUAGE REQUIREMENT**: ${langConfig.instruction}

REQUIREMENTS:

1. **HTML Structure** - Use these tags properly:
   - <h2> for main sections
   - <h3> for subsections
   - <p> for paragraphs (keep them 2-4 sentences each)
   - <strong> for emphasis on key concepts
   - <blockquote> for highlighting important insights or secondary quotes
   - <ul> and <li> for lists of actionable points

2. **Content Style**:
   - Write in an inspiring, motivational tone
   - Use storytelling and real-world examples
   - Break complex ideas into digestible sections
   - Include 3-5 main sections with clear headings
   - Each paragraph should flow naturally to the next

3. **Structure the content like this**:
   - Opening paragraph connecting to reader's life
   - 2-3 core insights with <h2> headings
   - Include at least one <blockquote> with a powerful takeaway
   - Practical action steps in a <ul> list
   - Closing paragraph with inspiration

4. **Formatting Guidelines**:
   - Use <strong> to highlight 3-5 key phrases throughout
   - Add a blockquote with a complementary insight
   - Keep paragraphs short (3-5 lines max)
   - Use subheadings every 200-300 words
   - Include a bulleted list of takeaways or action steps

5. **Length**: 800-1200 words

Return ONLY valid JSON (no markdown, no code blocks):
{
  "htmlContent": "<p>Your complete HTML content here...</p>"
}

Return only clean HTML in the JSON field with no markdown, no code blocks, no explanations - just the formatted HTML content ready to display.`;

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

      // Extract JSON from response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Failed to parse AI response:', generatedText.substring(0, 200));
        throw new Error('Failed to parse blog content response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate content
      if (!parsed.htmlContent) {
        throw new Error('Incomplete blog content generated');
      }

      console.log('✅ [Blog Generator] Blog content generated successfully');
      console.log(`   HTML Content: ${parsed.htmlContent.length} chars`);

      return {
        htmlContent: parsed.htmlContent.trim(),
      };

    } catch (error) {
      console.error('❌ [Blog Generator] Error:', error);
      
      // Return fallback content
      return this.generateFallbackContent(context);
    }
  },

  /**
   * Generate basic fallback content if AI generation fails
   */
  generateFallbackContent(context: BlogGenerationContext): BlogContent {
    console.log('⚠️ [Blog Generator] Using fallback content');
    
    const author = context.author || 'Unknown';
    const themes = context.subcategories.join(', ');
    
    return {
      htmlContent: `<p>This powerful quote${context.author ? ` by ${context.author}` : ''} invites us to reflect on our journey and the choices we make. The wisdom contained in these words speaks to themes of ${themes}, offering guidance for those seeking growth and transformation.</p>

<h2>Understanding the Deeper Meaning</h2>
<p>At its core, this message reminds us of the <strong>power of intentional living</strong>. It encourages us to look beyond our current circumstances and recognize the potential for positive change that exists within each moment.</p>

<p>The quote touches on universal human experiences related to ${context.category}, making it relevant regardless of where we are in our personal journey. By contemplating these words, we open ourselves to new perspectives and possibilities.</p>

<blockquote>The wisdom of great minds becomes our own when we apply it with intention and courage.</blockquote>

<h2>Bringing This Wisdom to Life</h2>
<p>To translate this profound insight into daily action, consider these practical approaches:</p>

<ul>
<li><strong>Morning Reflection:</strong> Begin each day by contemplating the quote's meaning and how it applies to your current goals</li>
<li><strong>Identify Opportunities:</strong> Look for specific situations where you can embody the principles expressed in these words</li>
<li><strong>Small Steps:</strong> Set achievable daily goals that align with the quote's message</li>
<li><strong>Share the Wisdom:</strong> Discuss this insight with others who might benefit from its guidance</li>
<li><strong>Track Your Progress:</strong> Journal about your experiences applying this wisdom</li>
</ul>

<h3>Making It Personal</h3>
<p>Consider how the themes of ${themes} show up in your own life. Where can you apply more awareness? What changes might result from embracing this perspective?</p>

<h2>Stories of Transformation</h2>
<p>Throughout history, many remarkable individuals have lived by similar principles. Their journeys demonstrate that <strong>wisdom applied consistently creates lasting change</strong>.</p>

<p>Whether in business, relationships, or personal development, those who embrace such insights often find themselves moving through challenges with greater ease and achieving outcomes that once seemed impossible. The key lies not in perfect execution, but in persistent effort and genuine commitment.</p>

<p>By following their example and staying dedicated to your own growth, you too can experience the transformative power of living aligned with timeless wisdom. Remember to be patient with yourself as you integrate these principles into your daily life.</p>`,
    };
  },
};
