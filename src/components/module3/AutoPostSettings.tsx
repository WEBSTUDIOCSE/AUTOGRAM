'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Plus, X, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import type { AutoPostConfig, Character } from '@/lib/firebase/config/types';
import { APIBook } from '@/lib/firebase/services';
import { InstagramService, type InstagramAccount } from '@/lib/services/instagram.service';

interface TestResultDetails {
  character: string;
  promptTemplate: string;
  instagramAccount: string;
  totalCharacters: number;
  totalPrompts: number;
  postingTimes: string[];
  timezone: string;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: TestResultDetails;
}

interface AutoPostSettingsProps {
  userId: string;
  characters: Character[];
}

export default function AutoPostSettings({ userId, characters }: AutoPostSettingsProps) {
  const [config, setConfig] = useState<AutoPostConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Form state
  const [isEnabled, setIsEnabled] = useState(false);
  const [postingTimes, setPostingTimes] = useState<string[]>(['10:00', '18:00']);
  const [newTime, setNewTime] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [rotationStrategy, setRotationStrategy] = useState<'rotate' | 'random'>('rotate');
  const [minCharacters, setMinCharacters] = useState(3);

  const availableAccounts = InstagramService.getAccounts();

  useEffect(() => {
    loadConfig();
  }, [userId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const loadedConfig = await APIBook.autoPostConfig.getOrCreateConfig(userId);
      setConfig(loadedConfig);
      
      // Set form state from config
      setIsEnabled(loadedConfig.isEnabled);
      // Normalize all times to HH:mm format (zero-padded)
      const normalizedTimes = loadedConfig.postingTimes.map(time => {
        const [hours, minutes] = time.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      });
      setPostingTimes(normalizedTimes);
      setSelectedAccounts(loadedConfig.instagramAccounts);
      setRotationStrategy(loadedConfig.accountRotationStrategy);
      setMinCharacters(loadedConfig.minCharacters);
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
      if (postingTimes.length === 0) {
        throw new Error('Please add at least one posting time');
      }

      if (selectedAccounts.length === 0) {
        throw new Error('Please select at least one Instagram account');
      }

      // Update config
      await APIBook.autoPostConfig.updateConfig(userId, {
        isEnabled,
        postingTimes,
        instagramAccounts: selectedAccounts,
        accountRotationStrategy: rotationStrategy,
        minCharacters,
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
        // Check current form state before enabling
        if (selectedAccounts.length === 0) {
          setError('Please select at least one Instagram account');
          return;
        }

        if (postingTimes.length === 0) {
          setError('Please set at least one posting time');
          return;
        }

        if (characters.length === 0) {
          setError('Please upload at least one character to enable auto-posting');
          return;
        }

        // Save config first before enabling
        await APIBook.autoPostConfig.updateConfig(userId, {
          isEnabled: enabled,
          postingTimes,
          instagramAccounts: selectedAccounts,
          accountRotationStrategy: rotationStrategy,
          minCharacters,
        });

        setIsEnabled(enabled);
        setSuccess('Auto-posting enabled successfully!');
      } else {
        // Disable auto-posting
        await APIBook.autoPostConfig.disableAutoPosting(userId);
        setIsEnabled(enabled);
        setSuccess('Auto-posting disabled');
      }

      await loadConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update auto-posting status');
      setIsEnabled(!enabled); // Revert toggle on error
    }
  };

  const handleAddTime = () => {
    if (!newTime) return;
    
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(newTime)) {
      setError('Invalid time format. Use HH:mm (e.g., 14:30)');
      return;
    }

    // Normalize time to HH:mm format (zero-padded)
    const [hours, minutes] = newTime.split(':');
    const normalizedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;

    if (postingTimes.includes(normalizedTime)) {
      setError('This time is already added');
      return;
    }

    setPostingTimes([...postingTimes, normalizedTime]);
    setNewTime('');
    setError(null);
  };

  const handleRemoveTime = (time: string) => {
    setPostingTimes(postingTimes.filter((t) => t !== time));
  };

  const handleToggleAccount = (accountId: string) => {
    if (selectedAccounts.includes(accountId)) {
      setSelectedAccounts(selectedAccounts.filter((id) => id !== accountId));
    } else {
      setSelectedAccounts([...selectedAccounts, accountId]);
    }
  };

  const handleTestConfiguration = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      setError(null);

      const result = await APIBook.autoPostScheduler.testAutoPost(userId);
      setTestResult(result);
      
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  const getNextScheduledTime = () => {
    if (!config || !config.isEnabled) return null;
    return APIBook.autoPostScheduler.getNextScheduledTime(config);
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

  const nextPost = getNextScheduledTime();

  return (
    <div className="space-y-6">
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
                checked={isEnabled}
                onCheckedChange={handleToggleEnabled}
                disabled={saving}
              />
              <Label htmlFor="enabled-toggle">
                {isEnabled ? (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Inactive
                  </Badge>
                )}
              </Label>
            </div>
          </div>
        </CardHeader>
        {isEnabled && nextPost && (
          <CardContent>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Next post scheduled for: {nextPost.toLocaleString()}
              </span>
            </div>
          </CardContent>
        )}
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

      {/* Posting Times */}
      <Card>
        <CardHeader>
          <CardTitle>Posting Schedule</CardTitle>
          <CardDescription>
            Set the times when posts should be automatically published (use 24-hour format)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              placeholder="HH:mm"
            />
            <Button onClick={handleAddTime} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Time
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {postingTimes.map((time) => (
              <Badge key={time} variant="secondary" className="text-sm px-3 py-1">
                <Clock className="h-3 w-3 mr-1" />
                {time}
                <button
                  onClick={() => handleRemoveTime(time)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instagram Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Instagram Accounts</CardTitle>
          <CardDescription>
            Select which accounts to use for auto-posting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableAccounts.length === 0 ? (
            <Alert>
              <AlertDescription>
                No Instagram accounts configured. Please add accounts in your settings.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {availableAccounts.map((account) => {
                const isSelected = selectedAccounts.includes(account.id);
                return (
                  <div
                    key={account.id}
                    className={`flex items-center space-x-3 rounded-md border p-3 transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
                    }`}
                  >
                    <Switch
                      id={`account-${account.id}`}
                      checked={isSelected}
                      onCheckedChange={() => handleToggleAccount(account.id)}
                    />
                    {account.profilePictureUrl ? (
                      <img 
                        src={account.profilePictureUrl} 
                        alt={account.username}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {account.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <Label
                      htmlFor={`account-${account.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium leading-none flex items-center gap-1.5">
                            {account.name}
                            {account.isActive && (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {account.username !== 'main_account' && account.username !== 'secondary_account' 
                              ? `@${account.username}` 
                              : `ID: ${account.accountId}`
                            }
                          </p>
                        </div>
                        {isSelected && (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                    </Label>
                  </div>
                );
              })}
            </div>
          )}

          {selectedAccounts.length > 1 && (
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="rotation-strategy">Account Rotation Strategy</Label>
              <Select
                value={rotationStrategy}
                onValueChange={(value: 'rotate' | 'random') => setRotationStrategy(value)}
              >
                <SelectTrigger id="rotation-strategy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rotate">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Rotate Evenly</span>
                      <span className="text-xs text-muted-foreground">Each account gets equal posts</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="random">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Random Selection</span>
                      <span className="text-xs text-muted-foreground">Pick accounts randomly</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {rotationStrategy === 'rotate' 
                  ? 'Posts will be distributed evenly across all selected accounts'
                  : 'A random account will be selected for each post'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Configuration */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant={testResult.success ? 'default' : 'destructive'}>
              <AlertDescription>
                <p className="font-medium">{testResult.message}</p>
                {testResult.details && (
                  <div className="mt-2 space-y-1 text-sm">
                    <p>Character: {testResult.details.character}</p>
                    <p>Prompt: {testResult.details.promptTemplate}</p>
                    <p>Account: {testResult.details.instagramAccount}</p>
                    <p>Schedule: {testResult.details.postingTimes.join(', ')}</p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleSaveConfig}
          disabled={saving}
          className="flex-1"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>

        <Button
          onClick={handleTestConfiguration}
          disabled={testing}
          variant="outline"
          className="flex-1"
        >
          {testing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            'Test Configuration'
          )}
        </Button>
      </div>
    </div>
  );
}
