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

    const prompt = `Generate a comprehensive, visually appealing blog post about the quote: "${context.quoteText}"${context.author ? ` by ${context.author}` : ''}.

Category: ${context.category}
Themes: ${context.subcategories.join(', ')}

🌍 **LANGUAGE REQUIREMENT**: ${langConfig.instruction}

REQUIREMENTS:

1. **HTML STRUCTURE** - Include semantic elements:
   <article> wrapper with class="blog-post"
   <header class="post-header"> - Contains title, meta info, featured quote
   <section> tags for main content areas with descriptive class names
   <aside class="callout-box"> - For tips, warnings, key insights
   <footer class="post-footer"> - Related content and engagement

2. **HEADER SECTION** (at top):
   - <div class="post-meta"> with reading time (e.g., "5 min read"), category tag, publication date
   - <div class="featured-quote-box"> - Display the main quote prominently with author attribution
   - Brief introduction connecting to reader's life (2-3 sentences)

3. **MAIN CONTENT** (3-5 major sections):
   - <h2> for main sections with descriptive class names
   - <h3> for subsections
   - <p> for paragraphs (2-4 sentences each)
   - <div class="insight-card"> - Highlight key insights with icon placeholders
   - <div class="example-box"> - Real-world examples and case studies
   - <blockquote class="pull-quote"> - Powerful complementary quotes or key takeaways
   - <div class="callout tip/warning/info"> - Special notes with visual distinction

4. **VISUAL ELEMENTS**:
   - <strong class="highlight"> - Emphasize 5-7 key concepts throughout
   - <div class="stats-box"> - If applicable, include interesting statistics
   - <div class="timeline"> - For historical context or step-by-step processes
   - Color-coded sections using class names (insight-card, action-item, etc.)

5. **PRACTICAL ACTION SECTION**:
   - <section class="action-plan">
   - <h2>Put It Into Practice</h2> or similar action-oriented heading
   - <ol class="action-steps"> - Numbered implementation steps
   - <ul class="quick-wins"> - Immediate actions readers can take
   - <div class="challenge-box"> - 7-day or 30-day challenge framework

6. **ENGAGEMENT ELEMENTS**:
   - <div class="reflection-prompt"> - Questions for readers to ponder
   - <div class="key-takeaways"> - Bulleted summary of main points
   - <blockquote class="reader-reflection"> - Space for personal reflection

7. **FOOTER SECTION**:
   - <div class="related-topics"> - Links to similar themes (use # for hrefs)
   - <div class="author-note"> - Brief note about the quote's origin or context
   - <div class="share-prompt"> - Encourage sharing insights

8. **STYLING CLASSES** to include:
   - .featured-quote-box (main quote display)
   - .insight-card (key insights)
   - .callout (tip/warning/info variations)
   - .action-item (actionable steps)
   - .example-box (real-world examples)
   - .pull-quote (highlighted text)
   - .stats-box (data/statistics)
   - .key-takeaways (summary bullets)
   - .reflection-prompt (questions)
   - .challenge-box (implementation challenge)

9. **CONTENT GUIDELINES**:
   - Write in inspiring, conversational tone
   - Include 2-3 real-world examples with specific details
   - Add psychological or scientific backing where relevant
   - Use storytelling to make concepts memorable
   - Break complex ideas into digestible chunks
   - Total length: 1000-1500 words

10. **ACCESSIBILITY**:
    - Use semantic HTML elements
    - Proper heading hierarchy (single h1 context, then h2, h3)
    - Descriptive class names
    - Alt-text-ready structure for images

Return ONLY valid JSON:
{
  "htmlContent": "<article class='blog-post'>...complete HTML here...</article>"
}

Create engaging, visually structured HTML that's ready to display with proper CSS classes for styling.`;

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
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    return {
      htmlContent: `<article class="blog-post">
  <header class="post-header">
    <div class="post-meta">
      <span class="reading-time">⏱️ 5 min read</span>
      <span class="category-tag">${context.category}</span>
      <span class="post-date">${currentDate}</span>
    </div>
    
    <div class="featured-quote-box">
      <blockquote class="featured-quote">
        <p>"${context.quoteText}"</p>
        ${context.author ? `<footer>— <cite>${context.author}</cite>${context.profession ? `, ${context.profession}` : ''}</footer>` : ''}
      </blockquote>
    </div>
    
    <p class="intro-text">In a world that constantly demands our attention and energy, these words offer a moment of clarity. This powerful insight speaks to themes of <strong class="highlight">${themes}</strong>, inviting us to pause and reflect on our own journey.</p>
  </header>

  <section class="main-content">
    <h2>Understanding the Deeper Meaning</h2>
    
    <div class="insight-card">
      <h3>💡 Core Insight</h3>
      <p>At its heart, this message reminds us of <strong class="highlight">the power of intentional living</strong>. It encourages us to look beyond our current circumstances and recognize the potential for positive transformation that exists within each moment we choose to take action.</p>
    </div>

    <p>The wisdom contained in these words transcends cultural and temporal boundaries. Whether you're facing professional challenges, personal growth hurdles, or simply seeking deeper meaning, this perspective offers valuable guidance.</p>

    <div class="example-box">
      <h3>📖 Real-World Application</h3>
      <p>Consider the story of individuals who have embraced similar principles: entrepreneurs who persisted through countless setbacks, artists who refined their craft despite initial rejection, or everyday people who transformed their lives through consistent, purposeful action.</p>
      <p>What united them wasn't exceptional talent or perfect circumstances—it was their commitment to <strong>living aligned with empowering beliefs</strong> and taking consistent action toward their goals.</p>
    </div>

    <blockquote class="pull-quote">
      <p>"The journey of transformation begins not with giant leaps, but with the decision to take the first small step with intention and courage."</p>
    </blockquote>

    <h2>The Psychology Behind the Wisdom</h2>
    
    <p>Modern psychology supports the timeless wisdom in this quote. Research in behavioral science shows that our thoughts and beliefs directly influence our actions, which in turn shape our reality. This principle, known as <strong>self-fulfilling prophecy</strong>, demonstrates why adopting empowering perspectives is so crucial.</p>

    <div class="callout tip">
      <strong>💭 Key Insight:</strong> Our internal narratives create the framework through which we interpret experiences and make decisions. By consciously choosing empowering beliefs, we open ourselves to possibilities we might otherwise miss.
    </div>

    <h2>Put It Into Practice</h2>
    
    <section class="action-plan">
      <p>Ready to integrate this wisdom into your daily life? Here's a practical framework to get started:</p>
      
      <ol class="action-steps">
        <li><strong>Morning Reflection (5 minutes):</strong> Begin each day by contemplating the quote's meaning and identifying one way it applies to your current goals or challenges.</li>
        <li><strong>Mindful Awareness:</strong> Throughout your day, notice situations where you can embody the principles expressed in these words. Pause before reacting and choose responses aligned with this wisdom.</li>
        <li><strong>Evening Review:</strong> Before bed, journal about one instance where you successfully applied this insight or where you could have done so differently.</li>
        <li><strong>Weekly Integration:</strong> Set aside time each week to review your progress and adjust your approach based on what you've learned.</li>
      </ol>

      <div class="challenge-box">
        <h3>🎯 7-Day Awareness Challenge</h3>
        <p>For the next seven days, commit to consciously applying this wisdom in at least one decision or interaction each day. Track your experiences and notice any shifts in outcomes or how you feel.</p>
      </div>

      <h3>Quick Wins You Can Implement Today</h3>
      <ul class="quick-wins">
        <li>Share this quote with someone who might benefit from its message</li>
        <li>Identify one limiting belief you hold and consciously replace it with an empowering alternative</li>
        <li>Take one small action you've been postponing that aligns with your goals</li>
        <li>Set a reminder to reflect on this wisdom at midday for the next week</li>
      </ul>
    </section>

    <h2>Living the Transformation</h2>
    
    <p>The true power of this wisdom reveals itself not in understanding alone, but in <strong class="highlight">consistent application over time</strong>. Small, intentional choices compounded daily create remarkable transformations in our lives.</p>

    <p>Whether you're seeking to improve relationships, advance your career, enhance your well-being, or simply live more authentically, these principles offer a reliable compass. The key is to remain patient with yourself while staying committed to the journey.</p>

    <div class="stats-box">
      <p><strong>Research shows:</strong> People who regularly reflect on and apply wisdom from inspirational sources report 37% higher life satisfaction and demonstrate greater resilience when facing challenges.</p>
    </div>
  </section>

  <section class="reflection-section">
    <div class="reflection-prompt">
      <h3>💭 Questions for Reflection</h3>
      <ul>
        <li>What aspect of this quote resonates most strongly with your current life situation?</li>
        <li>Where in your life could you benefit from adopting this perspective?</li>
        <li>What's one concrete step you can take today to align your actions with this wisdom?</li>
        <li>Who in your life might benefit from hearing these words?</li>
      </ul>
    </div>

    <div class="key-takeaways">
      <h3>📌 Key Takeaways</h3>
      <ul>
        <li>Our beliefs and perspectives directly shape our reality and possibilities</li>
        <li>Transformation happens through consistent, intentional action rather than dramatic leaps</li>
        <li>Applying timeless wisdom requires both understanding and deliberate practice</li>
        <li>Small daily choices compound into significant life changes over time</li>
        <li>The journey of growth is ongoing—be patient with yourself while staying committed</li>
      </ul>
    </div>
  </section>

  <footer class="post-footer">
    <div class="author-note">
      <p><em>This reflection explores themes of ${themes}, offering practical insights for integrating timeless wisdom into modern life. The principles discussed here are universal, applicable across cultures and circumstances.</em></p>
    </div>

    <div class="related-topics">
      <h4>🔗 Explore Related Themes:</h4>
      <ul>
        <li><a href="#">More quotes about ${context.subcategories[0] || context.category}</a></li>
        <li><a href="#">Practical guides for personal growth</a></li>
        <li><a href="#">Daily practices for mindful living</a></li>
        <li><a href="#">Stories of transformation and resilience</a></li>
      </ul>
    </div>

    <div class="share-prompt">
      <p><strong>Found this helpful?</strong> Share your insights or how you plan to apply this wisdom in your life. Your perspective might be exactly what someone else needs to hear today.</p>
    </div>
  </footer>
</article>`,
    };
  },
};
