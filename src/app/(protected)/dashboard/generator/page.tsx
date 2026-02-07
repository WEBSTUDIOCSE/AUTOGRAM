'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Download, RefreshCw, Save, ImageIcon, Send, CheckCircle2, Wand2 } from 'lucide-react';
import { RecentPrompts } from '@/components/module1/RecentPrompts';
import { PromptInput } from '@/components/module1/PromptInput';
import { InstagramAccountSelector } from '@/components/module1/InstagramAccountSelector';
import { APIBook } from '@/lib/firebase/services';
import { InstagramPostService } from '@/lib/services/module3/post-history.service';
import { ImageService } from '@/lib/services/image.service';
import { useAuth } from '@/contexts/AuthContext';

export default function GeneratorPage() {
  const { user } = useAuth();
  const [prompt, setPrompt] = React.useState('');
  const [caption, setCaption] = React.useState('');
  const [hashtags, setHashtags] = React.useState('');
  const [selectedAccount, setSelectedAccount] = React.useState('account1');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [hasGeneratedImage, setHasGeneratedImage] = React.useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = React.useState('');
  const [generatedImageId, setGeneratedImageId] = React.useState(''); // Firestore doc ID
  const [aiError, setAiError] = React.useState('');
  const [isPosting, setIsPosting] = React.useState(false);
  const [postSuccess, setPostSuccess] = React.useState(false);
  const [postError, setPostError] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [isRefining, setIsRefining] = React.useState(false);

  const handleRefinePrompt = async () => {
    if (!prompt.trim()) {
      setAiError('Please enter a prompt first');
      return;
    }

    setIsRefining(true);
    setAiError('');

    try {
      const { Module1PromptRefiner } = await import('@/lib/services/module1/prompt-refiner.service');
      const refinedPrompt = await Module1PromptRefiner.refinePrompt(prompt);
      setPrompt(refinedPrompt);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Failed to refine prompt');
    } finally {
      setIsRefining(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !user?.uid) return;
    setIsGenerating(true);
    setIsSaving(false);
    setAiError('');
    setGeneratedImageUrl('');
    setGeneratedImageId('');
    setPostSuccess(false);
    setPostError('');
    
    try {
      // Step 1: Generate image with Gemini AI
      const response = await APIBook.ai.generateImage(prompt);
      
      if (response.success && response.data) {
        // imageBase64 already has data URL prefix from provider
        setGeneratedImageUrl(response.data.imageBase64);
        setHasGeneratedImage(true);
        
        // Step 2: Save to Firestore + Firebase Storage
        setIsSaving(true);
        const imageId = await ImageService.saveImage({
          userId: user.uid,
          prompt: prompt,
          imageBase64: response.data.imageBase64,
          model: response.data.model,
          moduleType: 'module1'
        });
        
        setGeneratedImageId(imageId);
        
        // Auto-fill caption and hashtags from AI response
        if (response.data.caption) {
          setCaption(response.data.caption);
        }
        if (response.data.hashtags) {
          setHashtags(response.data.hashtags);
        }
      } else {
        setAiError(response.error || 'Failed to generate image');
        setHasGeneratedImage(false);
      }
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'An error occurred');
      setHasGeneratedImage(false);
    } finally {
      setIsGenerating(false);
      setIsSaving(false);
    }
  };

  const handlePostToInstagram = async () => {
    if (!generatedImageId || !caption.trim() || !user?.uid) {
      setPostError('Image and caption are required');
      return;
    }

    setIsPosting(true);
    setPostError('');
    setPostSuccess(false);

    try {
      // Step 1: Get saved image data from Firestore
      const savedImage = await ImageService.getImage(generatedImageId);
      
      if (!savedImage || !savedImage.imageUrl) {
        throw new Error('Image not found in storage');
      }

      const publicImageUrl = savedImage.imageUrl;

      // Step 2: Combine caption and hashtags
      const fullCaption = hashtags.trim() 
        ? `${caption}\n\n${hashtags}` 
        : caption;

      // Step 3: Post to Instagram
      const instagramPostId = await APIBook.instagram.postImage(
        publicImageUrl, 
        fullCaption, 
        selectedAccount
      );
      

      // Get account info for display
      const account = APIBook.instagram.getAccountById(selectedAccount);

      // Step 4: Save to Instagram post history
      await InstagramPostService.savePost({
        userId: user.uid,
        imageId: generatedImageId,
        prompt: prompt,
        caption: caption,
        hashtags: hashtags,
        imageUrl: publicImageUrl,
        instagramPostId: instagramPostId,
        instagramAccountId: selectedAccount,
        instagramAccountName: account?.name || 'Instagram Account',
        model: savedImage.model,
        moduleType: 'module1'
      });

      // Step 5: Update image status to "posted"
      await ImageService.updateStatus(generatedImageId, 'posted');

      setPostSuccess(true);

      // Reset after 3 seconds
      setTimeout(() => {
        setPostSuccess(false);
      }, 3000);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to post to Instagram';
      setPostError(errorMsg);
      
      // Save failed post
      if (user?.uid && generatedImageId) {
        try {
          const savedImage = await ImageService.getImage(generatedImageId);
          const account = APIBook.instagram.getAccountById(selectedAccount);
          if (savedImage) {
            await InstagramPostService.saveFailedPost({
              userId: user.uid,
              imageId: generatedImageId,
              prompt: prompt,
              caption: caption,
              hashtags: hashtags,
              imageUrl: savedImage.imageUrl,
              instagramAccountId: selectedAccount,
              instagramAccountName: account?.name || 'Instagram Account',
              model: savedImage.model,
              error: errorMsg,
              moduleType: 'module1'
            });
          }
        } catch (saveError) {
        }
      }
    } finally {
      setIsPosting(false);
    }
  };

  const handleSelectPrompt = (selectedPrompt: string) => {
    setPrompt(selectedPrompt);
  };

  const handleDownloadImage = () => {
    if (!generatedImageUrl) return;
    
    // Create download link
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = `autogram-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegenerateImage = () => {
    setPrompt(prompt);
  };

  return (
    <div className="flex-1 space-y-4 p-3 md:p-6 overflow-hidden">

      {/* Two Column Layout - Left panel wider */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-[1fr_500px] max-w-full">
        {/* Left Panel - Input Section (No Cards) */}
        <div className="space-y-4 md:space-y-6 min-w-0">
          {/* Recent Prompts */}
          <div className="space-y-3">
            <RecentPrompts onSelectPrompt={handleSelectPrompt} />
          </div>

          {/* Describe Your Image */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Describe Your Image</h3>
            <PromptInput
              value={prompt}
              onChange={setPrompt}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleRefinePrompt}
                disabled={!prompt.trim() || isGenerating || isRefining}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                {isRefining ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Refining...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Refine Prompt
                  </>
                )}
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating || isRefining}
                className="flex-1"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>Generate Image ✨</>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview & Post Section */}
        <div className="space-y-4 md:space-y-6">
          {!hasGeneratedImage && !isGenerating && (
            <Card className="p-8 md:p-12">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="rounded-full bg-primary/10 p-4 md:p-6">
                  <ImageIcon className="h-8 w-8 md:h-12 md:w-12 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base md:text-lg font-medium">Ready to Create?</h3>
                  <p className="text-xs md:text-sm text-muted-foreground max-w-sm">
                    Enter a detailed prompt on the left and click &quot;Generate Image&quot; to create your first AI-powered image
                  </p>
                </div>
              </div>
            </Card>
          )}

          {isGenerating && (
            <Card className="p-8 md:p-12">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <RefreshCw className="h-10 w-10 md:h-12 md:w-12 text-primary animate-spin" />
                <div className="space-y-2">
                  <h3 className="text-base md:text-lg font-medium">✨ Generating your image...</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    This usually takes 15-30 seconds
                  </p>
                </div>
              </div>
            </Card>
          )}

          {hasGeneratedImage && !isGenerating && (
            <>
              {/* Error Display */}
              {aiError && (
                <Card className="p-4 bg-destructive/10 border-destructive/50">
                  <h4 className="text-sm font-semibold mb-2 text-destructive">
                    ❌ Generation Failed
                  </h4>
                  <p className="text-xs text-destructive">
                    {aiError}
                  </p>
                </Card>
              )}

              {/* Generated Image Preview with Padding */}
              <Card className="overflow-hidden">
                <div className="px-3  md:px-4">
                  <div className=" relative max-h-[350px] md:max-h-[400px] overflow-hidden rounded-lg">
                    <img
                      src={generatedImageUrl}
                      alt="Generated AI Image"
                    
                      className="object-cover w-full h-full"
                      
                 
                    />
                  </div>
                </div>
                <div className="px-3 md:px-4 pt-2 pb-2 md:pt-3 md:pb-3 space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Image generated successfully
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-xs md:text-sm"
                      onClick={handleRegenerateImage}
                      disabled={isGenerating}
                    >
                      <RefreshCw className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Regenerate</span>
                      <span className="sm:hidden">Regen</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-xs md:text-sm"
                      onClick={handleDownloadImage}
                    >
                      <Download className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Download</span>
                      <span className="sm:hidden">Save</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs md:text-sm">
                      <Save className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                      Keep
                    </Button>
                  </div>

                  <Separator />

                  {/* Caption - Below Image */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Caption</h3>
                      <span className="text-xs text-muted-foreground">
                        {caption.length}/2,200
                      </span>
                    </div>
                    <Textarea
                      value={caption}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCaption(e.target.value)}
                      placeholder="Write a caption for your post..."
                      className="min-h-[70px] md:min-h-[80px] resize-none text-sm"
                      maxLength={2200}
                    />
                  </div>

                  {/* Hashtags - Below Caption as Textarea */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Hashtags</h3>
                      <span className="text-xs text-muted-foreground">
                        Max 30
                      </span>
                    </div>
                    <Textarea
                      value={hashtags}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setHashtags(e.target.value)}
                      placeholder="#art #sunset #beautiful #nature"
                      className="min-h-[50px] md:min-h-[60px] resize-none text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 Separate with spaces
                    </p>
                  </div>
                </div>
              </Card>

              {/* Instagram Account Selection - Right Panel */}
              <Card className="p-3 md:p-3">
                <InstagramAccountSelector
                  selectedAccountId={selectedAccount}
                  onSelectAccount={setSelectedAccount}
                />
              </Card>

              {/* Success/Error Messages */}
              {postSuccess && (
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="text-sm font-medium">✅ Posted to Instagram successfully!</p>
                  </div>
                </Card>
              )}

              {postError && (
                <Card className="p-4 bg-red-50 border-red-200">
                  <div className="text-red-700">
                    <p className="text-sm font-semibold mb-1">❌ Failed to post</p>
                    <p className="text-xs">{postError}</p>
                  </div>
                </Card>
              )}

              {/* Post Button */}
              <Button 
                size="lg" 
                className="w-full"
                onClick={handlePostToInstagram}
                disabled={isPosting || isSaving || !caption.trim()}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving Image...
                  </>
                ) : isPosting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Posting to Instagram...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Post to Instagram
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
