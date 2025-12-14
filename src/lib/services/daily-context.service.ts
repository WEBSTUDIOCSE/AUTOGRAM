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
   */
  static getMood(): string {
    const timeOfDay = this.getTimeOfDay();
    const season = this.getSeason();
    
    const moods: Record<string, string[]> = {
      morning: ['fresh', 'energetic', 'peaceful', 'bright'],
      afternoon: ['vibrant', 'lively', 'warm', 'active'],
      evening: ['calm', 'golden', 'serene', 'relaxed'],
      night: ['cozy', 'intimate', 'quiet', 'mysterious'],
    };

    const seasonalMoods: Record<string, string[]> = {
      spring: ['blooming', 'renewal', 'fresh'],
      summer: ['sunny', 'bright', 'warm'],
      fall: ['cozy', 'warm-toned', 'harvest'],
      winter: ['crisp', 'cool', 'serene'],
    };

    const timeMoods = moods[timeOfDay] || [];
    const seasonMoods = seasonalMoods[season] || [];
    
    const combined = [...timeMoods, ...seasonMoods];
    return combined[Math.floor(Math.random() * combined.length)];
  }

  /**
   * Get contextual suggestions
   */
  static getSuggestions(): string[] {
    const timeOfDay = this.getTimeOfDay();
    const season = this.getSeason();
    
    const suggestions: Record<string, string[]> = {
      morning: ['sunrise lighting', 'soft morning glow', 'breakfast scene', 'early morning activities'],
      afternoon: ['bright daylight', 'outdoor activities', 'vibrant colors', 'midday sun'],
      evening: ['golden hour', 'sunset backdrop', 'warm evening light', 'relaxing activities'],
      night: ['city lights', 'indoor cozy setting', 'nighttime ambiance', 'starry sky'],
    };

    const seasonalSuggestions: Record<string, string[]> = {
      spring: ['blooming flowers', 'fresh greenery', 'spring colors', 'outdoor nature'],
      summer: ['beach vibes', 'tropical setting', 'bright sunshine', 'vacation mood'],
      fall: ['autumn leaves', 'warm colors', 'cozy atmosphere', 'harvest theme'],
      winter: ['snow scene', 'winter clothing', 'holiday vibes', 'indoor warmth'],
    };

    return [
      ...(suggestions[timeOfDay] || []),
      ...(seasonalSuggestions[season] || []),
    ].slice(0, 4);
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
