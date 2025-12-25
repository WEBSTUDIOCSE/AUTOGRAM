'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Video, Film, Plus, Edit, Trash, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TimePicker } from "@/components/ui/time-picker";
import type { VideoPrompt, Character } from '@/lib/firebase/config/types';
import VideoAutoPostSettings from "@/components/module8/VideoAutoPostSettings";
import VideoAutoPostHistory from "@/components/module8/VideoAutoPostHistory";
import { useAuth } from "@/contexts/AuthContext";
import { APIBook } from "@/lib/firebase/services";
import { InstagramService } from "@/lib/services/instagram.service";
import type { InstagramAccount } from "@/lib/firebase/config/types";

export default function VideoAutoPosterPage() {
  const { user } = useAuth();

  // Prompt management
  const [textToVideoPrompts, setTextToVideoPrompts] = useState<VideoPrompt[]>([]);
  const [imageToVideoPrompts, setImageToVideoPrompts] = useState<VideoPrompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const [availableAccounts, setAvailableAccounts] = useState<InstagramAccount[]>([]);

  // Create/Edit Prompt Dialog
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<VideoPrompt | null>(null);
  const [promptForm, setPromptForm] = useState({
    videoType: 'text-to-video' as 'text-to-video' | 'image-to-video',
    basePrompt: '',
    characterId: '',
    assignedAccountId: '',
    postingTimes: [] as string[],
    category: '',
  });
  const [newPostingTime, setNewPostingTime] = useState('10:00');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);

  // Characters for image-to-video
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    if (user) {
      loadPrompts();
      loadCharacters();
      loadInstagramAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadInstagramAccounts = async () => {
    try {
      const accounts = await InstagramService.fetchAccountsWithUsernames();
      setAvailableAccounts(accounts);
    } catch (err) {
      console.error('Failed to load Instagram accounts:', err);
    }
  };

  const loadPrompts = async () => {
    if (!user) return;
    
    try {
      setLoadingPrompts(true);
      const loadedPrompts = await APIBook.videoPromptLibrary.getUserPrompts(user.uid);
      
      // Separate by type
      setTextToVideoPrompts(loadedPrompts.filter(p => p.videoType === 'text-to-video'));
      setImageToVideoPrompts(loadedPrompts.filter(p => p.videoType === 'image-to-video'));
    } catch (err) {
      console.error('Failed to load video prompts:', err);
    } finally {
      setLoadingPrompts(false);
    }
  };

  const loadCharacters = async () => {
    if (!user) return;
    
    try {
      // Get Module 7 characters (image-to-video)
      const module7Characters = await APIBook.character.getCharactersByModule(user.uid, 'module7');
      setCharacters(module7Characters);
    } catch (err) {
      console.error('Failed to load characters:', err);
    }
  };

  const handleCreatePrompt = (videoType: 'text-to-video' | 'image-to-video') => {
    setEditingPrompt(null);
    setPromptForm({
      videoType,
      basePrompt: '',
      characterId: '',
      assignedAccountId: availableAccounts.length > 0 ? availableAccounts[0].id : '',
      postingTimes: [],
      category: '',
    });
    setNewPostingTime('10:00');
    setPromptError(null);
    setUploadedImage(null);
    setUploadedImageUrl(null);
    setShowPromptDialog(true);
  };

  const handleEditPrompt = (prompt: VideoPrompt) => {
    setEditingPrompt(prompt);
    setPromptForm({
      videoType: prompt.videoType,
      basePrompt: prompt.basePrompt,
      characterId: prompt.characterId || '',
      assignedAccountId: prompt.assignedAccountId,
      postingTimes: prompt.postingTimes || [],
      category: prompt.category || '',
    });
    setNewPostingTime('10:00');
    setPromptError(null);
    setUploadedImage(null);
    setUploadedImageUrl(null);
    setShowPromptDialog(true);
  };

  const handleSavePrompt = async () => {
    try {
      setSavingPrompt(true);
      setPromptError(null);

      // Validation
      if (!promptForm.basePrompt.trim()) {
        throw new Error('Video prompt is required');
      }
      if (promptForm.videoType === 'image-to-video' && !promptForm.characterId && !uploadedImage) {
        throw new Error('Either select a character or upload an image for image-to-video prompts');
      }
      if (promptForm.postingTimes.length === 0) {
        throw new Error('At least one posting time is required');
      }

      // Get character name for image-to-video
      const characterName = promptForm.videoType === 'image-to-video' && promptForm.characterId
        ? characters.find(c => c.id === promptForm.characterId)?.name
        : undefined;

      if (editingPrompt) {
        // Update existing prompt
        const updateData: Record<string, unknown> = {
          videoType: promptForm.videoType,
          basePrompt: promptForm.basePrompt,
          assignedAccountId: promptForm.assignedAccountId,
          postingTimes: promptForm.postingTimes,
        };

        // Only include optional fields if they have values
        if (promptForm.characterId) {
          updateData.characterId = promptForm.characterId;
        }
        if (characterName) {
          updateData.characterName = characterName;
        }
        if (promptForm.category) {
          updateData.category = promptForm.category;
        }

        await APIBook.videoPromptLibrary.updatePrompt(
          editingPrompt.id, 
          updateData as Partial<VideoPrompt>
        );
      } else {
        // Create new prompt
        const createData: Record<string, unknown> = {
          userId: user!.uid,
          videoType: promptForm.videoType,
          basePrompt: promptForm.basePrompt,
          assignedAccountId: promptForm.assignedAccountId,
          postingTimes: promptForm.postingTimes,
          usageCount: 0,
          lastUsedAt: null,
          isActive: true,
        };

        // Only include optional fields if they have values
        if (promptForm.characterId) {
          createData.characterId = promptForm.characterId;
        }
        if (characterName) {
          createData.characterName = characterName;
        }
        if (promptForm.category) {
          createData.category = promptForm.category;
        }

        await APIBook.videoPromptLibrary.createPrompt(
          createData as Omit<VideoPrompt, 'id' | 'createdAt' | 'updatedAt'>
        );
      }

      await loadPrompts();
      setShowPromptDialog(false);
    } catch (err) {
      setPromptError(err instanceof Error ? err.message : 'Failed to save prompt');
    } finally {
      setSavingPrompt(false);
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    try {
      await APIBook.videoPromptLibrary.deletePrompt(promptId);
      await loadPrompts();
    } catch (err) {
      console.error('Failed to delete prompt:', err);
    }
  };

  const handleAddPostingTime = () => {
    if (!newPostingTime) return;
    if (promptForm.postingTimes.includes(newPostingTime)) {
      setPromptError('This time is already added');
      return;
    }

    setPromptForm({
      ...promptForm,
      postingTimes: [...promptForm.postingTimes, newPostingTime].sort(),
    });
    setPromptError(null);
  };

  const handleRemovePostingTime = (time: string) => {
    setPromptForm({
      ...promptForm,
      postingTimes: promptForm.postingTimes.filter(t => t !== time),
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderPromptList = (promptList: VideoPrompt[], videoType: 'text-to-video' | 'image-to-video', icon: React.ReactNode) => {
    if (promptList.length === 0) {
      return (
        <Alert>
          {icon}
          <AlertDescription>
            No {videoType === 'text-to-video' ? 'text-to-video' : 'image-to-video'} prompts yet. Create your first prompt to start automating video posts.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="grid gap-4">
        {promptList.map((prompt) => (
          <Card key={prompt.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {prompt.characterName && (
                      <Badge variant="secondary">{prompt.characterName}</Badge>
                    )}
                    {!prompt.isActive && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {prompt.basePrompt}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {prompt.postingTimes && prompt.postingTimes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {prompt.postingTimes.map((time, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {time}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No posting times</span>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Used {prompt.usageCount} times
                    {prompt.lastUsedAt && ` • Last: ${new Date(prompt.lastUsedAt).toLocaleDateString()}`}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPrompt(prompt)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePrompt(prompt.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert>
              <AlertDescription>Please log in to access the Video Auto Poster.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Video Auto Poster</h1>
        <p className="text-muted-foreground">
          Automate video generation and Instagram posting with AI-powered prompt variations
        </p>
      </div>

      <Tabs defaultValue="prompts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prompts">Video Prompts</TabsTrigger>
          <TabsTrigger value="settings">Auto-Post Settings</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Video Prompts Tab */}
        <TabsContent value="prompts" className="space-y-6">
          {/* Text-to-Video Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Text-to-Video Prompts
                  </CardTitle>
                  <CardDescription>
                    Create base prompts for automated text-to-video generation
                  </CardDescription>
                </div>
                <Button onClick={() => handleCreatePrompt('text-to-video')}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Text-to-Video
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPrompts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                renderPromptList(textToVideoPrompts, 'text-to-video', <Video className="h-4 w-4" />)
              )}
            </CardContent>
          </Card>

          {/* Image-to-Video Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Film className="h-5 w-5" />
                    Image-to-Video Prompts
                  </CardTitle>
                  <CardDescription>
                    Create base prompts for automated image-to-video generation with characters
                  </CardDescription>
                </div>
                <Button onClick={() => handleCreatePrompt('image-to-video')}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Image-to-Video
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPrompts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                renderPromptList(imageToVideoPrompts, 'image-to-video', <Film className="h-4 w-4" />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto-Post Settings Tab */}
        <TabsContent value="settings">
          <VideoAutoPostSettings 
            userId={user.uid} 
            textToVideoPrompts={textToVideoPrompts}
            imageToVideoPrompts={imageToVideoPrompts}
          />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <VideoAutoPostHistory userId={user.uid} />
        </TabsContent>
      </Tabs>

      {/* Prompt Create/Edit Dialog */}
      <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPrompt ? 'Edit Video Prompt' : 'Create Video Prompt'}
            </DialogTitle>
            <DialogDescription>
              Configure your video prompt for automated posting. AI will generate variations of this base prompt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {promptError && (
              <Alert variant="destructive">
                <AlertDescription>{promptError}</AlertDescription>
              </Alert>
            )}

            {/* Video Type */}
            <div className="space-y-2">
              <Label htmlFor="video-type">Video Type *</Label>
              <Select
                value={promptForm.videoType}
                onValueChange={(value: 'text-to-video' | 'image-to-video') => 
                  setPromptForm({ ...promptForm, videoType: value, characterId: '' })
                }
                disabled={!!editingPrompt}
              >
                <SelectTrigger id="video-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text-to-video">Text-to-Video</SelectItem>
                  <SelectItem value="image-to-video">Image-to-Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Character or Image Upload (for image-to-video) */}
            {promptForm.videoType === 'image-to-video' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="character">Character (Option 1)</Label>
                  <Select
                    value={promptForm.characterId}
                    onValueChange={(value) => setPromptForm({ ...promptForm, characterId: value })}
                  >
                    <SelectTrigger id="character">
                      <SelectValue placeholder="Select a character" />
                    </SelectTrigger>
                    <SelectContent>
                      {characters.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No characters found. Upload characters in Module 7 first.
                        </div>
                      ) : (
                        characters.map((char) => (
                          <SelectItem key={char.id} value={char.id}>
                            {char.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select a saved character from Module 7
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-sm text-muted-foreground">OR</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image-upload">Upload New Image (Option 2)</Label>
                  <div className="flex flex-col gap-2">
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    {uploadedImageUrl && (
                      <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={uploadedImageUrl} 
                          alt="Uploaded preview" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload a new image directly for this prompt
                  </p>
                </div>
              </>
            )}

            {/* Video Prompt */}
            <div className="space-y-2">
              <Label htmlFor="base-prompt">Base Video Prompt *</Label>
              <Textarea
                id="base-prompt"
                placeholder="Describe the video style and content. AI will create unique variations based on this..."
                rows={4}
                value={promptForm.basePrompt}
                onChange={(e) => setPromptForm({ ...promptForm, basePrompt: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                This base prompt will be used to generate unique variations automatically
              </p>
            </div>

            {/* Category (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <Input
                id="category"
                placeholder="e.g., nature, urban, lifestyle"
                value={promptForm.category}
                onChange={(e) => setPromptForm({ ...promptForm, category: e.target.value })}
              />
            </div>

            {/* Instagram Account */}
            <div className="space-y-2">
              <Label htmlFor="instagram-account">Instagram Account *</Label>
              <Select
                value={promptForm.assignedAccountId}
                onValueChange={(value) => setPromptForm({ ...promptForm, assignedAccountId: value })}
              >
                <SelectTrigger id="instagram-account">
                  <SelectValue placeholder="Select Instagram account" />
                </SelectTrigger>
                <SelectContent>
                  {availableAccounts.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No Instagram accounts configured
                    </div>
                  ) : (
                    availableAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} (@{account.username})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Posting Times */}
            <div className="space-y-2">
              <Label>Posting Times *</Label>
              <div className="flex gap-2">
                <TimePicker
                  value={newPostingTime}
                  onChange={setNewPostingTime}
                />
                <Button type="button" onClick={handleAddPostingTime}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {promptForm.postingTimes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {promptForm.postingTimes.map((time) => (
                    <Badge 
                      key={time} 
                      variant="secondary" 
                      className="cursor-pointer" 
                      onClick={() => handleRemovePostingTime(time)}
                    >
                      {time} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPromptDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePrompt} disabled={savingPrompt}>
              {savingPrompt && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPrompt ? 'Update' : 'Create'} Prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
