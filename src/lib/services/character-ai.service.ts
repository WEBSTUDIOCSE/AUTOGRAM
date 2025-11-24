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
- Be HIGHLY SPECIFIC to this exact scene - mention specific details, activities, emotions
- Make it sound completely real and unrehearsed
- VARY the length naturally:
  * Exciting moments: 3-4 sentences with enthusiasm
  * Peaceful/reflective moments: 1-2 sentences, calm tone
  * Action/adventure: 2-3 sentences with energy
  * Casual moments: 1-2 short sentences, relaxed
- Use emojis that match the mood (1-3 emojis max)
- Include personal thoughts, feelings, or mini-stories
- NO generic phrases like "living my best life", "good vibes only", "blessed"
- NO mention of AI, digital, generated, or artificial content
- Sound like a REAL person would write it

EXAMPLES OF GOOD CAPTIONS:
- "Finally made it to this spot I've been dreaming about 🌅 The hike was brutal but this view made it so worth it"
- "Coffee first, adulting second ☕"
- "This sunset though... Sometimes you just gotta stop and appreciate moments like these 🌇"
- "Trying out this new place everyone's been talking about and wow, did not disappoint! Already planning my next visit 😍"

Hashtags:
- Pick 8-12 hashtags that are DIRECTLY relevant to what's in the scene
- Mix popular tags (100K+ uses) with niche tags (10K-50K uses)
- MUST match the activity/location/mood/objects in the scene
- NO generic lifestyle tags unless they truly fit
- NO AI-related tags whatsoever
- Make them look natural and hand-picked

Format your response EXACTLY as:
CAPTION: [your authentic, scene-specific caption]
HASHTAGS: [space-separated hashtags]`;

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

      // Parse the response without 's' flag
      const captionMatch = responseText.match(/CAPTION:\s*(.+?)(?=\nHASHTAGS:|HASHTAGS:|$)/);
      const hashtagsMatch = responseText.match(/HASHTAGS:\s*(.+?)$/);

      const caption = captionMatch
        ? captionMatch[1].trim()
        : 'Living my best life ✨';
      const hashtags = hashtagsMatch
        ? hashtagsMatch[1].trim()
        : '#lifestyle #goodvibes #mood #instagood #photooftheday #beautiful #happy #love #life #moments';

      console.log('✅ Generated caption and hashtags');

      return { caption, hashtags };
    } catch (error) {
      console.error('❌ Caption generation error:', error);
      // Return varied human-like fallbacks based on random selection
      const fallbackCaptions = [
        'Sometimes you just need moments like these 💫',
        'Making memories one day at a time ✨',
        'This is what happiness looks like 😊',
        'Taking it all in 🌟',
        'Here for the good times 🙌',
        'Feeling grateful for moments like this 💛',
        'Just me being me 💁',
        'These are the days I live for ⭐',
      ];
      
      const fallbackHashtags = [
        '#lifestyle #mood #vibes #instagood #photooftheday #dailylife #moments #happiness #grateful #goodtimes',
        '#weekendvibes #goodmood #positive #blessed #enjoying #lifemoments #happy #smile #peace #joy',
        '#authentic #real #natural #genuine #casual #everyday #simple #beauty #appreciate #present',
        '#living #exploring #discovering #adventure #journey #experience #memories #create #capture #share',
      ];
      
      return {
        caption: fallbackCaptions[Math.floor(Math.random() * fallbackCaptions.length)],
        hashtags: fallbackHashtags[Math.floor(Math.random() * fallbackHashtags.length)],
      };
    }
  },
};
