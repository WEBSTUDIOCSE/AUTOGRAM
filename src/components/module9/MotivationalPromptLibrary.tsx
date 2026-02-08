'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Edit, Sparkles, Image, Video } from 'lucide-react';
import { toast } from 'sonner';
import { APIBook } from '@/lib/firebase/services';
import { useAuth } from '@/contexts/AuthContext';
import type { MotivationalPrompt } from '@/lib/services/module9/motivational-prompt-library.service';

const CATEGORIES = ['success', 'mindset', 'motivation', 'inspiration', 'life', 'wisdom', 'mixed'];
const CONTENT_TYPES = ['image', 'video'];
const VISUAL_STYLES = ['modern', 'minimalist', 'vibrant', 'elegant', 'bold', 'serene'];

// Time options for posting (24-hour format)
const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

export function MotivationalPromptLibrary() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [prompts, setPrompts] = React.useState<MotivationalPrompt[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingPrompt, setEditingPrompt] = React.useState<MotivationalPrompt | null>(null);
  const [instagramAccounts, setInstagramAccounts] = React.useState<any[]>([]);

  // Form state
  const [category, setCategory] = React.useState<string>('motivation');
  const [themeDescription, setThemeDescription] = React.useState('');
  const [contentType, setContentType] = React.useState<'image' | 'video'>('image');
  const [style, setStyle] = React.useState('modern');
  const [assignedAccountId, setAssignedAccountId] = React.useState('');
  const [postingTimes, setPostingTimes] = React.useState<string[]>([]);
  const [selectedTime, setSelectedTime] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const promptsData = await APIBook.motivationalPromptLibrary.getUserPrompts(user.uid);
      const accountsData = APIBook.instagram.getAccounts();
      setPrompts(promptsData);
      setInstagramAccounts(accountsData);
    } catch (error) {
      toast.error('Failed to load prompt library');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (prompt?: MotivationalPrompt) => {
    if (prompt) {
      setEditingPrompt(prompt);
      setCategory(prompt.category);
      setThemeDescription(prompt.themeDescription);
      // Handle 'both' type by defaulting to 'image'
      setContentType(prompt.contentType === 'both' ? 'image' : prompt.contentType);
      setStyle(prompt.style);
      setAssignedAccountId(prompt.assignedAccountId || '');
      setPostingTimes(prompt.postingTimes || []);
    } else {
      setEditingPrompt(null);
      setCategory('motivation');
      setThemeDescription('');
      setContentType('image');
      setStyle('modern');
      setAssignedAccountId('');
      setPostingTimes([]);
    }
    setSelectedTime('');
    setDialogOpen(true);
  };

  const handleAddPostingTime = () => {
    if (selectedTime && !postingTimes.includes(selectedTime)) {
      setPostingTimes([...postingTimes, selectedTime].sort());
      setSelectedTime('');
    }
  };

  const handleRemovePostingTime = (timeToRemove: string) => {
    setPostingTimes(postingTimes.filter(time => time !== timeToRemove));
  };

  const handleSavePrompt = async () => {
    if (!themeDescription.trim()) {
      toast.error('Please provide a theme description');
      return;
    }

    if (!assignedAccountId) {
      toast.error('Please select an Instagram account');
      return;
    }

    if (postingTimes.length === 0) {
      toast.error('Please add at least one posting time');
      return;
    }

    try {
      setSaving(true);
      
      if (editingPrompt) {
        await APIBook.motivationalPromptLibrary.updatePrompt(editingPrompt.id, {
          category,
          themeDescription: themeDescription.trim(),
          contentType,
          style,
          assignedAccountId,
          postingTimes,
        });
        toast.success('Prompt updated successfully');
      } else {
        await APIBook.motivationalPromptLibrary.createPrompt({
          userId: user!.uid,
          category,
          themeDescription: themeDescription.trim(),
          contentType,
          style,
          postingTimes,
          assignedAccountId,
          isActive: true,
          usageCount: 0,
          lastUsedAt: null,
        });
        toast.success('Prompt created successfully');
      }

      setDialogOpen(false);
      await loadData();
    } catch (error) {
      toast.error('Failed to save prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) {
      return;
    }

    try {
      await APIBook.motivationalPromptLibrary.deletePrompt(promptId);
      toast.success('Prompt deleted successfully');
      await loadData();
    } catch (error) {
      toast.error('Failed to delete prompt');
    }
  };

  const getAccountName = (accountId: string) => {
    const account = instagramAccounts.find((acc) => acc.id === accountId);
    return account?.username || 'Unknown';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Prompt Library
            </CardTitle>
            <CardDescription>
              Create and manage prompts for automatic motivational quote generation
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Prompt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
                </DialogTitle>
                <DialogDescription>
                  Configure the theme and style for automatic quote generation
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Category Selection */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-base font-semibold">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category" className="h-11">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Choose the main category for the quotes</p>
                </div>

                {/* Theme Description */}
                <div className="space-y-2">
                  <Label htmlFor="theme" className="text-base font-semibold">Theme Description</Label>
                  <Textarea
                    id="theme"
                    placeholder="e.g., 'Overcoming challenges and building resilience in daily life'"
                    value={themeDescription}
                    onChange={(e) => setThemeDescription(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">Describe the specific theme or focus for quote generation</p>
                </div>

                {/* Content Settings */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Content Settings</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="content-type" className="text-sm">Content Type</Label>
                      <Select
                        value={contentType}
                        onValueChange={(value) => setContentType(value as 'image' | 'video')}
                      >
                        <SelectTrigger id="content-type" className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="image">
                            <div className="flex items-center gap-2">
                              <Image className="h-4 w-4" />
                              <span>Image Post</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="video">
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4" />
                              <span>Video Post</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="style" className="text-sm">Visual Style</Label>
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger id="style" className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VISUAL_STYLES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Instagram Account */}
                <div className="space-y-2">
                  <Label htmlFor="account" className="text-base font-semibold">Instagram Account</Label>
                  <Select value={assignedAccountId} onValueChange={setAssignedAccountId}>
                    <SelectTrigger id="account" className="h-11">
                      <SelectValue placeholder="Select an Instagram account" />
                    </SelectTrigger>
                    <SelectContent>
                      {instagramAccounts.length === 0 ? (
                        <SelectItem value="no-accounts" disabled>No accounts connected</SelectItem>
                      ) : (
                        instagramAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">@{account.username}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Choose which account to post from</p>
                </div>

                {/* Posting Schedule */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Posting Schedule (IST)</Label>
                  <div className="flex gap-2">
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger className="flex-1 h-11">
                        <SelectValue placeholder="Select posting time" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {TIME_OPTIONS.filter(time => !postingTimes.includes(time)).map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddPostingTime}
                      disabled={!selectedTime}
                      className="h-11 px-4"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  
                  {postingTimes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 p-3 bg-muted rounded-md">
                      {postingTimes.map((time) => (
                        <Badge key={time} variant="secondary" className="text-sm py-1.5 px-3">
                          🕐 {time}
                          <button
                            type="button"
                            onClick={() => handleRemovePostingTime(time)}
                            className="ml-2 hover:text-destructive font-bold text-base"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Add times when quotes should be posted automatically (India Standard Time)
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSavePrompt} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingPrompt ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {prompts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No prompts created yet. Add your first prompt to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {prompts.map((prompt) => (
              <Card key={prompt.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Category and Status */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="font-medium">
                          {prompt.category.charAt(0).toUpperCase() + prompt.category.slice(1)}
                        </Badge>
                        <Badge variant="outline">
                          {prompt.contentType === 'image' ? (
                            <Image className="h-3 w-3 mr-1" />
                          ) : (
                            <Video className="h-3 w-3 mr-1" />
                          )}
                          {prompt.contentType.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{prompt.style}</Badge>
                        {prompt.isActive && <Badge className="bg-green-500">Active</Badge>}
                      </div>

                      {/* Theme */}
                      <div>
                        <p className="text-sm font-medium text-foreground">{prompt.themeDescription}</p>
                      </div>

                      {/* Account Info */}
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-muted-foreground">Account:</span>
                        <span className="font-medium text-primary">
                          @{getAccountName(prompt.assignedAccountId || '')}
                        </span>
                      </div>

                      {/* Posting Schedule */}
                      {prompt.postingTimes && prompt.postingTimes.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">Posting Times (IST):</p>
                          <div className="flex flex-wrap gap-1.5">
                            {prompt.postingTimes.map((time, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs font-mono">
                                🕐 {time}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Used {prompt.usageCount || 0} times</span>
                        <span>•</span>
                        <span>Created {prompt.createdAt?.toDate ? prompt.createdAt.toDate().toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-start gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(prompt)}
                        title="Edit prompt"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePrompt(prompt.id)}
                        title="Delete prompt"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
