import { genAI, getTextModelName } from '@/lib/ai/gemini';

/**
 * Module 6: Video Generator - Enhanced Prompt Refiner Service
 * Generates dynamic, varied, and highly accurate prompts for cinematic AI video generation
 */

// Dynamic refinement strategies for varied outputs
const REFINEMENT_STRATEGIES = [
  {
    name: 'Cinematic Excellence',
    focus: 'professional film quality with dramatic storytelling',
    elements: ['camera movements', 'lighting techniques', 'color grading', 'depth of field', 'composition']
  },
  {
    name: 'Dynamic Action',
    focus: 'energetic motion and dynamic scene progression',
    elements: ['fast-paced action', 'camera tracking', 'motion blur', 'dynamic angles', 'intense atmosphere']
  },
  {
    name: 'Atmospheric Mood',
    focus: 'emotional depth and atmospheric storytelling',
    elements: ['mood lighting', 'ambient motion', 'subtle camera work', 'color palette', 'emotional tone']
  },
  {
    name: 'Documentary Style',
    focus: 'realistic, naturalistic approach with authentic feel',
    elements: ['handheld camera', 'natural lighting', 'authentic movement', 'realistic textures', 'candid moments']
  },
  {
    name: 'Artistic Vision',
    focus: 'creative and visually stunning compositions',
    elements: ['artistic angles', 'creative lighting', 'unique perspectives', 'stylized motion', 'visual poetry']
  }
];

// Comprehensive camera movement vocabulary
const CAMERA_MOVEMENTS = [
  'slow cinematic pan', 'dramatic tilt', 'smooth dolly in', 'tracking shot', 'crane up',
  'steady cam glide', 'handheld movement', 'orbiting camera', 'zoom with focus pull',
  'parallax movement', 'push in slowly', 'pull back reveal', 'follow shot', 'overhead drone',
  'low angle tracking', 'high angle establishing', 'whip pan transition', 'slow motion push',
  'dynamic tracking', 'floating camera', '360-degree rotation', 'dutch angle tilt'
];

// Lighting and atmosphere vocabulary
const LIGHTING_STYLES = [
  'golden hour sunlight', 'dramatic chiaroscuro', 'soft diffused light', 'neon cyberpunk glow',
  'moody shadows', 'vibrant natural light', 'cinematic rim lighting', 'ambient glow',
  'dramatic spotlight', 'soft box lighting', 'practical light sources', 'backlit silhouette',
  'warm candlelight', 'cool moonlight', 'harsh midday sun', 'overcast soft light',
  'colored gels', 'volumetric light rays', 'lens flare effects', 'low key dramatic'
];

// Atmosphere and mood vocabulary
const ATMOSPHERE_ELEMENTS = [
  'tense anticipation', 'peaceful serenity', 'mysterious intrigue', 'joyful celebration',
  'melancholic longing', 'epic grandeur', 'intimate closeness', 'chaotic energy',
  'dreamlike surrealism', 'gritty realism', 'elegant sophistication', 'raw emotion',
  'nostalgic warmth', 'futuristic wonder', 'ancient mystique', 'urban energy',
  'natural tranquility', 'dramatic intensity', 'playful whimsy', 'haunting beauty'
];

// Motion and action vocabulary
const MOTION_DESCRIPTIONS = [
  'fluid natural movement', 'dynamic action sequence', 'subtle breathing motion',
  'dramatic sudden movement', 'graceful flowing motion', 'energetic burst of action',
  'slow deliberate movement', 'rapid quick cuts', 'smooth continuous motion',
  'staccato rhythmic movement', 'gentle swaying', 'powerful impactful motion',
  'complex layered movement', 'simple elegant motion', 'chaotic unpredictable movement',
  'controlled precise movement', 'organic natural motion', 'stylized artistic motion',
  'realistic authentic movement', 'exaggerated expressive motion'
];

// Visual quality and style vocabulary
const VISUAL_QUALITIES = [
  'photorealistic 8K quality', 'cinematic film grain', 'hyper-detailed textures',
  'perfect composition', 'depth-rich imagery', 'vibrant color grading',
  'soft bokeh background', 'sharp focus details', 'atmospheric haze',
  'professional color correction', 'dynamic range optimized', 'film-like motion blur',
  'natural skin tones', 'rich contrast', 'balanced exposure', 'artistic color palette',
  'HDR quality', 'anamorphic lens look', 'clean modern aesthetic', 'vintage film look'
];

// Scene setting vocabulary
const SCENE_ELEMENTS = [
  'establishing wide shot', 'intimate close-up', 'medium two-shot', 'detailed extreme close-up',
  'environmental context', 'background action', 'foreground elements', 'depth layers',
  'dynamic perspective', 'changing angles', 'scene transitions', 'temporal progression',
  'spatial relationship', 'subject isolation', 'environmental storytelling', 'visual narrative'
];

/**
 * Select a random refinement strategy for variety
 */
function selectRefinementStrategy(): typeof REFINEMENT_STRATEGIES[0] {
  return REFINEMENT_STRATEGIES[Math.floor(Math.random() * REFINEMENT_STRATEGIES.length)];
}

/**
 * Select random elements from arrays for dynamic content
 */
function selectRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Generate dynamic enhancement instructions based on strategy
 */
function generateEnhancementInstructions(strategy: typeof REFINEMENT_STRATEGIES[0]): string {
  const cameraMovement = selectRandomElements(CAMERA_MOVEMENTS, 2).join(', ');
  const lighting = selectRandomElements(LIGHTING_STYLES, 2).join(', ');
  const atmosphere = selectRandomElements(ATMOSPHERE_ELEMENTS, 2).join(', ');
  const motion = selectRandomElements(MOTION_DESCRIPTIONS, 2).join(', ');
  const visualQuality = selectRandomElements(VISUAL_QUALITIES, 2).join(', ');
  const sceneElement = selectRandomElements(SCENE_ELEMENTS, 2).join(', ');

  return `
Enhancement Strategy: ${strategy.name}
Focus: ${strategy.focus}

REQUIRED ELEMENTS TO INCORPORATE:

1. CAMERA MOVEMENTS (select from):
   - ${cameraMovement}

2. LIGHTING & ATMOSPHERE (select from):
   - ${lighting}
   - ${atmosphere}

3. MOTION & ACTION (select from):
   - ${motion}

4. VISUAL QUALITY (select from):
   - ${visualQuality}

5. SCENE COMPOSITION (select from):
   - ${sceneElement}

PROMPT ENHANCEMENT GUIDELINES:
- Analyze the original prompt's core subject and intent
- Integrate 3-5 of the suggested elements above naturally
- Create a cohesive, cinematic description that flows well
- Use professional filmmaking terminology
- Ensure the enhanced prompt maintains the original meaning while adding cinematic depth
- Make each refinement unique and contextually appropriate
- Avoid repetitive patterns - vary the structure and vocabulary each time
- Focus on creating vivid, actionable descriptions for AI video generation
- Consider the temporal aspect - how the scene evolves over time
- Include both visual and atmospheric elements for richer output`;
}

export const Module6PromptRefiner = {
  /**
   * Refine a video generation prompt with dynamic, varied enhancements
   * Generates unique, high-quality prompts each time for better video output
   */
  async refineVideoPrompt(videoPrompt: string): Promise<string> {
    try {
      const modelName = getTextModelName();
      const strategy = selectRefinementStrategy();
      const enhancementInstructions = generateEnhancementInstructions(strategy);

      const refinementPrompt = `You are an expert AI video prompt engineer specializing in cinematic text-to-video generation.

ORIGINAL PROMPT: "${videoPrompt}"

${enhancementInstructions}

CRITICAL REQUIREMENTS:
1. Output ONLY the refined prompt - no explanations, no labels, no quotes
2. The refined prompt must be descriptive, cinematic, and action-oriented
3. Include specific camera movements, lighting, and atmosphere
4. Describe how the scene progresses and evolves over time
5. Use vivid, sensory language that guides AI video generation
6. Length should be sufficient to convey all details (typically 200-500 characters)
7. Every refinement should be unique and different from previous ones
8. Avoid generic phrases - be specific and creative
9. Ensure the prompt is optimized for AI video generation models
10. Make it compelling and visually rich

Generate the refined video prompt now:`;

      console.log('🎬 [Module 6] Refining video prompt with strategy:', strategy.name);

      const response = await genAI.models.generateContent({
        model: modelName,
        contents: refinementPrompt,
      });

      let refinedPrompt = '';
      
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.text) {
            refinedPrompt = part.text.trim();
            break;
          }
        }
      }

      if (!refinedPrompt) {
        console.warn('No refined prompt received, using original');
        return videoPrompt;
      }

      // Clean up the response - remove any labels, quotes, or extra text
      refinedPrompt = refinedPrompt
        .replace(/^(Refined prompt:|Enhanced prompt:|Video prompt:|Prompt:|Output:|Here is the refined prompt:|The refined prompt is:)/gi, '')
        .replace(/^(Here is|This is|The refined|Enhanced|Refined)\s+(prompt|output|video prompt):?\s*/gi, '')
        .replace(/^["']|["']$/g, '')
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Ensure prompt is not too short or too long
      const MIN_LENGTH = 50;
      const MAX_LENGTH = 600;
      
      if (refinedPrompt.length < MIN_LENGTH) {
        console.warn('Refined prompt too short, using original');
        return videoPrompt;
      }

      if (refinedPrompt.length > MAX_LENGTH) {
        refinedPrompt = refinedPrompt.substring(0, MAX_LENGTH).trim();
        const lastSpace = refinedPrompt.lastIndexOf(' ');
        if (lastSpace > MAX_LENGTH * 0.8) {
          refinedPrompt = refinedPrompt.substring(0, lastSpace).trim();
        }
      }

      console.log('✅ [Module 6] Refined with strategy:', strategy.name, '| Length:', refinedPrompt.length, 'chars');
      return refinedPrompt;

    } catch (error) {
      console.error('❌ [Module 6] Refinement error:', error);
      return videoPrompt;
    }
  },

  /**
   * Get available refinement strategies for debugging or UI display
   */
  getAvailableStrategies(): string[] {
    return REFINEMENT_STRATEGIES.map(s => s.name);
  },

  /**
   * Get current refinement strategy (for testing)
   */
  getCurrentStrategy(): typeof REFINEMENT_STRATEGIES[0] {
    return selectRefinementStrategy();
  }
};
