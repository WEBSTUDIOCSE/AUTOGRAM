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
      const fullPrompt = `Create a new image based on this character. 
Scene description: ${scenePrompt}

Requirements:
- Keep the character's appearance consistent with the reference image
- Place the character in the described scene
- Maintain high quality and realistic details
- Ensure the character is the main focus
- Match the style and mood of the scene description`;

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

      return {
        imageBase64: `data:image/png;base64,${generatedImageBase64}`,
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

      const captionPrompt = `Based on this scene description: "${scenePrompt}"

Generate:
1. An engaging Instagram caption (2-3 sentences, natural and conversational)
2. 10-15 relevant hashtags

Format your response exactly as:
CAPTION: [your caption here]
HASHTAGS: [hashtags here separated by spaces]`;

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
        : 'AI-generated character scene';
      const hashtags = hashtagsMatch
        ? hashtagsMatch[1].trim()
        : '#AIArt #CharacterArt #DigitalArt';

      console.log('✅ Generated caption and hashtags');

      return { caption, hashtags };
    } catch (error) {
      console.error('❌ Caption generation error:', error);
      // Return defaults on error
      return {
        caption: 'AI-generated character scene ✨',
        hashtags: '#AIArt #CharacterArt #DigitalArt #AIGenerated #CreativeAI',
      };
    }
  },
};
