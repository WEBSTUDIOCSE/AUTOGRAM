import { genAI, getImageModelName, getTextModelName } from '@/lib/ai/gemini';

/**
 * Character AI Service
 * Handles AI image generation with character models using Gemini
 */
export const CharacterAIService = {
  /**
   * Generate image with character in a custom scene
   * @param characterBase64 - Base64 encoded character image
   * @param scenePrompt - Scene description prompt
   * @returns Generated image data with caption and hashtags
   */
  async generateWithCharacter(
    characterBase64: string,
    scenePrompt: string
  ): Promise<{
    imageBase64: string;
    caption: string;
    hashtags: string;
    model: string;
  }> {
    try {
      const imageModelName = getImageModelName();

      // Prepare the prompt for image-to-image generation
      const fullPrompt = `CRITICAL INSTRUCTION: Using the EXACT SAME PERSON from the reference image, create an ultra-realistic photograph in this scene:

"${scenePrompt}"

🎯 PERSON REQUIREMENTS (HIGHEST PRIORITY):
- This MUST be the IDENTICAL person from the reference image
- EXACT same face structure, features, expressions
- EXACT same skin tone, hair color, hair style
- EXACT same eye color, eye shape, nose, mouth
- Maintain all unique facial characteristics and beauty marks
- Same body type, proportions, and physical attributes
- This is face-swapping/identity preservation - NOT creating a new person

📸 PHOTOGRAPHY REQUIREMENTS:
- Ultra-high definition, photorealistic quality
- Professional photography standards
- Natural, realistic lighting (avoid artificial/CGI look)
- Proper depth of field and bokeh
- Realistic shadows, highlights, and reflections
- Natural color grading (not oversaturated)
- Sharp focus on the person, natural background blur
- Realistic proportions and perspective

🎬 SCENE & COMPOSITION:
- Follow the scene description accurately: ${scenePrompt}
- Natural, candid pose (not posed/artificial)
- Person should be main subject, clearly visible
- Authentic setting and environment
- Contextually appropriate clothing and styling
- Realistic interaction with environment
- Natural body language and positioning

❌ AVOID:
- Artificial/CGI/rendered look
- Oversaturated or unrealistic colors
- Unnatural lighting or shadows
- Distorted proportions or features
- Blurry or low-quality results
- Cartoonish or illustrated style
- Changing the person's identity/face
- Adding unrealistic elements

REMEMBER: This should look like a real photograph taken with a professional camera, featuring the exact same person from the reference image in a new setting.`;

      console.log('🎨 Generating character scene with Gemini...');
      console.log('📝 Scene prompt:', scenePrompt);

      // Align with Gemini documentation - simpler prompt structure
      const prompt = [
        { text: fullPrompt },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: characterBase64,
          },
        },
      ];

      const response = await genAI.models.generateContent({
        model: imageModelName,
        contents: prompt,
      });

      // Use response.candidates[0].content.parts as per Gemini structure
      if (!response.candidates || !response.candidates[0]?.content?.parts) {
        throw new Error('No response parts received from Gemini');
      }

      const parts = response.candidates[0].content.parts;
      let generatedImageBase64 = '';

      // Iterate through parts to find image or check for rejection
      for (const part of parts) {
        if (part.text) {
          const text = part.text.toLowerCase();
          // Check for content rejection
          if (text.includes('cannot fulfill') || 
              text.includes('programmed to avoid') || 
              text.includes('sorry') ||
              text.includes('inappropriate')) {
            throw new Error('⚠️ Content rejected by AI: Your scene description may contain inappropriate or sensitive content. Please modify your prompt to be more appropriate.');
          }
          console.log('📄 Text response:', part.text);
        } else if (part.inlineData && part.inlineData.data) {
          generatedImageBase64 = part.inlineData.data;
          console.log('✅ Image data received');
        }
      }

      if (!generatedImageBase64) {
        throw new Error('No image generated in response');
      }

      console.log('✅ Character scene generated successfully');

      // Generate caption and hashtags using text model
      const { caption, hashtags } = await this.generateCaptionAndHashtags(
        scenePrompt
      );

      const imageDataUrl = 'data:image/png;base64,' + generatedImageBase64;

      return {
        imageBase64: imageDataUrl,
        caption,
        hashtags,
        model: imageModelName,
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

      // Parse the response without 's' flag
      const captionMatch = responseText.match(/CAPTION:\s*(.+?)(?=\nHASHTAGS:|HASHTAGS:|$)/);
      const hashtagsMatch = responseText.match(/HASHTAGS:\s*(.+?)$/);

      // If parsing failed or caption too short, generate a simple dynamic caption from the scene
      if (!captionMatch || !captionMatch[1] || captionMatch[1].trim().length < 5) {
        console.log('⚠️ Caption parsing failed, generating simple dynamic caption from scene');
        
        // Extract key words from scene to make caption dynamic
        const words = scenePrompt.toLowerCase().split(' ');
        const timeWords = words.filter(w => ['morning', 'evening', 'night', 'sunset', 'sunrise', 'afternoon'].includes(w));
        const placeWords = words.filter(w => ['beach', 'mountain', 'city', 'park', 'home', 'cafe', 'street', 'studio'].includes(w));
        const actionWords = words.filter(w => ['walking', 'sitting', 'standing', 'posing', 'relaxing', 'enjoying'].includes(w));
        
        // Build simple dynamic caption
        let simpleCap = '';
        if (timeWords.length > 0) {
          simpleCap = `${timeWords[0].charAt(0).toUpperCase() + timeWords[0].slice(1)} vibes ✨`;
        } else if (placeWords.length > 0) {
          simpleCap = `${placeWords[0].charAt(0).toUpperCase() + placeWords[0].slice(1)} moments 💫`;
        } else if (actionWords.length > 0) {
          simpleCap = `Just ${actionWords[0]} 🌟`;
        } else {
          simpleCap = 'Captured this moment ✨';
        }
        
        return {
          caption: simpleCap,
          hashtags: '#photooftheday #instagood #photography #beautiful #lifestyle #instadaily #picoftheday #photo',
        };
      }

      const caption = captionMatch[1].trim();
      const hashtags = hashtagsMatch && hashtagsMatch[1]
        ? hashtagsMatch[1].trim()
        : '#photooftheday #instagood #beautiful #lifestyle #moments #daily #instagram #photo #capture #memory';

      console.log('✅ Generated caption and hashtags');

      return { caption, hashtags };
    } catch (error) {
      console.error('❌ Caption generation error:', error);
      
      // On error, create simple dynamic caption from scene prompt instead of hardcoded fallbacks
      console.log('⚠️ Using simple scene-based caption due to error');
      
      // Extract key words from scene to make caption dynamic
      const words = scenePrompt.toLowerCase().split(' ');
      const timeWords = words.filter(w => ['morning', 'evening', 'night', 'sunset', 'sunrise', 'afternoon'].includes(w));
      const placeWords = words.filter(w => ['beach', 'mountain', 'city', 'park', 'home', 'cafe', 'street', 'studio', 'nature', 'outdoor', 'indoor'].includes(w));
      const moodWords = words.filter(w => ['happy', 'peaceful', 'calm', 'energetic', 'relaxed', 'confident', 'joyful'].includes(w));
      const actionWords = words.filter(w => ['walking', 'sitting', 'standing', 'posing', 'relaxing', 'enjoying', 'exploring'].includes(w));
      
      // Build simple dynamic caption based on scene content
      let caption = 'Captured this moment ✨';
      
      if (timeWords.length > 0 && placeWords.length > 0) {
        caption = `${timeWords[0].charAt(0).toUpperCase() + timeWords[0].slice(1)} at the ${placeWords[0]} 🌟`;
      } else if (timeWords.length > 0) {
        caption = `${timeWords[0].charAt(0).toUpperCase() + timeWords[0].slice(1)} vibes ✨`;
      } else if (placeWords.length > 0) {
        caption = `${placeWords[0].charAt(0).toUpperCase() + placeWords[0].slice(1)} moments 💫`;
      } else if (moodWords.length > 0) {
        caption = `Feeling ${moodWords[0]} today 😊`;
      } else if (actionWords.length > 0) {
        caption = `Just ${actionWords[0]} 🌈`;
      }
      
      return {
        caption,
        hashtags: '#photooftheday #instagood #photography #beautiful #lifestyle #instadaily #picoftheday #photo',
      };
    }
  },
};
