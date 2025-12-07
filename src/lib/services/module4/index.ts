/**
 * Module 4: Family Auto-Poster Services
 * Centralized exports for all family auto-poster related services
 */

// Core Family Services
export { FamilyProfileService } from './family-profile.service';
export { FamilyPromptService } from './family-prompt.service';
export { FamilyScheduleService } from './family-schedule.service';
export { FamilyLogService } from './family-log.service';
export { FamilyAutoPostScheduler } from './family-auto-post-scheduler.service';

// Re-export types
export type {
  FamilyProfile,
  FamilyMember,
  FamilyPromptTemplate,
  FamilyPromptCategory,
  FamilyAutoPostSchedule,
  FamilyAutoPostLog,
} from '@/lib/firebase/config/types';
