/**
 * Module 9: Motivational Quote Blog Content Generator
 * Generates comprehensive blog content based on motivational quotes
 */

import { genAI, getTextModelName } from '@/lib/ai/gemini';

export interface BlogContent {
  quoteAnalysis: string; // 300-500 words - Deep analysis of quote meaning
  practicalApplication: string; // 200-400 words - Real-life application scenarios
  relatedStories: string; // 200-300 words - Inspirational stories and examples
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

    const prompt = `Generate comprehensive blog content for this motivational quote:

"${context.quoteText}"${context.author ? `\n— ${context.author}${context.profession ? ` (${context.profession})` : ''}` : ''}

Category: ${context.category}
Themes: ${context.subcategories.join(', ')}

🌍 **LANGUAGE REQUIREMENT**: ${langConfig.instruction}

Generate THREE sections in valid JSON format:

1️⃣ **QUOTE ANALYSIS & EXPLANATION** (300-500 words):
   - Deep dive into what the quote truly means
   - Break down key phrases and their significance
   - Explore the philosophy or wisdom behind it
   - Discuss why this message is important
   - Connect to the themes: ${context.subcategories.join(', ')}
   ${context.author ? `- Relate to ${context.author}'s philosophy or background` : ''}
   - Make it engaging and thought-provoking
   - Use examples to illustrate meaning

2️⃣ **PRACTICAL APPLICATION** (200-400 words):
   - Provide 3-4 real-life scenarios where this quote applies
   - Give step-by-step guidance on implementing this wisdom
   - Include specific, actionable exercises or practices
   - Show how to apply it in daily life (work, relationships, personal growth)
   - Make it practical and immediately useful
   - Include concrete examples and mini case studies

3️⃣ **RELATED STORIES & EXAMPLES** (200-300 words):
   - Share 1-2 inspiring real-world stories that embody this quote's message
   - Include examples of famous people or historical figures who lived this principle
   - Provide relatable scenarios that readers can connect with
   - Make the stories vivid and emotionally engaging
   - Show the transformational impact of applying this wisdom

📝 **WRITING GUIDELINES**:
   - ${langConfig.instruction}
   - Write in an engaging, conversational tone
   - Use storytelling and vivid examples
   - Be specific and concrete, not abstract
   - Make it inspiring and actionable
   - Ensure proper word count for each section
   - Use natural paragraph breaks (\\n\\n for new paragraphs)
   - Write as if speaking to a friend seeking wisdom

Return ONLY valid JSON (no markdown, no code blocks):
{
  "quoteAnalysis": "Your 300-500 word analysis here with \\n\\n for paragraph breaks",
  "practicalApplication": "Your 200-400 word practical guide here with \\n\\n for paragraph breaks",
  "relatedStories": "Your 200-300 word stories here with \\n\\n for paragraph breaks"
}`;

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
      if (!parsed.quoteAnalysis || !parsed.practicalApplication || !parsed.relatedStories) {
        throw new Error('Incomplete blog content generated');
      }

      console.log('✅ [Blog Generator] Blog content generated successfully');
      console.log(`   Analysis: ${parsed.quoteAnalysis.length} chars`);
      console.log(`   Application: ${parsed.practicalApplication.length} chars`);
      console.log(`   Stories: ${parsed.relatedStories.length} chars`);

      return {
        quoteAnalysis: parsed.quoteAnalysis.trim(),
        practicalApplication: parsed.practicalApplication.trim(),
        relatedStories: parsed.relatedStories.trim(),
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
    
    return {
      quoteAnalysis: `This powerful ${context.category} quote "${context.quoteText}" carries deep wisdom that resonates with themes of ${context.subcategories.join(', ')}. The message encourages us to reflect on our journey and the choices we make. Each word holds significance, reminding us of the importance of mindful action and intentional living. This quote speaks to the universal human experience and offers guidance for those seeking to grow and improve.`,
      
      practicalApplication: `To apply this wisdom in daily life, start by reflecting on how it relates to your current situation. Consider specific areas where you can implement this principle. Practice mindfulness and intentional action in your decisions. Set small, achievable goals that align with this wisdom. Make it a habit to review and reflect on your progress regularly.`,
      
      relatedStories: `Throughout history, many successful individuals have embodied this principle. Their stories demonstrate the transformational power of applying such wisdom consistently. By following similar principles, ordinary people have achieved extraordinary results in their personal and professional lives.`,
    };
  },
};
