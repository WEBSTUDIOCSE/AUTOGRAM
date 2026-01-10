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

    const prompt = `Generate a comprehensive, visually appealing blog post about this specific quote: "${context.quoteText}"${context.author ? ` by ${context.author}${context.profession ? ` (${context.profession})` : ''}` : ''}.

Category: ${context.category}
Themes: ${context.subcategories.join(', ')}

🌍 **LANGUAGE REQUIREMENT**: ${langConfig.instruction}

🚨 **CRITICAL INSTRUCTIONS**:
- ALL content MUST be specifically about THIS quote: "${context.quoteText}"
- NO generic or template text - everything must be unique to this quote
- Format HTML with proper line breaks and indentation for readability
- Use \\n for line breaks between tags
- Make the HTML human-readable with proper spacing
- **IMPORTANT**: Use SINGLE QUOTES (') for ALL HTML attributes, NOT double quotes (")
- Example: <div class='blog-post'> NOT <div class="blog-post">
- This prevents JSON escaping issues

REQUIREMENTS:

1. **HTML STRUCTURE** (properly formatted with line breaks):
   <article class="blog-post">
     <header class="post-header">
       ...header content with proper indentation...
     </header>
     <section class="main-content">
       ...main content...
     </section>
   </article>

2. **HEADER SECTION**:
   - <div class="post-meta"> with:
     * Reading time estimate based on actual content length
     * Category: ${context.category}
     * Current date
   - <div class="featured-quote-box"> displaying: "${context.quoteText}"${context.author ? ` by ${context.author}` : ''}
   - Opening paragraph (2-3 sentences) that directly relates to THIS specific quote and its themes: ${context.subcategories.join(', ')}

3. **MAIN CONTENT** (3-5 sections analyzing THIS specific quote):
   Section 1: Deep analysis of what THIS quote specifically means
   - Break down the key phrases in "${context.quoteText}"
   - Explain the philosophy behind these specific words
   - Connect to themes: ${context.subcategories.join(', ')}
   
   Section 2: Real-world examples of THIS quote's principle
   - 2-3 specific, detailed examples (with names, situations, outcomes)
   - Show how people have applied THIS wisdom
   - Include an <div class="example-box"> with concrete scenarios
   
   Section 3: Psychology/Science behind THIS quote's message
   - Research or psychological principles that support THIS quote
   - Why THIS message works scientifically
   - Include <div class="stats-box"> if relevant data exists
   
   Section 4: Practical application of THIS quote
   - Specific steps to implement THIS wisdom
   - How to apply THIS quote in daily life
   - Real scenarios where THIS applies

4. **VISUAL ELEMENTS** (use throughout):
   - <div class="insight-card"> for key insights about THIS quote
   - <div class="example-box"> for real examples
   - <blockquote class="pull-quote"> for powerful related insights
   - <div class="callout tip"> for practical tips
   - <strong class="highlight"> for 5-7 key concepts

5. **ACTION PLAN SECTION**:
   <section class="action-plan">
     <h2>Apply This Wisdom Today</h2>
     <p>Specific introduction about implementing THIS quote</p>
     <ol class="action-steps">
       4-5 detailed, actionable steps specifically for THIS quote
     </ol>
     <div class="challenge-box">
       7-day challenge specifically designed around THIS quote's message
     </div>
     <h3>Quick Wins</h3>
     <ul class="quick-wins">
       3-5 immediate actions related to THIS quote
     </ul>
   </section>

6. **REFLECTION SECTION**:
   <div class="reflection-prompt">
     <h3>💭 Reflect on This</h3>
     <ul>
       4-5 thought-provoking questions specifically about THIS quote and its application
     </ul>
   </div>
   <div class="key-takeaways">
     <h3>📌 Key Insights</h3>
     <ul>
       5-7 main takeaways specifically from THIS quote's wisdom
     </ul>
   </div>

7. **FOOTER**:
   - <div class="author-note"> about THIS specific quote's context/origin
   - <div class="related-topics"> suggesting topics related to ${context.subcategories.join(', ')}
   - <div class="share-prompt"> encouraging reflection on THIS quote

8. **FORMATTING RULES**:
   ✅ Use \\n between ALL major tags for readability
   ✅ Indent nested elements properly
   ✅ Make HTML human-readable
   ✅ Include proper line breaks in the JSON string value
   ✅ Length: 1200-1800 words of actual content

9. **CONTENT MUST BE**:
   ✅ 100% specific to THIS quote: "${context.quoteText}"
   ✅ Original analysis, not generic templates
   ✅ Detailed examples with specifics
   ✅ Actionable and practical
   ✅ Inspiring and engaging tone

Return ONLY valid JSON. CRITICAL: Escape all quotes and special characters properly:
{
  "htmlContent": "Your complete HTML string here with properly escaped quotes"
}

ESCAPING RULES:
- Replace all " (double quotes) inside HTML attributes with ' (single quotes)
- Use ' for HTML attribute quotes: class='blog-post' NOT class="blog-post"
- Escape any remaining " as \\"
- Use \\n for line breaks in the JSON string

REMEMBER: Format the HTML with \\n line breaks so it's readable when displayed!`;

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
