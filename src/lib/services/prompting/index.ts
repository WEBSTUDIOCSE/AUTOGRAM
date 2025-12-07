/**
 * Unified Prompting System
 * Central export point for all prompting services
 * All services are generic and module-agnostic
 */

// Core Common Services (Used by ALL modules)
// export { PromptBuilderService } from './prompt-builder.service';
// export type { PhotographySettings } from './prompt-builder.service';

export { PromptRefinerService } from './prompt-refiner.service';

export { DailyContextService } from './daily-context.service';
export type { DailyContext, ContentOpportunity } from './daily-context.service';

export { PromptVariationService } from './prompt-variation.service';
export type { 
  PromptVariationSettings, 
  GeneratedPrompt,
  PromptSubject 
} from './prompt-variation.service';

// Module-Specific Services
// export { Module1PromptService } from './module1-prompt.service';
