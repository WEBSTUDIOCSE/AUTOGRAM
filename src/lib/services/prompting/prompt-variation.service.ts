import { genAI, getTextModelName } from '@/lib/ai/gemini';
import { DailyContextService, type DailyContext, type ContentOpportunity } from './daily-context.service';

/**
 * Subject for prompt generation (generic interface)
 */
export interface PromptSubject {
  name: string;
  description?: string;
  visualStyle?: string;
  [key: string]: unknown; // Allow additional properties
}

/**
 * Prompt Variation Settings
 */
export interface PromptVariationSettings {
  enabled: boolean;
  tone: 'casual' | 'professional' | 'fun' | 'elegant';
  allowTrending?: boolean;
  avoidTopics?: string[];
  includeLocationContext?: boolean;
  trackHistory?: boolean;
  avoidRepetitionDays?: number;
  creativityLevel?: 'low' | 'medium' | 'high';
}

/**
 * Generated Prompt with Context
 */
export interface GeneratedPrompt {
  prompt: string;
  opportunity: ContentOpportunity;
  contextUsed: string;
  originalBasePrompt: string;
  contextApplied: string[];
  tone: string;
  timeContext: string;
}

/**
 * Service for generating prompt variations using Gemini AI
 * Generic service usable by any module
 */
export class PromptVariationService {
  /**
   * Generate a context-aware prompt (Dynamic & Generic)
   */
  static async generateContextualPrompt(
    subject: PromptSubject,
    basePrompt: string,
    settings: PromptVariationSettings,
    recentThemes: string[] = []
  ): Promise<GeneratedPrompt> {
    try {
      // If variations disabled, return original prompt
      if (!settings.enabled) {
        return {
          prompt: basePrompt,
          opportunity: {
            id: 'disabled',
            title: 'Original Prompt',
            description: 'Variations disabled',
            tags: [],
            relevanceScore: 0
          },
          contextUsed: 'Original base prompt (variations disabled)',
          originalBasePrompt: basePrompt,
          contextApplied: [],
          tone: settings.tone,
          timeContext: 'none'
        };
      }

      // Get today's dynamic context with opportunities
      const dailyContext = await DailyContextService.getTodaysContext();
      
      // Filter opportunities based on settings
      let availableOpportunities = dailyContext.contentOpportunities;

      // Filter out trending if not allowed
      if (settings.allowTrending === false) {
        availableOpportunities = availableOpportunities.filter(opp => !opp.isViral);
      }

      // If no opportunities left, use defaults
      if (availableOpportunities.length === 0) {
        availableOpportunities = DailyContextService.getDefaultOpportunities();
      }

      // Select opportunity (weighted by relevance score)
      const selectedOpportunity = this.selectOpportunityWeighted(availableOpportunities);

      // Generate prompt using the opportunity
      const generatedPrompt = await this.generatePromptFromOpportunity(
        subject,
        basePrompt,
        selectedOpportunity,
        dailyContext,
        settings,
        recentThemes
      );

      return generatedPrompt;
    } catch (error) {
      console.error('Error generating contextual prompt:', error);
      return {
        prompt: basePrompt,
        opportunity: {
          id: 'error',
          title: 'Error Fallback',
          description: 'Error occurred',
          tags: [],
          relevanceScore: 0
        },
        contextUsed: 'Error occurred, using base prompt',
        originalBasePrompt: basePrompt,
        contextApplied: [],
        tone: settings.tone,
        timeContext: 'error'
      };
    }
  }

  /**
   * Select opportunity using weighted random selection
   */
  private static selectOpportunityWeighted(opportunities: ContentOpportunity[]): ContentOpportunity {
    const totalWeight = opportunities.reduce((sum, opp) => sum + opp.relevanceScore, 0);
    let random = Math.random() * totalWeight;
    
    for (const opportunity of opportunities) {
      random -= opportunity.relevanceScore;
      if (random <= 0) {
        return opportunity;
      }
    }
    
    return opportunities[opportunities.length - 1];
  }

  /**
   * Generate prompt from a selected opportunity
   */
  private static async generatePromptFromOpportunity(
    subject: PromptSubject,
    basePrompt: string,
    opportunity: ContentOpportunity,
    context: DailyContext,
    settings: PromptVariationSettings,
    recentThemes: string[]
  ): Promise<GeneratedPrompt> {
    const modelName = getTextModelName();

    const avoidText = settings.avoidTopics && settings.avoidTopics.length > 0
      ? `\nAVOID these topics: ${settings.avoidTopics.join(', ')}`
      : '';

    const recentThemesText = recentThemes.length > 0
      ? `\nRECENTLY USED THEMES (avoid these): ${recentThemes.join(', ')}`
      : '';

    const locationText = settings.includeLocationContext && context.locationContext
      ? `\nLocation Context: ${context.locationContext}`
      : '';

    const creativityGuidance = {
      low: 'Stay close to the original style, make subtle variations only',
      medium: 'Balance familiarity with creativity, moderate variations',
      high: 'Be very creative and unexpected, push boundaries while staying tasteful'
    };

    const creativityLevel = settings.creativityLevel || 'medium';
    const subjectDesc = subject.description || subject.name;
    const visualStyle = subject.visualStyle || basePrompt;

    const prompt = `You are creating a UNIQUE, NON-REPETITIVE image generation prompt that will generate PHOTOREALISTIC images.

SUBJECT: "${subjectDesc}"
BASE VISUAL STYLE: ${visualStyle}

TODAY'S CONTENT OPPORTUNITY:
Title: ${opportunity.title}
Description: ${opportunity.description}
Tags: ${opportunity.tags.join(', ')}
${opportunity.isViral ? '⚡ TRENDING/VIRAL TOPIC' : ''}

CONTEXT: ${context.summary}${locationText}${avoidText}${recentThemesText}

TONE: ${settings.tone}
CREATIVITY LEVEL: ${creativityGuidance[creativityLevel]}

Task: Create a NEW, SPECIFIC image generation prompt that:
1. Maintains the subject's visual style from base prompt
2. Incorporates the opportunity "${opportunity.title}" naturally and creatively
3. Matches the ${settings.tone} tone
4. Is SPECIFIC and DESCRIPTIVE for AI image generation
5. Feels FRESH and UNIQUE - not generic or repetitive
6. Uses concrete visual elements (lighting, setting, mood, composition)

PHOTOREALISM REQUIREMENTS (CRITICAL):
- ALWAYS include: "photorealistic, natural lighting, authentic appearance"
- Specify camera details: "shot on professional camera, natural depth of field"
- Emphasize realism: "genuine expression, realistic textures, natural shadows"
- Avoid: artificial, cartoon-like, overly edited, fake-looking elements

LOCATION & SETTING DIVERSITY:
- Use DIVERSE settings: urban cafes, cultural sites, natural environments, modern interiors, traditional spaces, outdoor markets, home settings
- Be SPECIFIC with locations (not just "cafe" but "minimalist rooftop cafe overlooking city" or "vintage bookshop with warm lighting")
- Avoid overused clichés and generic descriptions
- Include realistic setting details

IMPORTANT:
- Keep subject's core visual characteristics
- Be SPECIFIC (not "nice outfit" but "tailored navy blazer with white shirt, golden hour lighting through window")
- Make it visually rich, detailed, and PHOTOREALISTIC
- Avoid clichés and generic phrases
- Include realistic lighting description (golden hour, soft window light, evening glow, diffused natural light)
- Output ONLY the prompt, no explanations or meta-text

Generate the photorealistic prompt now:`;

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
      return {
        prompt: basePrompt,
        opportunity,
        contextUsed: 'Generation failed, using base prompt',
        originalBasePrompt: basePrompt,
        contextApplied: [],
        tone: settings.tone,
        timeContext: 'failed'
      };
    }

    return {
      prompt: generatedText,
      opportunity,
      contextUsed: `Opportunity: ${opportunity.title} | ${context.summary}`,
      originalBasePrompt: basePrompt,
      contextApplied: [opportunity.title, settings.tone, context.season],
      tone: settings.tone,
      timeContext: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'
    };
  }

  /**
   * Get default variation settings
   */
  static getDefaultSettings(): PromptVariationSettings {
    return {
      enabled: true,
      tone: 'casual',
      allowTrending: true,
      avoidTopics: [],
      includeLocationContext: true,
      trackHistory: true,
      avoidRepetitionDays: 14,
      creativityLevel: 'medium'
    };
  }
}
