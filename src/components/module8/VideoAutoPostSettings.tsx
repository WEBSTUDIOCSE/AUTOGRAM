'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, Clock, Video, Film } from 'lucide-react';
import type { VideoAutoPostConfig, VideoPrompt } from '@/lib/firebase/config/types';
import { APIBook } from '@/lib/firebase/services';

interface VideoAutoPostSettingsProps {
  userId: string;
  textToVideoPrompts: VideoPrompt[];
  imageToVideoPrompts: VideoPrompt[];
}

export default function VideoAutoPostSettings({ 
  userId, 
  textToVideoPrompts,
  imageToVideoPrompts 
}: VideoAutoPostSettingsProps) {
  const [config, setConfig] = useState<VideoAutoPostConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [isEnabled, setIsEnabled] = useState(false);
  const [activeTextToVideoIds, setActiveTextToVideoIds] = useState<string[]>([]);
  const [activeImageToVideoIds, setActiveImageToVideoIds] = useState<string[]>([]);

  useEffect(() => {
    loadConfig();
  }, [userId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const loadedConfig = await APIBook.videoAutoPostConfig.getOrCreateConfig(userId);
      setConfig(loadedConfig);
      
      // Set form state from config
      setIsEnabled(loadedConfig.isEnabled);
      setActiveTextToVideoIds(loadedConfig.activeTextToVideoIds || []);
      setActiveImageToVideoIds(loadedConfig.activeImageToVideoIds || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validate
      const totalActive = activeTextToVideoIds.length + activeImageToVideoIds.length;
      if (totalActive === 0) {
        throw new Error('Please select at least one video prompt for auto-posting');
      }

      // Check if at least one active prompt has posting times
      const activePrompts = [
        ...textToVideoPrompts.filter(p => activeTextToVideoIds.includes(p.id)),
        ...imageToVideoPrompts.filter(p => activeImageToVideoIds.includes(p.id))
      ];
      const hasPostingTimes = activePrompts.some(p => p.postingTimes && p.postingTimes.length > 0);
      
      if (!hasPostingTimes) {
        throw new Error('At least one active prompt must have posting times configured.');
      }

      // Update config
      await APIBook.videoAutoPostConfig.updateConfig(userId, {
        isEnabled,
        activeTextToVideoIds,
        activeImageToVideoIds,
      });

      setSuccess('Settings saved successfully!');
      await loadConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async (enabled: boolean) => {
    try {
      setError(null);
      
      if (enabled) {
        const totalActive = activeTextToVideoIds.length + activeImageToVideoIds.length;
        if (totalActive === 0) {
          setError('Please select at least one video prompt for auto-posting');
          return;
        }

        const activePrompts = [
          ...textToVideoPrompts.filter(p => activeTextToVideoIds.includes(p.id)),
          ...imageToVideoPrompts.filter(p => activeImageToVideoIds.includes(p.id))
        ];
        const hasPostingTimes = activePrompts.some(p => p.postingTimes && p.postingTimes.length > 0);
        
        if (!hasPostingTimes) {
          setError('At least one active prompt must have posting times configured');
          return;
        }

        await APIBook.videoAutoPostConfig.updateConfig(userId, {
          isEnabled: enabled,
          activeTextToVideoIds,
          activeImageToVideoIds,
        });

        setIsEnabled(enabled);
        setSuccess('Video auto-posting enabled successfully!');
      } else {
        await APIBook.videoAutoPostConfig.disableAutoPosting(userId);
        setIsEnabled(enabled);
        setSuccess('Video auto-posting disabled');
      }

      await loadConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update auto-posting status');
      setIsEnabled(!enabled);
    }
  };

  const handleTogglePrompt = (promptId: string, videoType: 'text-to-video' | 'image-to-video') => {
    if (videoType === 'text-to-video') {
      if (activeTextToVideoIds.includes(promptId)) {
        setActiveTextToVideoIds(activeTextToVideoIds.filter(id => id !== promptId));
      } else {
        setActiveTextToVideoIds([...activeTextToVideoIds, promptId]);
      }
    } else {
      if (activeImageToVideoIds.includes(promptId)) {
        setActiveImageToVideoIds(activeImageToVideoIds.filter(id => id !== promptId));
      } else {
        setActiveImageToVideoIds([...activeImageToVideoIds, promptId]);
      }
    }
  };

  const renderPromptList = (prompts: VideoPrompt[], videoType: 'text-to-video' | 'image-to-video', icon: React.ReactNode) => {
    const activeIds = videoType === 'text-to-video' ? activeTextToVideoIds : activeImageToVideoIds;

    if (prompts.length === 0) {
      return (
        <Alert>
          {icon}
          <AlertDescription>
            No {videoType === 'text-to-video' ? 'text-to-video' : 'image-to-video'} prompts found. Create prompts in the Prompts tab first.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="grid gap-4">
        {prompts.map((prompt) => {
          const isActive = activeIds.includes(prompt.id);
          const hasPostingTimes = prompt.postingTimes && prompt.postingTimes.length > 0;
          
          return (
            <Card key={prompt.id} className={isActive ? 'border-primary' : ''}>
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
                    
                    {/* Posting Times */}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {hasPostingTimes ? (
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

                    {/* Usage Stats */}
                    <div className="text-xs text-muted-foreground">
                      Used {prompt.usageCount} times
                      {prompt.lastUsedAt && ` • Last: ${new Date(prompt.lastUsedAt).toLocaleDateString()}`}
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <Switch
                    checked={isActive}
                    onCheckedChange={() => handleTogglePrompt(prompt.id, videoType)}
                    disabled={!prompt.isActive || saving}
                  />
                </div>

                {!hasPostingTimes && (
                  <Alert className="mt-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      ⚠️ No posting times configured. Add times in the Prompts tab.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
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
      {/* Enable/Disable Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Video Auto-Posting Status</CardTitle>
              <CardDescription>
                Enable or disable automatic video posting to Instagram
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="auto-post-enabled" className="text-sm font-medium cursor-pointer">
                {isEnabled ? 'Enabled' : 'Disabled'}
              </Label>
              <Switch
                id="auto-post-enabled"
                checked={isEnabled}
                onCheckedChange={handleToggleEnabled}
                disabled={saving || loading}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {/* Text-to-Video Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Text-to-Video Auto-Posting
          </CardTitle>
          <CardDescription>
            Select text-to-video prompts for automatic generation and posting
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderPromptList(textToVideoPrompts, 'text-to-video', <Video className="h-4 w-4" />)}
        </CardContent>
      </Card>

      {/* Image-to-Video Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="h-5 w-5" />
            Image-to-Video Auto-Posting
          </CardTitle>
          <CardDescription>
            Select image-to-video prompts for automatic generation and posting
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderPromptList(imageToVideoPrompts, 'image-to-video', <Film className="h-4 w-4" />)}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSaveConfig}
          disabled={saving || loading || (activeTextToVideoIds.length === 0 && activeImageToVideoIds.length === 0)}
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
