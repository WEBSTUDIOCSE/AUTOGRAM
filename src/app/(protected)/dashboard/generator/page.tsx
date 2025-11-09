'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, Save, ImageIcon } from 'lucide-react';
import { RecentPrompts } from '@/components/module1/RecentPrompts';
import { PromptInput } from '@/components/module1/PromptInput';
import { InstagramAccountSelector } from '@/components/module1/InstagramAccountSelector';
import { mockGeneratedImage, mockHashtagSuggestions } from '@/lib/mock-data/module1';

export default function GeneratorPage() {
  const [prompt, setPrompt] = React.useState('');
  const [caption, setCaption] = React.useState('');
  const [hashtags, setHashtags] = React.useState('');
  const [selectedAccount, setSelectedAccount] = React.useState('1');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [hasGeneratedImage, setHasGeneratedImage] = React.useState(false);
  const [selectedHashtags, setSelectedHashtags] = React.useState<string[]>([]);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false);
      setHasGeneratedImage(true);
      // Auto-fill caption with prompt
      setCaption(`${prompt} ✨ AI-generated image #art #creativity`);
    }, 2000);
  };

  const handleSelectPrompt = (selectedPrompt: string) => {
    setPrompt(selectedPrompt);
  };

  const handleAddHashtag = (tag: string) => {
    if (!selectedHashtags.includes(tag) && selectedHashtags.length < 30) {
      const newTags = [...selectedHashtags, tag];
      setSelectedHashtags(newTags);
      setHashtags(newTags.map(t => `#${t}`).join(' '));
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    const newTags = selectedHashtags.filter(t => t !== tag);
    setSelectedHashtags(newTags);
    setHashtags(newTags.map(t => `#${t}`).join(' '));
  };

  return (
    <div className="flex-1 space-y-4 p-3 md:p-6">

      {/* Two Column Layout - Left panel wider */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-[1fr_500px]">
        {/* Left Panel - Input Section (No Cards) */}
        <div className="space-y-4 md:space-y-6">
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
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full"
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
                    Enter a detailed prompt on the left and click "Generate Image" to create your first AI-powered image
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
              {/* Generated Image Preview with Padding */}
              <Card className="overflow-hidden">
                <div className="px-3  md:px-4">
                  <div className=" relative max-h-[350px] md:max-h-[400px] overflow-hidden rounded-lg">
                    <img
                      src={mockGeneratedImage.url}
                      alt="Generated AI Image"
                    
                      className="object-cover w-full h-full"
                      
                 
                    />
                  </div>
                </div>
                <div className="px-3 md:px-4 pt-2 pb-2 md:pt-3 md:pb-3 space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Saved as: <span className="font-mono text-xs">{mockGeneratedImage.fileName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mockGeneratedImage.fileSize} • {mockGeneratedImage.dimensions}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs md:text-sm">
                      <RefreshCw className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Regenerate</span>
                      <span className="sm:hidden">Regen</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs md:text-sm">
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

              {/* Post Button */}
              <Button size="lg" className="w-full">
                Continue to Preview →
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
