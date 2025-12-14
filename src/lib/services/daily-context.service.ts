/**
 * Shared Daily Context Service
 * Provides time-of-day, season, and mood context for prompt generation
 */

export type DailyContext = {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  season: 'spring' | 'summer' | 'fall' | 'winter';
  dayOfWeek: string;
  mood: string;
  suggestions: string[];
};

export class DailyContextService {
  /**
   * Get current time of day
   */
  static getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Get current season
   */
  static getSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
    const month = new Date().getMonth();
    
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  /**
   * Get day of week
   */
  static getDayOfWeek(): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }

  /**
   * Get contextual mood/atmosphere
   * Returns empty string - AI generates mood dynamically
   */
  static getMood(): string {
    // No hardcoded moods - return empty for AI to generate dynamically
    return '';
  }

  /**
   * Get contextual suggestions
   * Returns empty array - AI generates suggestions dynamically
   */
  static getSuggestions(): string[] {
    // No hardcoded suggestions - AI generates contextual suggestions dynamically
    return [];
  }

  /**
   * Get complete daily context
   */
  static getContext(): DailyContext {
    return {
      timeOfDay: this.getTimeOfDay(),
      season: this.getSeason(),
      dayOfWeek: this.getDayOfWeek(),
      mood: this.getMood(),
      suggestions: this.getSuggestions(),
    };
  }

  /**
   * Format context as a string for prompt enhancement
   */
  static formatContextString(): string {
    const context = this.getContext();
    return `${context.timeOfDay}, ${context.season}, ${context.mood} atmosphere`;
  }
}
