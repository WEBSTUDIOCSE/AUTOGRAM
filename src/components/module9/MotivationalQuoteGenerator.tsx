'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Sparkles, Copy, Download, Send } from 'lucide-react';
import { APIBook } from '@/lib/firebase/services';
import { useAuth } from '@/contexts/AuthContext';

interface GeneratedQuote {
  quoteText: string;
  author: string;
  visualPrompt: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string;
}

interface InstagramAccount {
  id: string;
  name: string;
  username?: string;
}

export function MotivationalQuoteGenerator() {
  const { user } = useAuth();
  const [category, setCategory] = useState<string>('motivation');
  const [style, setStyle] = useState<string>('bold');
  const [contentType, setContentType] = useState<'image' | 'video'>('image');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuote, setGeneratedQuote] = useState<GeneratedQuote | null>(null);
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isPosting, setIsPosting] = useState(false);

  // Load Instagram accounts
  useEffect(() => {
    async function loadInstagramAccounts() {
      if (!user) return;
      
      try {
        const accounts = await APIBook.instagramAccounts.list(user.uid);
        setInstagramAccounts(accounts);
        
        // Auto-select first account if available
        if (accounts.length > 0 && !selectedAccountId) {
          setSelectedAccountId(accounts[0].id);
        }
      } catch (error) {
        console.error('Failed to load Instagram accounts:', error);
      }
    }
    
    loadInstagramAccounts();
  }, [user, selectedAccountId]);

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
        toast.success("Quote Generated!", {
          description: "Your motivational quote has been created successfully.",
        });
      } else {
        throw new Error(result.error || 'Failed to generate quote');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error("Generation Failed", {
        description: error instanceof Error ? error.message : 'Failed to generate quote',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCaption = () => {
    if (generatedQuote) {
      navigator.clipboard.writeText(generatedQuote.caption);
      toast.success("Copied!", {
        description: "Caption copied to clipboard",
      });
    }
  };

  const handleDownload = () => {
    if (generatedQuote) {
      window.open(generatedQuote.mediaUrl, '_blank');
    }
  };

  const handlePost = async () => {
    if (!generatedQuote || !selectedAccountId) {
      toast.error('Please generate a quote and select an Instagram account');
      return;
    }

    setIsPosting(true);
    try {
      const response = await fetch('/api/instagram-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaUrl: generatedQuote.mediaUrl,
          caption: generatedQuote.caption,
          accountId: selectedAccountId,
          isVideo: generatedQuote.mediaType === 'video'
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Posted Successfully!', {
          description: 'Your motivational quote has been posted to Instagram.'
        });
      } else {
        throw new Error(result.error || 'Failed to post');
      }
    } catch (error) {
      console.error('Post error:', error);
      toast.error('Post Failed', {
        description: error instanceof Error ? error.message : 'Failed to post to Instagram'
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Generation Settings */}
      <Card>
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-lg sm:text-xl">Generate Motivational Quote</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Create a unique motivational quote with AI-generated image or video
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
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
                <SelectItem value="custom">Custom (Black Theme)</SelectItem>
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
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-lg sm:text-xl">Preview</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Generated quote preview and download
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!generatedQuote && !isGenerating && (
            <div className="flex items-center justify-center h-48 sm:h-64 border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">No quote generated yet</p>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center h-48 sm:h-64 border-2 border-dashed rounded-lg">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mb-3 sm:mb-4" />
              <p className="text-sm text-muted-foreground">Generating your quote...</p>
            </div>
          )}

          {generatedQuote && (
            <div className="space-y-3 sm:space-y-4">
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

              {/* Caption */}
              <div className="space-y-2">
                <Label className="text-sm">Caption for Instagram</Label>
                <Textarea 
                  value={generatedQuote.caption} 
                  readOnly 
                  rows={4}
                  className="text-xs sm:text-sm resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Caption includes: Title + Author + Hashtags (Quote is on the image)
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {/* Instagram Account Selection */}
                {instagramAccounts.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Post to Instagram Account</Label>
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select Instagram account" />
                      </SelectTrigger>
                      <SelectContent>
                        {instagramAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            @{account.username || account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleCopyCaption} variant="outline" className="flex-1 h-10" size="sm">
                    <Copy className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">Copy</span>
                  </Button>
                  <Button onClick={handleDownload} variant="outline" className="flex-1 h-10" size="sm">
                    <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">Download</span>
                  </Button>
                  {instagramAccounts.length > 0 && (
                    <Button 
                      onClick={handlePost} 
                      disabled={isPosting || !selectedAccountId}
                      className="flex-1 h-10"
                      size="sm"
                    >
                      {isPosting ? (
                        <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      ) : (
                        <Send className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                      <span className="text-xs sm:text-sm">{isPosting ? 'Posting...' : 'Post Now'}</span>
                    </Button>
                  )}
                </div>
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
