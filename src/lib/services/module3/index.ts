/**
 * Module 3: Auto-Poster Services
 * Centralized exports for all auto-poster related services
 */

// Core Auto-Posting Services
export { AutoPostSchedulerService } from './auto-post-scheduler.service';
export { AutoPostConfigService } from './auto-post-config.service';
export { AutoPostLogService, type AutoPostLog } from './auto-post-log.service';

// Content Generation Services
// Note: DailyContextService moved to shared services/daily-context.service.ts
export { Module3PromptRefiner } from './prompt-refiner.service';
export { Module3PromptGenerator } from './prompt-generator.service';

// History & Tracking Services
export { InstagramPostService, type InstagramPost } from './post-history.service';
