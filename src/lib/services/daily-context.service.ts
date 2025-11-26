import { genAI, getTextModelName } from '@/lib/ai/gemini';
import { getGeminiConfig } from '@/lib/firebase/config/environments';
import { db } from '@/lib/firebase/firebase';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Daily Context Interface
 * Contains information about what's special/relevant today
 */
export interface DailyContext {
  date: string; // YYYY-MM-DD
  festivals: string[]; // Hindu festivals, global holidays, celebrations
  specialEvents: string[]; // National days, observances, commemorations
  season: string; // Current season
  seasonalThemes: string[]; // Seasonal activities (monsoon, summer vacation, etc.)
  trendingTopics: string[]; // Current trends, viral topics (optional)
  locationContext?: string; // India-specific context
  generatedAt: string; // ISO timestamp
}

/**
 * Daily Context Service
 * Fetches and caches daily context information using Gemini AI
 */
export const DailyContextService = {
  /**
   * Get today's context (with caching)
   * @returns Daily context information
   */
  getTodaysContext: async (): Promise<DailyContext> => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Try to get cached context from Firestore
    const cached = await DailyContextService.getCachedContext(today);
    if (cached) {
      console.log('✅ Using cached daily context for:', today);
      return cached;
    }
    
    // Generate new context using Gemini
    console.log('🔄 Generating new daily context for:', today);
    const context = await DailyContextService.generateContext(today);
    
    // Cache for future use
    await DailyContextService.cacheContext(context);
    
    return context;
  },

  /**
   * Get cached context from Firestore
   * @param date - Date string (YYYY-MM-DD)
   * @returns Cached context or null
   */
  getCachedContext: async (date: string): Promise<DailyContext | null> => {
    try {
      const docRef = doc(db, 'daily_context', date);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as DailyContext;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get cached context:', error);
      return null;
    }
  },

  /**
   * Cache context to Firestore
   * @param context - Daily context to cache
   */
  cacheContext: async (context: DailyContext): Promise<void> => {
    try {
      const docRef = doc(db, 'daily_context', context.date);
      await setDoc(docRef, context);
      console.log('✅ Cached daily context for:', context.date);
    } catch (error) {
      console.error('Failed to cache context:', error);
    }
  },

  /**
   * Generate context using Gemini AI
   * @param date - Date string (YYYY-MM-DD)
   * @returns Generated context
   */
  generateContext: async (date: string): Promise<DailyContext> => {
    const modelName = getTextModelName();

    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const prompt = `Today is ${formattedDate} in India. Analyze what's special about today and provide context for social media content creation.

Consider:
1. Hindu festivals and religious celebrations
2. National holidays and observances in India
3. International days and global events
4. Current season and seasonal themes (monsoon, summer, winter, festival season)
5. Popular cultural activities for this time (travel, celebrations, family gatherings)
6. Any trending topics or viral themes (keep it general, no specific current events)

Respond in JSON format ONLY (no markdown, no code blocks):
{
  "festivals": ["Diwali", "Holi", etc.],
  "specialEvents": ["Independence Day", "Environment Day", etc.],
  "season": "Summer/Monsoon/Winter/Spring/Autumn",
  "seasonalThemes": ["beach visits", "hill stations", "rain photography", etc.],
  "trendingTopics": ["travel vlog", "festival preparation", "daily lifestyle", etc.],
  "locationContext": "Brief description of what's happening in India today"
}

If today has no special festivals or events, return empty arrays but still include season and general themes.`;

    try {
      const result = await genAI.models.generateContent({
        model: modelName,
        contents: prompt,
      });
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Parse the JSON response
      let parsedResponse;
      try {
        // Remove markdown code blocks if present
        const cleanResponse = responseText
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        parsedResponse = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', responseText);
        // Return default context if parsing fails
        parsedResponse = {
          festivals: [],
          specialEvents: [],
          season: 'General',
          seasonalThemes: ['daily life', 'lifestyle', 'casual'],
          trendingTopics: ['lifestyle vlog', 'daily moments'],
          locationContext: 'Regular day'
        };
      }

      const context: DailyContext = {
        date,
        festivals: parsedResponse.festivals || [],
        specialEvents: parsedResponse.specialEvents || [],
        season: parsedResponse.season || 'General',
        seasonalThemes: parsedResponse.seasonalThemes || [],
        trendingTopics: parsedResponse.trendingTopics || [],
        locationContext: parsedResponse.locationContext,
        generatedAt: new Date().toISOString()
      };

      console.log('✅ Generated daily context:', context);
      return context;
    } catch (error) {
      console.error('Failed to generate context with Gemini:', error);
      
      // Return default context on error
      return {
        date,
        festivals: [],
        specialEvents: [],
        season: 'General',
        seasonalThemes: ['daily life', 'lifestyle'],
        trendingTopics: ['lifestyle content'],
        generatedAt: new Date().toISOString()
      };
    }
  },

  /**
   * Get context summary text
   * @param context - Daily context
   * @returns Human-readable summary
   */
  getContextSummary: (context: DailyContext): string => {
    const parts: string[] = [];
    
    if (context.festivals.length > 0) {
      parts.push(`Festivals: ${context.festivals.join(', ')}`);
    }
    
    if (context.specialEvents.length > 0) {
      parts.push(`Events: ${context.specialEvents.join(', ')}`);
    }
    
    parts.push(`Season: ${context.season}`);
    
    if (context.seasonalThemes.length > 0) {
      parts.push(`Themes: ${context.seasonalThemes.slice(0, 3).join(', ')}`);
    }
    
    return parts.join(' | ');
  }
};
