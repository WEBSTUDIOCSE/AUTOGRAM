import { genAI, getTextModelName } from '@/lib/ai/gemini';

/**
 * Module 7: Image-to-Video Generator - Enhanced Prompt Refiner Service
 * Generates dynamic, varied, and highly accurate motion prompts for image-to-video animation
 */

// Dynamic motion strategies for varied outputs
const MOTION_STRATEGIES = [
  {
    name: 'Natural Realism',
    focus: 'subtle, realistic motion that feels natural and authentic',
    elements: ['gentle breathing', 'subtle swaying', 'natural eye movement', 'soft fabric flow', 'ambient motion']
  },
  {
    name: 'Dynamic Energy',
    focus: 'energetic, expressive motion with dynamic action',
    elements: ['energetic movement', 'dynamic action', 'expressive gestures', 'vibrant motion', 'active engagement']
  },
  {
    name: 'Elegant Flow',
    focus: 'graceful, smooth motion with artistic fluidity',
    elements: ['graceful flowing', 'smooth transitions', 'elegant movement', 'fluid motion', 'harmonious action']
  },
  {
    name: 'Cinematic Drama',
    focus: 'dramatic, impactful motion with emotional depth',
    elements: ['dramatic movement', 'emotional expression', 'powerful action', 'intense motion', 'impactful gestures']
  },
  {
    name: 'Playful Animation',
    focus: 'fun, lively motion with character and personality',
    elements: ['playful bouncing', 'lively movement', 'charming action', 'bouncy motion', 'expressive animation']
  }
];

// Natural motion vocabulary
const NATURAL_MOTIONS = [
  'gentle breathing motion', 'subtle swaying', 'natural eye blinking', 'soft hair movement',
  'fabric flowing naturally', 'gentle head tilt', 'subtle body shift', 'natural hand gestures',
  'relaxed posture adjustment', 'soft facial expressions', 'natural eye movement', 'gentle lip movement',
  'subtle muscle movement', 'natural weight shift', 'soft arm movement', 'gentle body sway',
  'natural breathing rhythm', 'subtle shoulder movement', 'gentle foot adjustment', 'natural finger movement'
];

// Dynamic action vocabulary
const DYNAMIC_ACTIONS = [
  'energetic arm swing', 'dynamic body movement', 'expressive hand gesture', 'vibrant dance motion',
  'active walking', 'energetic jumping', 'dynamic running', 'expressive facial expression',
  'powerful arm movement', 'dramatic body turn', 'energetic spinning', 'dynamic leap',
  'expressive pose change', 'vibrant gesture', 'active interaction', 'dynamic reach',
  'energetic bounce', 'dynamic stretch', 'expressive turn', 'vibrant movement'
];

// Camera movement vocabulary for image-to-video
const CAMERA_MOTIONS = [
  'subtle slow zoom in', 'gentle camera pan', 'smooth dolly movement', 'slight camera tilt',
  'parallax background movement', 'subtle camera drift', 'gentle push in', 'slow pull back',
  'slight camera shake', 'smooth tracking', 'subtle rotation', 'gentle floating',
  'slight camera bob', 'smooth crane movement', 'subtle orbit', 'gentle follow'
];

// Environmental motion vocabulary
const ENVIRONMENTAL_MOTIONS = [
  'gentle wind blowing', 'soft light rays moving', 'subtle water ripples', 'gentle leaves rustling',
  'soft clouds drifting', 'subtle dust particles', 'gentle flame flicker', 'soft shadows shifting',
  'subtle reflection movement', 'gentle smoke rising', 'soft light changes', 'subtle grass swaying',
  'gentle water flow', 'subtle bird movement', 'soft flower petals falling', 'gentle steam rising'
];

// Animation style vocabulary
const ANIMATION_STYLES = [
  'smooth natural animation', 'fluid motion', 'subtle easing', 'organic movement',
  'realistic physics', 'natural timing', 'smooth transitions', 'authentic motion',
  'lifelike animation', 'natural flow', 'subtle dynamics', 'organic feel',
  'realistic weight', 'natural rhythm', 'smooth interpolation', 'authentic behavior'
];

// Transition vocabulary
const TRANSITION_TYPES = [
  'smooth fade in', 'gentle dissolve', 'soft crossfade', 'smooth transition',
  'natural flow', 'seamless blend', 'gentle morph', 'smooth progression',
  'organic transition', 'soft change', 'natural evolution', 'smooth shift'
];

// Quality and detail vocabulary
const MOTION_QUALITIES = [
  'highly detailed motion', 'smooth 60fps animation', 'natural timing', 'realistic physics',
  'subtle micro-movements', 'organic flow', 'authentic behavior', 'lifelike quality',
  'smooth interpolation', 'natural weight', 'dynamic range', 'rich detail',
  'precise motion', 'fluid animation', 'natural ease', 'professional quality'
];

// Subject-specific motion vocabulary
const SUBJECT_MOTIONS = {
  person: [
    'natural facial expressions', 'subtle eye movement', 'gentle breathing', 'natural head movement',
    'expressive gestures', 'natural body language', 'subtle muscle movement', 'authentic posture'
  ],
  animal: [
    'natural animal movement', 'authentic behavior', 'subtle breathing', 'natural head motion',
    'expressive animal gestures', 'natural body language', 'subtle tail movement', 'authentic posture'
  ],
  object: [
    'natural object movement', 'subtle floating', 'gentle rotation', 'natural swaying',
    'smooth sliding', 'gentle bouncing', 'subtle vibration', 'natural settling'
  ],
  nature: [
    'natural wind movement', 'gentle water flow', 'subtle plant movement', 'natural light changes',
    'smooth cloud motion', 'gentle particle movement', 'subtle seasonal changes', 'natural rhythm'
  ],
  abstract: [
    'fluid abstract motion', 'smooth color transitions', 'gentle shape morphing', 'subtle pattern movement',
    'organic flow', 'smooth transformation', 'gentle particle motion', 'natural evolution'
  ]
};

/**
 * Select a random motion strategy for variety
 */
function selectMotionStrategy(): typeof MOTION_STRATEGIES[0] {
  return MOTION_STRATEGIES[Math.floor(Math.random() * MOTION_STRATEGIES.length)];
}

/**
 * Select random elements from arrays for dynamic content
 */
function selectRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Detect subject type from prompt
 */
function detectSubjectType(prompt: string): keyof typeof SUBJECT_MOTIONS | 'general' {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('person') || lowerPrompt.includes('human') || lowerPrompt.includes('man') || 
      lowerPrompt.includes('woman') || lowerPrompt.includes('girl') || lowerPrompt.includes('boy') ||
      lowerPrompt.includes('face') || lowerPrompt.includes('portrait') || lowerPrompt.includes('people')) {
    return 'person';
  }
  
  if (lowerPrompt.includes('animal') || lowerPrompt.includes('dog') || lowerPrompt.includes('cat') ||
      lowerPrompt.includes('bird') || lowerPrompt.includes('horse') || lowerPrompt.includes('pet')) {
    return 'animal';
  }
  
  if (lowerPrompt.includes('nature') || lowerPrompt.includes('tree') || lowerPrompt.includes('flower') ||
      lowerPrompt.includes('water') || lowerPrompt.includes('mountain') || lowerPrompt.includes('sky') ||
      lowerPrompt.includes('forest') || lowerPrompt.includes('landscape') || lowerPrompt.includes('sunset')) {
    return 'nature';
  }
  
  if (lowerPrompt.includes('abstract') || lowerPrompt.includes('pattern') || lowerPrompt.includes('geometric') ||
      lowerPrompt.includes('design') || lowerPrompt.includes('artistic') || lowerPrompt.includes('creative')) {
    return 'abstract';
  }
  
  if (lowerPrompt.includes('object') || lowerPrompt.includes('thing') || lowerPrompt.includes('item') ||
      lowerPrompt.includes('product') || lowerPrompt.includes('car') || lowerPrompt.includes('building')) {
    return 'object';
  }
  
  return 'general';
}

/**
 * Generate dynamic enhancement instructions based on strategy
 */
function generateMotionEnhancementInstructions(
  strategy: typeof MOTION_STRATEGIES[0],
  subjectType: keyof typeof SUBJECT_MOTIONS | 'general'
): string {
  const naturalMotion = selectRandomElements(NATURAL_MOTIONS, 3).join(', ');
  const cameraMotion = selectRandomElements(CAMERA_MOTIONS, 2).join(', ');
  const environmentalMotion = selectRandomElements(ENVIRONMENTAL_MOTIONS, 2).join(', ');
  const animationStyle = selectRandomElements(ANIMATION_STYLES, 2).join(', ');
  const motionQuality = selectRandomElements(MOTION_QUALITIES, 2).join(', ');
  const transition = selectRandomElements(TRANSITION_TYPES, 2).join(', ');
  
  let subjectSpecificMotion = '';
  if (subjectType !== 'general') {
    subjectSpecificMotion = selectRandomElements(SUBJECT_MOTIONS[subjectType], 3).join(', ');
  }

  return `
Motion Enhancement Strategy: ${strategy.name}
Focus: ${strategy.focus}
Detected Subject Type: ${subjectType}

REQUIRED ELEMENTS TO INCORPORATE:

1. NATURAL MOTION (select from):
   - ${naturalMotion}

2. CAMERA MOVEMENT (select from):
   - ${cameraMotion}

3. ENVIRONMENTAL MOTION (select from):
   - ${environmentalMotion}

4. ANIMATION STYLE (select from):
   - ${animationStyle}

5. MOTION QUALITY (select from):
   - ${motionQuality}

6. TRANSITIONS (select from):
   - ${transition}

${subjectSpecificMotion ? `
7. SUBJECT-SPECIFIC MOTION (${subjectType}):
   - ${subjectSpecificMotion}
` : ''}

PROMPT ENHANCEMENT GUIDELINES:
- Analyze the original prompt's subject and context
- Integrate 4-6 of the suggested elements naturally
- Focus on how the still image should come to life
- Describe motion that enhances the image's narrative
- Use specific, descriptive motion terminology
- Ensure the motion feels natural and contextually appropriate
- Consider both primary subject motion and environmental motion
- Make each refinement unique and varied
- Avoid repetitive patterns - change vocabulary and structure
- Focus on creating vivid, actionable motion descriptions
- Consider the timing and pacing of the motion
- Include both subtle and dynamic elements for richness`;
}

export const Module7PromptRefiner = {
  /**
   * Refine an image-to-video motion prompt with dynamic, varied enhancements
   * Generates unique, high-quality motion prompts each time for better animation output
   */
  async refineMotionPrompt(motionPrompt: string): Promise<string> {
    try {
      const modelName = getTextModelName();
      const strategy = selectMotionStrategy();
      const subjectType = detectSubjectType(motionPrompt);
      const enhancementInstructions = generateMotionEnhancementInstructions(strategy, subjectType);

      const refinementPrompt = `You are an expert AI motion prompt engineer specializing in image-to-video animation and bringing still images to life.

ORIGINAL MOTION PROMPT: "${motionPrompt}"

${enhancementInstructions}

CRITICAL REQUIREMENTS:
1. Output ONLY the refined motion prompt - no explanations, no labels, no quotes
2. The refined prompt must describe natural, realistic motion from the still image
3. Include specific camera movements, environmental motion, and subject motion
4. Describe how the scene animates and evolves over time
5. Use vivid, descriptive language that guides AI animation
6. Length should be sufficient to convey all motion details (typically 200-500 characters)
7. Every refinement should be unique and different from previous ones
8. Avoid generic phrases - be specific about the type and quality of motion
9. Ensure the prompt is optimized for image-to-video AI models
10. Make it compelling and motion-rich while maintaining image subject consistency

Generate the refined motion prompt now:`;

      console.log('🎬 [Module 7] Refining motion prompt with strategy:', strategy.name, '| Subject:', subjectType);

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
        return motionPrompt;
      }

      // Clean up the response - remove any labels, quotes, or extra text
      refinedPrompt = refinedPrompt
        .replace(/^(Refined prompt:|Enhanced prompt:|Motion prompt:|Prompt:|Output:|Here is the refined prompt:|The refined prompt is:)/gi, '')
        .replace(/^(Here is|This is|The refined|Enhanced|Refined)\s+(prompt|output|motion prompt):?\s*/gi, '')
        .replace(/^["']|["']$/g, '')
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Ensure prompt is not too short or too long
      const MIN_LENGTH = 50;
      const MAX_LENGTH = 600;
      
      if (refinedPrompt.length < MIN_LENGTH) {
        console.warn('Refined prompt too short, using original');
        return motionPrompt;
      }

      if (refinedPrompt.length > MAX_LENGTH) {
        refinedPrompt = refinedPrompt.substring(0, MAX_LENGTH).trim();
        const lastSpace = refinedPrompt.lastIndexOf(' ');
        if (lastSpace > MAX_LENGTH * 0.8) {
          refinedPrompt = refinedPrompt.substring(0, lastSpace).trim();
        }
      }

      console.log('✅ [Module 7] Refined with strategy:', strategy.name, '| Subject:', subjectType, '| Length:', refinedPrompt.length, 'chars');
      return refinedPrompt;

    } catch (error) {
      console.error('❌ [Module 7] Refinement error:', error);
      return motionPrompt;
    }
  },

  /**
   * Get available motion strategies for debugging or UI display
   */
  getAvailableStrategies(): string[] {
    return MOTION_STRATEGIES.map(s => s.name);
  },

  /**
   * Get current motion strategy (for testing)
   */
  getCurrentStrategy(): typeof MOTION_STRATEGIES[0] {
    return selectMotionStrategy();
  },

  /**
   * Detect subject type from a prompt (for testing or UI)
   */
  detectSubjectType(prompt: string): string {
    return detectSubjectType(prompt);
  }
};
