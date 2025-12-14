import { genAI, getImageModelName, getTextModelName } from '@/lib/ai/gemini';
import { unifiedImageGeneration } from './image-generation';

/**
 * Character AI Service
 * Handles AI image generation with character models using unified provider (respects user's AI provider selection)
 */
export const CharacterAIService = {
  /**
   * Generate image with character in a custom scene
   * @param characterBase64 - Base64 encoded character image
   * @param scenePrompt - Scene description prompt
   * @param characterUrl - Optional: Firebase Storage URL (used by Kie.ai)
   * @returns Generated image data with caption and hashtags
   */
  async generateWithCharacter(
    characterBase64: string,
    scenePrompt: string,
    characterUrl?: string
  ): Promise<{
    imageBase64: string;
    caption: string;
    hashtags: string;
    model: string;
  }> {
    try {
      // Prepare ULTRA-CONCISE prompt (API limit: ~300 chars)
      // Most APIs reject prompts over 300-500 characters
      let fullPrompt = `This person: ${scenePrompt}`;
      
      // Enforce strict 250 character limit (safe buffer)
      const MAX_PROMPT_LENGTH = 250;
      if (fullPrompt.length > MAX_PROMPT_LENGTH) {
        console.warn(`⚠️ Prompt too long (${fullPrompt.length} chars), truncating to ${MAX_PROMPT_LENGTH}`);
        fullPrompt = fullPrompt.substring(0, MAX_PROMPT_LENGTH).trim();
      }

      console.log('🎨 Generating character scene with selected AI provider...');
      console.log('📝 Scene prompt:', scenePrompt);
      console.log('📏 Final prompt length:', fullPrompt.length, 'characters');
      console.log('📝 Final prompt:', fullPrompt);

      // Strip data URI prefix if present
      let rawBase64 = characterBase64;
      if (characterBase64.includes(',')) {
        rawBase64 = characterBase64.split(',')[1];
      }

      // Use unified image generation service (respects user's provider selection in Firebase)
      const result = await unifiedImageGeneration.generateWithReference(
        { prompt: fullPrompt, quality: 'high', imageSize: 'square_hd' },
        rawBase64,
        undefined, // Provider parameter omitted - will load from Firebase preferences
        characterUrl // Pass character URL for providers that need it (Kie.ai)
      );

      console.log('✅ Character scene generated successfully');

      // Generate caption and hashtags using text model
      const { caption, hashtags } = await this.generateCaptionAndHashtags(
        scenePrompt
      );

      return {
        imageBase64: result.imageBase64,
        caption,
        hashtags,
        model: result.model,
      };
    } catch (error) {
      console.error('❌ Character AI generation error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to generate character scene'
      );
    }
  },

  /**
   * Generate caption and hashtags for the scene
   * @param scenePrompt - Scene description
   * @returns Caption and hashtags
   */
  async generateCaptionAndHashtags(
    scenePrompt: string
  ): Promise<{ caption: string; hashtags: string }> {
    console.log('🔥 [CAPTION GEN] Starting caption generation - Version: 2024-11-25-v3');
    console.log('🔥 [CAPTION GEN] Scene prompt:', scenePrompt);
    
    try {
      const modelName = getTextModelName();

      const captionPrompt = `You are writing an authentic Instagram post for this moment: "${scenePrompt}"

Write as if YOU are the person in this moment, sharing it with friends on Instagram.

CRITICAL RULES:
- Write in FIRST PERSON (I, me, my, we)
- Be HIGHLY SPECIFIC to this exact scene - mention specific details, activities, emotions, colors, objects
- Make it sound completely real and unrehearsed
- VARY the length and style dramatically based on the scene
- Use emojis that match the mood (1-3 emojis max)
- Include personal thoughts, feelings, or mini-stories
- NEVER use these phrases: "living my best life", "good vibes only", "blessed", "vibes", "mood"
- NO mention of AI, digital, generated, or artificial content
- Sound like a REAL person would write it - casual, natural, spontaneous

SCENE-SPECIFIC APPROACH:
1. Look at the exact details in the scene prompt
2. Pick 1-2 specific elements to focus on (clothing, location, activity, emotion)
3. Write about THOSE specific things, not generic concepts
4. Imagine what thought you'd actually share if this was YOUR photo

EXAMPLES:
Scene: "Woman in white dress at beach sunset"
Caption: "This dress was definitely not made for sand but here we are 😂 Worth it for this view though"

Scene: "Coffee shop with laptop"
Caption: "Third coffee today and it's only 2pm ☕ No regrets"

Scene: "Hiking on mountain trail"  
Caption: "My legs are going to hate me tomorrow but look at this! Can't believe I almost skipped this hike 🏔️"

Scene: "Night city lights"
Caption: "Sometimes the best plans are the ones you don't make. Just wandering tonight ✨"

Hashtags:
- Pick 8-12 hashtags DIRECTLY from the scene details (clothing, location, activity, time of day, colors, objects)
- Mix size: 3-4 popular (500K+ uses), 4-5 medium (50K-500K), 2-3 niche (10K-50K)
- NO generic lifestyle tags like #lifestyle, #mood, #vibes, #goodvibes
- Must describe actual visual elements or specific activities shown
- NO AI-related tags whatsoever

Format your response EXACTLY as:
CAPTION: [your specific, unique caption about THIS exact scene]
HASHTAGS: [space-separated relevant hashtags]

CRITICAL: Keep caption on ONE line, no line breaks within the caption itself.
Remember: If the caption could work for ANY photo, it's too generic. Make it SPECIFIC to THIS scene only.`;

      const response = await genAI.models.generateContent({
        model: modelName,
        contents: captionPrompt,
      }) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

      let responseText = '';
      if (response.candidates && response.candidates[0]) {
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.text) {
              responseText = part.text;
              break;
            }
          }
        }
      }

      console.log('📝 AI Caption Response:', responseText.substring(0, 200) + '...');

      // Parse the response - use [\s\S] instead of . with s flag for ES5 compatibility
      const captionMatch = responseText.match(/CAPTION:\s*([\s\S]+?)(?=\n*HASHTAGS:|$)/);
      const hashtagsMatch = responseText.match(/HASHTAGS:\s*([\s\S]+?)$/);

      console.log('🔍 Caption match found:', !!captionMatch);
      if (captionMatch) {
        console.log('🔍 Captured caption:', captionMatch[1]?.trim().substring(0, 100));
      }

      // If parsing failed or caption too short, generate a simple dynamic caption from the scene
      if (!captionMatch || !captionMatch[1] || captionMatch[1].trim().length < 5) {
        console.log('⚠️ Caption parsing failed, generating specific scene-based caption');
        
        // Extract detailed words from scene to make caption VERY specific
        const words = scenePrompt.toLowerCase().split(/\s+/);
        const timeWords = words.filter(w => ['morning', 'evening', 'night', 'sunset', 'sunrise', 'afternoon', 'dawn', 'dusk'].includes(w));
        const placeWords = words.filter(w => ['beach', 'mountain', 'city', 'park', 'cafe', 'restaurant', 'rooftop', 'street', 'garden', 'forest', 'lake', 'ocean', 'downtown'].includes(w));
        const activityWords = words.filter(w => ['walking', 'hiking', 'running', 'coffee', 'breakfast', 'lunch', 'dinner', 'reading', 'working', 'shopping', 'exploring'].includes(w));
        const colorWords = words.filter(w => ['red', 'blue', 'white', 'black', 'green', 'yellow', 'pink', 'golden'].includes(w));
        
        // Build SPECIFIC caption from scene details (NO generic phrases)
        let simpleCap = '';
        if (activityWords.length > 0 && placeWords.length > 0) {
          simpleCap = `${activityWords[0].charAt(0).toUpperCase() + activityWords[0].slice(1)} at ${placeWords[0]} rn`;
        } else if (timeWords.length > 0 && placeWords.length > 0) {
          simpleCap = `${timeWords[0].charAt(0).toUpperCase() + timeWords[0].slice(1)} ${placeWords[0]} 📸`;
        } else if (colorWords.length > 0) {
          simpleCap = `${colorWords[0].charAt(0).toUpperCase() + colorWords[0].slice(1)} day`;
        } else if (placeWords.length > 0) {
          simpleCap = `At ${placeWords[0]} today`;
        } else if (activityWords.length > 0) {
          simpleCap = `${activityWords[0].charAt(0).toUpperCase() + activityWords[0].slice(1)} rn`;
        } else {
          // Use current time to ensure uniqueness
          const hour = new Date().getHours();
          simpleCap = hour < 12 ? 'Out here this morning' : hour < 17 ? 'Afternoon break' : 'Tonight 🌙';
        }
        
        return {
          caption: simpleCap,
          hashtags: '#photooftheday #instagood #photography #photo #instadaily #picoftheday #capture #instagram',
        };
      }

      let caption = captionMatch[1].trim();
      const hashtags = hashtagsMatch && hashtagsMatch[1]
        ? hashtagsMatch[1].trim()
        : '#photooftheday #instagood #beautiful #lifestyle #moments #daily #instagram #photo #capture #memory';

      // CRITICAL: Filter out banned generic phrases
      const bannedPhrases = [
        'living my best life',
        'living the best life',
        'good vibes',
        'vibes',
        'blessed',
        'mood',
        'lifestyle',
        'captured this moment',
        'moments',
        'feeling grateful'
      ];
      
      const captionLower = caption.toLowerCase();
      const hasBannedPhrase = bannedPhrases.some(phrase => captionLower.includes(phrase));
      
      if (hasBannedPhrase) {
        console.log('⚠️ AI generated banned phrase, creating unique scene-based caption');
        
        // Extract specific details from scene prompt
        const words = scenePrompt.toLowerCase().split(/\s+/);
        
        // More specific word lists
        const timeWords = words.filter(w => ['morning', 'evening', 'night', 'sunset', 'sunrise', 'afternoon', 'dawn', 'dusk', 'noon', 'midnight'].includes(w));
        const placeWords = words.filter(w => ['beach', 'mountain', 'city', 'park', 'cafe', 'restaurant', 'street', 'rooftop', 'garden', 'forest', 'lake', 'river', 'ocean', 'downtown', 'urban', 'countryside'].includes(w));
        const activityWords = words.filter(w => ['walking', 'hiking', 'running', 'sitting', 'coffee', 'breakfast', 'lunch', 'dinner', 'reading', 'working', 'dancing', 'shopping', 'exploring'].includes(w));
        const weatherWords = words.filter(w => ['sunny', 'cloudy', 'rainy', 'windy', 'foggy', 'clear', 'overcast'].includes(w));
        const colorWords = words.filter(w => ['red', 'blue', 'white', 'black', 'green', 'yellow', 'pink', 'purple', 'golden', 'silver'].includes(w));
        
        // Build unique caption from actual scene details
        if (activityWords.length > 0 && placeWords.length > 0) {
          caption = `${activityWords[0].charAt(0).toUpperCase() + activityWords[0].slice(1)} at ${placeWords[0]} today`;
        } else if (timeWords.length > 0 && placeWords.length > 0) {
          caption = `${timeWords[0].charAt(0).toUpperCase() + timeWords[0].slice(1)} ${placeWords[0]} 📸`;
        } else if (colorWords.length > 0 && placeWords.length > 0) {
          caption = `${colorWords[0].charAt(0).toUpperCase() + colorWords[0].slice(1)} ${placeWords[0]} kind of day`;
        } else if (weatherWords.length > 0) {
          caption = `${weatherWords[0].charAt(0).toUpperCase() + weatherWords[0].slice(1)} day out here`;
        } else if (placeWords.length > 0) {
          caption = `Found this spot at ${placeWords[0]} 🌟`;
        } else if (activityWords.length > 0) {
          caption = `${activityWords[0].charAt(0).toUpperCase() + activityWords[0].slice(1)} right now`;
        } else {
          // Last resort: use timestamp to ensure uniqueness
          const hour = new Date().getHours();
          caption = hour < 12 ? 'Morning out here ☀️' : hour < 17 ? 'Afternoon break 🌤️' : 'Evening scenes 🌆';
        }
      }

      console.log('✅ Generated caption and hashtags');
      console.log('📝 Final caption:', caption);
      console.log('🏷️ Final hashtags:', hashtags);
      console.log('🔥 [CAPTION GEN] Completed successfully - Version: 2024-11-25-v3');

      return { caption, hashtags };
    } catch (error) {
      console.error('❌ Caption generation error:', error);
      
      // On error, create SPECIFIC scene-based caption (NO generic phrases)
      console.log('⚠️ Using specific scene-based caption due to error');
      
      // Extract detailed words from scene to make caption specific
      const words = scenePrompt.toLowerCase().split(/\s+/);
      const timeWords = words.filter(w => ['morning', 'evening', 'night', 'sunset', 'sunrise', 'afternoon', 'dawn', 'dusk'].includes(w));
      const placeWords = words.filter(w => ['beach', 'mountain', 'city', 'park', 'cafe', 'restaurant', 'rooftop', 'street', 'garden', 'forest', 'lake', 'ocean', 'downtown', 'home', 'studio'].includes(w));
      const activityWords = words.filter(w => ['walking', 'hiking', 'running', 'coffee', 'breakfast', 'lunch', 'dinner', 'reading', 'working', 'shopping', 'exploring', 'sitting', 'standing'].includes(w));
      const colorWords = words.filter(w => ['red', 'blue', 'white', 'black', 'green', 'yellow', 'pink', 'golden', 'silver'].includes(w));
      const weatherWords = words.filter(w => ['sunny', 'cloudy', 'rainy', 'foggy', 'clear'].includes(w));
      
      // Build SPECIFIC caption from actual scene details (NO generic words)
      let caption = '';
      
      if (activityWords.length > 0 && placeWords.length > 0) {
        caption = `${activityWords[0].charAt(0).toUpperCase() + activityWords[0].slice(1)} at ${placeWords[0]} rn`;
      } else if (timeWords.length > 0 && placeWords.length > 0) {
        caption = `${timeWords[0].charAt(0).toUpperCase() + timeWords[0].slice(1)} ${placeWords[0]} 📸`;
      } else if (colorWords.length > 0 && placeWords.length > 0) {
        caption = `${colorWords[0].charAt(0).toUpperCase() + colorWords[0].slice(1)} ${placeWords[0]}`;
      } else if (weatherWords.length > 0) {
        caption = `${weatherWords[0].charAt(0).toUpperCase() + weatherWords[0].slice(1)} day out`;
      } else if (placeWords.length > 0) {
        caption = `At ${placeWords[0]} today`;
      } else if (activityWords.length > 0) {
        caption = `${activityWords[0].charAt(0).toUpperCase() + activityWords[0].slice(1)} rn`;
      } else {
        // Last resort: use timestamp to ensure complete uniqueness
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDate();
        caption = hour < 12 ? `Out this morning (${day}th)` : hour < 17 ? `This afternoon (${day}th)` : `Tonight (${day}th) 🌙`;
      }
      
      console.log('📝 Error fallback caption:', caption);
      
      return {
        caption,
        hashtags: '#photooftheday #instagood #photography #photo #instadaily #picoftheday #capture',
      };
    }
  },
};
