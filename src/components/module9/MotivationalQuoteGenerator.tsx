'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Copy, Download } from 'lucide-react';

interface GeneratedQuote {
  quoteText: string;
  author: string;
  visualPrompt: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string;
}

export function MotivationalQuoteGenerator() {
  const { toast } = useToast();
  const [category, setCategory] = useState<string>('motivation');
  const [style, setStyle] = useState<string>('bold');
  const [contentType, setContentType] = useState<'image' | 'video'>('image');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuote, setGeneratedQuote] = useState<GeneratedQuote | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedQuote(null);

    try {
      const response = await fetch('/api/motivational-quote-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          style,
          contentType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to generate quote');
      }

      if (result.success) {
        setGeneratedQuote(result.data);
        toast({
          title: "Quote Generated!",
          description: "Your motivational quote has been created successfully.",
        });
      } else {
        throw new Error(result.error || 'Failed to generate quote');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Failed to generate quote',
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCaption = () => {
    if (generatedQuote) {
      navigator.clipboard.writeText(generatedQuote.caption);
      toast({
        title: "Copied!",
        description: "Caption copied to clipboard",
      });
    }
  };

  const handleDownload = () => {
    if (generatedQuote) {
      window.open(generatedQuote.mediaUrl, '_blank');
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Generation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Motivational Quote</CardTitle>
          <CardDescription>
            Create a unique motivational quote with AI-generated image or video
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="motivation">Motivation</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="mindset">Mindset</SelectItem>
                <SelectItem value="growth">Personal Growth</SelectItem>
                <SelectItem value="leadership">Leadership</SelectItem>
                <SelectItem value="wellness">Wellness</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="style">Visual Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger id="style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bold">Bold & Dynamic</SelectItem>
                <SelectItem value="minimal">Minimal & Clean</SelectItem>
                <SelectItem value="nature">Nature & Serene</SelectItem>
                <SelectItem value="urban">Urban & Modern</SelectItem>
                <SelectItem value="abstract">Abstract & Artistic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentType">Content Type</Label>
            <Select value={contentType} onValueChange={(v) => setContentType(v as 'image' | 'video')}>
              <SelectTrigger id="contentType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Quote
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            Generated quote preview and download
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!generatedQuote && !isGenerating && (
            <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No quote generated yet</p>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-muted-foreground">Generating your quote...</p>
            </div>
          )}

          {generatedQuote && (
            <div className="space-y-4">
              {/* Media Preview */}
              <div className="relative rounded-lg overflow-hidden border">
                {generatedQuote.mediaType === 'image' ? (
                  <img 
                    src={generatedQuote.mediaUrl} 
                    alt="Generated quote" 
                    className="w-full h-auto"
                  />
                ) : (
                  <video 
                    src={generatedQuote.mediaUrl} 
                    controls 
                    className="w-full h-auto"
                  />
                )}
              </div>

              {/* Quote Text */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-lg font-medium mb-2">{generatedQuote.quoteText}</p>
                {generatedQuote.author && (
                  <p className="text-sm text-muted-foreground">— {generatedQuote.author}</p>
                )}
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <Label>Caption</Label>
                <Textarea 
                  value={generatedQuote.caption} 
                  readOnly 
                  rows={6}
                  className="text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={handleCopyCaption} variant="outline" className="flex-1">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Caption
                </Button>
                <Button onClick={handleDownload} variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>

              {/* Visual Prompt */}
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  View Visual Prompt
                </summary>
                <p className="mt-2 p-3 bg-muted rounded text-xs">
                  {generatedQuote.visualPrompt}
                </p>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
