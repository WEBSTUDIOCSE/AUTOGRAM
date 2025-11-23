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
      const fullPrompt = 'Using the EXACT person shown in this reference image, generate a new photo of them in this scene: ' + scenePrompt + '\n\nCRITICAL REQUIREMENTS:\n- Use the EXACT SAME PERSON from the reference image - identical face, features, and appearance\n- This must be the SAME PERSON, not a similar-looking person\n- Keep ALL facial features, hair, skin tone, and characteristics identical\n- Place this exact person in the new scene described above\n- Maintain photorealistic quality\n- The person must be clearly visible and the main focus\n- Natural lighting and composition\n\nRemember: This is a photo editing task - keep the person\'s identity and appearance EXACTLY the same, only change the background/scene/setting.';

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

      const captionPrompt = 'Based on this scene: "' + scenePrompt + '"\n\nCreate an authentic, human-written Instagram post as if someone is sharing a genuine moment from their life.\n\nGuidelines:\n- Write in first person (I, me, my)\n- Be conversational and natural, like talking to friends\n- Share emotions, thoughts, or story behind the moment\n- 2-3 sentences maximum\n- NO mention of AI, digital art, or generated content\n- Sound real and authentic\n- Use casual language and emojis naturally\n\nHashtags:\n- Use 8-12 hashtags that real people use\n- Mix popular and niche tags\n- NO AI-related tags (#AIArt, #AIGenerated, #DigitalArt, etc.)\n- Use lifestyle, mood, and moment-based tags\n- Focus on the activity, location, emotion, or theme\n- Make them look organic, not automated\n\nFormat:\nCAPTION: [authentic first-person caption with emojis]\nHASHTAGS: [natural hashtags without AI mentions]';

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
      // Return human-like defaults on error
      return {
        caption: 'Just living in the moment 💫',
        hashtags: '#lifestyle #mood #vibes #instagood #photooftheday #dailylife #blessed #grateful #happiness #goodtimes',
      };
    }
  },
};
