'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Plus, Trash2, Sparkles, Wand2, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import type { FamilyProfile, FamilyPromptTemplate, FamilyPromptCategory } from '@/lib/services/module4';
import { FamilyPromptService, FamilyProfileService } from '@/lib/services/module4';
import { InstagramAccountSelector } from '@/components/module1/InstagramAccountSelector';
import GeneratedCharacterPreview from '@/components/module3/GeneratedCharacterPreview';
import { APIBook } from '@/lib/firebase/services';

interface FamilyAutoPostSettingsProps {
  profile: FamilyProfile;
  onBack: () => void;
}

/**
 * Convert Firebase Storage URL to base64 using server-side API
 * (avoids CORS issues in browser)
 */
async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch('/api/convert-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageUrl: url }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to convert image');
  }

  const data = await response.json();
  return data.imageBase64;
}

export function FamilyAutoPostSettings({ profile: initialProfile, onBack }: FamilyAutoPostSettingsProps) {
  const [profile, setProfile] = useState<FamilyProfile>(initialProfile);
  const [prompts, setPrompts] = useState<FamilyPromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Manual post state
  const [manualPrompt, setManualPrompt] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [selectedInstagramAccount, setSelectedInstagramAccount] = useState(profile.instagramAccountId);

  // Auto-post settings state
  const [isAutoPostEnabled, setIsAutoPostEnabled] = useState(false);
  const [newPostingTime, setNewPostingTime] = useState('09:00');
  const [isAddingTime, setIsAddingTime] = useState(false);

  // Prompt generation
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);

  useEffect(() => {
    loadData();
  }, [initialProfile.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [updatedProfile, promptsData] = await Promise.all([
        FamilyProfileService.getProfile(initialProfile.id),
        FamilyPromptService.getPrompts(initialProfile.userId, initialProfile.id),
      ]);
      
      if (updatedProfile) {
        setProfile(updatedProfile);
        setIsAutoPostEnabled(updatedProfile.isActive && (updatedProfile.postingTimes?.length || 0) > 0);
      }
      setPrompts(promptsData.filter((p) => p.isActive));
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const detectFamilyType = (): FamilyPromptCategory => {
    const members = profile.members;
    const roles = members.map(m => m.role);
    
    const hasPerson1 = roles.includes('person1');
    const hasPerson2 = roles.includes('person2');
    const hasKids = roles.includes('child');
    
    if ((hasPerson1 || hasPerson2) && !hasKids && members.length <= 2) {
      return 'couple';
    }
    
    if (hasKids && members.length === 1) {
      return 'kids';
    }
    
    return 'family';
  };

  const handleAutoGeneratePrompts = async () => {
    if (!confirm('This will generate default prompts based on your family type. Continue?')) {
      return;
    }

    setIsGeneratingPrompts(true);
    setError(null);
    try {
      const familyType = detectFamilyType();
      await FamilyPromptService.generateDefaultPrompts(profile.userId, profile.id, familyType);
      setSuccess(`Generated ${familyType} prompts successfully!`);
      await loadData();
    } catch (error) {
      console.error('Error generating prompts:', error);
      setError('Failed to generate prompts');
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const handleRefinePrompt = async () => {
    if (!manualPrompt.trim()) {
      setError('Please enter a prompt first');
      return;
    }

    setIsRefining(true);
    setError(null);
    try {
      const refinedPrompt = await APIBook.promptRefiner.refinePrompt(manualPrompt);
      setManualPrompt(refinedPrompt);
      setSuccess('Prompt refined successfully!');
    } catch (error) {
      console.error('Error refining prompt:', error);
      setError('Failed to refine prompt');
    } finally {
      setIsRefining(false);
    }
  };

  const handleGenerate = async () => {
    if (!manualPrompt.trim()) {
      setError('Please enter a prompt for the post');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      // Build family context with detailed descriptions
      const familyContext = profile.members.map(m => 
        `${m.name} (${m.role}${m.age ? `, ${m.age} years old` : ''}${m.gender ? `, ${m.gender}` : ''})`
      ).join(', ');

      // Check if we have at least one member with an image
      const membersWithImages = profile.members.filter(m => m.imageUrl);
      
      if (membersWithImages.length === 0) {
        // Fallback to regular image generation without reference images
        const fullPrompt = `${manualPrompt.trim()}. Family members: ${familyContext}`;
        const response = await APIBook.ai.generateImage(fullPrompt);
        
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to generate image');
        }
        
        const imageResult = response.data;
        setGeneratedImage(imageResult.imageBase64);
        setCaption(imageResult.caption || '');
        setHashtags(imageResult.hashtags || '');
        setSuccess('Image generated successfully!');
        return;
      }

      // Use the first member's image as the primary reference
      const primaryMember = membersWithImages[0];
      
      // Build enhanced scene prompt with family context
      const enhancedPrompt = `${manualPrompt.trim()}

Family Members Present:
${familyContext}

Important: Generate a photorealistic image showing ${membersWithImages.length > 1 ? 'these family members' : 'this person'} in the described scene. Maintain natural appearance, realistic lighting, and authentic setting.`;

      // Use stored imageBase64 if available, otherwise convert from imageUrl
      let memberImageBase64 = primaryMember.imageBase64 || '';
      
      if (!memberImageBase64 && primaryMember.imageUrl) {
        // Fallback: Convert imageUrl to base64 for older profiles
        try {
          console.log('Converting imageUrl to base64 (legacy profile)...');
          memberImageBase64 = await imageUrlToBase64(primaryMember.imageUrl);
        } catch (err) {
          console.error('Failed to convert member image:', err);
          throw new Error('Failed to load family member image. Please re-upload the member image in the profile settings.');
        }
      }
      
      if (!memberImageBase64) {
        throw new Error('No member image available. Please upload a member image in the profile settings.');
      }

      // Generate image with character AI service (maintains face consistency)
      const result = await APIBook.characterAI.generateWithCharacter(
        memberImageBase64,
        enhancedPrompt
      );
      
      setGeneratedImage(result.imageBase64);
      setCaption(result.caption || '');
      setHashtags(result.hashtags || '');
      setSuccess('Image generated successfully with family members!');
    } catch (error) {
      console.error('Error generating image:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `family-poster-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegenerate = () => {
    setGeneratedImage(null);
    handleGenerate();
  };

  const handlePostToInstagram = async () => {
    if (!generatedImage || !selectedInstagramAccount) {
      setError('Please generate an image and select an Instagram account');
      return;
    }

    setIsPosting(true);
    setError(null);
    try {
      // Extract base64 from data URL if needed
      const base64 = generatedImage.replace(/^data:image\/\w+;base64,/, '');
      
      // Upload to storage
      const imageUrl = await APIBook.storage.uploadImage(
        base64, 
        profile.userId, 
        'module3',
        'generated'
      );
      
      // Post to Instagram
      const instagramPostId = await APIBook.instagram.postImage(
        imageUrl,
        `${caption}\n\n${hashtags}`,
        selectedInstagramAccount
      );

      // Save to history
      await APIBook.characterPost.saveCharacterPost({
        userId: profile.userId,
        moduleType: 'module3',
        characterId: profile.id,
        characterName: profile.profileName,
        prompt: manualPrompt.trim(),
        generatedImageBase64: '',
        generatedImageUrl: imageUrl,
        caption: caption,
        hashtags: hashtags,
        instagramAccountId: selectedInstagramAccount,
        instagramAccountName: profile.instagramAccountName,
        postedToInstagram: true,
        instagramPostId: instagramPostId,
        model: 'gemini-1.5',
        timestamp: new Date().toISOString(),
      });

      setSuccess('Posted to Instagram successfully!');
      
      // Reset form
      setGeneratedImage(null);
      setManualPrompt('');
      setCaption('');
      setHashtags('');
    } catch (error) {
      console.error('Error posting:', error);
      setError(error instanceof Error ? error.message : 'Failed to post to Instagram');
    } finally {
      setIsPosting(false);
    }
  };

  const handleToggleAutoPost = async (enabled: boolean) => {
    try {
      setError(null);
      
      if (enabled) {
        if (!profile.postingTimes || profile.postingTimes.length === 0) {
          setError('Please add at least one posting time first');
          return;
        }
        
        if (prompts.length === 0) {
          setError('Please generate or create prompts first');
          return;
        }
        
        // Enable profile
        await FamilyProfileService.updateProfile(profile.id, { isActive: true });
        setSuccess('Auto-posting enabled successfully!');
      } else {
        // Disable profile
        await FamilyProfileService.updateProfile(profile.id, { isActive: false });
        setSuccess('Auto-posting disabled');
      }
      
      setIsAutoPostEnabled(enabled);
      await loadData();
    } catch (error) {
      console.error('Error toggling auto-post:', error);
      setError('Failed to update auto-posting status');
      setIsAutoPostEnabled(!enabled);
    }
  };

  const handleAddPostingTime = async () => {
    if (!newPostingTime) {
      setError('Please select a time');
      return;
    }

    if (profile.postingTimes?.includes(newPostingTime)) {
      setError('This time is already added');
      return;
    }

    setIsAddingTime(true);
    setError(null);
    try {
      const updatedTimes = [...(profile.postingTimes || []), newPostingTime].sort();
      await FamilyProfileService.updateProfile(profile.id, { postingTimes: updatedTimes });
      setSuccess('Posting time added successfully!');
      setNewPostingTime('09:00');
      await loadData();
    } catch (error) {
      console.error('Error adding posting time:', error);
      setError('Failed to add posting time');
    } finally {
      setIsAddingTime(false);
    }
  };

  const handleRemovePostingTime = async (time: string) => {
    if (!confirm(`Remove posting time ${time}?`)) {
      return;
    }

    try {
      setError(null);
      const updatedTimes = (profile.postingTimes || []).filter(t => t !== time);
      await FamilyProfileService.updateProfile(profile.id, { postingTimes: updatedTimes });
      setSuccess('Posting time removed successfully!');
      await loadData();
    } catch (error) {
      console.error('Error removing posting time:', error);
      setError('Failed to remove posting time');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{profile.profileName}</CardTitle>
              <CardDescription>
                Manual posting and auto-post schedule management
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Post</TabsTrigger>
          <TabsTrigger value="settings">Auto-Post Settings</TabsTrigger>
        </TabsList>

        {/* Manual Post Tab */}
        <TabsContent value="manual" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column - Input */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create Content</CardTitle>
                  <CardDescription>
                    Generate and post family content to Instagram
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Enter Your Prompt</Label>
                    <Textarea
                      placeholder="e.g., Family having dinner together, Couple walking in the park..."
                      value={manualPrompt}
                      onChange={(e) => setManualPrompt(e.target.value)}
                      disabled={isPosting || isRefining || isGenerating}
                      rows={4}
                    />
                    <p className="text-sm text-muted-foreground">
                      Family context will be automatically added: {profile.members.map(m => m.name).join(', ')}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleRefinePrompt}
                      disabled={!manualPrompt.trim() || isPosting || isRefining || isGenerating}
                      variant="outline"
                      className="flex-1"
                    >
                      {isRefining ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                      disabled={!manualPrompt.trim() || isPosting || isRefining || isGenerating}
                      className="flex-1"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Image
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Preview & Post */}
            <div className="space-y-6">
              <GeneratedCharacterPreview
                imageBase64={generatedImage}
                isLoading={isGenerating}
                onDownload={handleDownload}
                onRegenerate={handleRegenerate}
                disabled={isGenerating || isPosting}
              />

              {/* Instagram Posting Section */}
              {generatedImage && (
                <Card>
                  <CardHeader>
                    <CardTitle>Post to Instagram</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="caption">Caption</Label>
                      <Textarea
                        id="caption"
                        placeholder="Enter caption..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        disabled={isPosting}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hashtags">Hashtags</Label>
                      <Input
                        id="hashtags"
                        placeholder="Enter hashtags..."
                        value={hashtags}
                        onChange={(e) => setHashtags(e.target.value)}
                        disabled={isPosting}
                      />
                    </div>

                    <InstagramAccountSelector
                      selectedAccountId={selectedInstagramAccount}
                      onSelectAccount={setSelectedInstagramAccount}
                    />

                    <Button
                      onClick={handlePostToInstagram}
                      disabled={!selectedInstagramAccount || isPosting}
                      className="w-full"
                    >
                      {isPosting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        'Post to Instagram'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Auto-Post Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Enable/Disable Toggle */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Auto-Posting Status</CardTitle>
                  <CardDescription>
                    Enable or disable automatic Instagram posting
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isAutoPostEnabled}
                    onCheckedChange={handleToggleAutoPost}
                  />
                  <Label>
                    {isAutoPostEnabled ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </Label>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* No prompts - Generate first */}
          {prompts.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No prompts available</h3>
                <p className="mb-6 text-center text-sm text-muted-foreground">
                  Generate prompts to set up auto-posting
                </p>
                <Button onClick={handleAutoGeneratePrompts} disabled={isGeneratingPrompts}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  {isGeneratingPrompts ? 'Generating...' : 'Auto-Generate Prompts'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Posting Times Management */}
          {prompts.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Posting Schedule</CardTitle>
                    <CardDescription>
                      Set specific times when content should be posted automatically
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Posting Time */}
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label>Add Posting Time</Label>
                    <Input
                      type="time"
                      value={newPostingTime}
                      onChange={(e) => setNewPostingTime(e.target.value)}
                      disabled={isAddingTime}
                    />
                  </div>
                  <Button onClick={handleAddPostingTime} disabled={isAddingTime}>
                    {isAddingTime ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Time
                      </>
                    )}
                  </Button>
                </div>

                {/* Posting Times List */}
                <div className="space-y-2">
                  <Label>Active Posting Times ({profile.postingTimes?.length || 0})</Label>
                  {(!profile.postingTimes || profile.postingTimes.length === 0) ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                      <Clock className="mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium">No posting times set</p>
                      <p className="text-xs text-muted-foreground">
                        Add at least one time to enable auto-posting
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.postingTimes.map((time) => (
                        <Badge
                          key={time}
                          variant="outline"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
                        >
                          <Clock className="h-3 w-3" />
                          {time}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => handleRemovePostingTime(time)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info Box */}
                <Alert>
                  <AlertDescription>
                    <p className="text-sm">
                      <strong>How it works:</strong> Firebase Functions will automatically trigger at the specified times.
                      A random prompt will be selected, family context will be added, and the generated image will be posted to Instagram.
                    </p>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
