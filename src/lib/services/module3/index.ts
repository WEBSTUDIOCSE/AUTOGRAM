/**
 * Module 3: Auto-Poster Services
 * Centralized exports for all auto-poster related services
 */

// Core Auto-Posting Services
export { AutoPostSchedulerService } from './auto-post-scheduler.service';
export { AutoPostConfigService } from './auto-post-config.service';
export { AutoPostLogService, type AutoPostLog } from './auto-post-log.service';

// Content Generation Services
export { DailyContextService, type DailyContext, type ContentOpportunity } from './daily-context.service';
export { PromptVariationService, type PromptVariationSettings, type GeneratedPrompt } from './prompt-variation.service';

// History & Tracking Services
export { InstagramPostService, type InstagramPost } from './post-history.service';
