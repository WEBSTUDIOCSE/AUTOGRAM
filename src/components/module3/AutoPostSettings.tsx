'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import type { AutoPostConfig, Character } from '@/lib/firebase/config/types';
import { APIBook } from '@/lib/firebase/services';
import { InstagramService, type InstagramAccount } from '@/lib/services/instagram.service';

interface AutoPostSettingsProps {
  userId: string;
  characters: Character[];
}

export default function AutoPostSettings({ userId, characters }: AutoPostSettingsProps) {
  const [config, setConfig] = useState<AutoPostConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [isEnabled, setIsEnabled] = useState(false);
  const [activeCharacterIds, setActiveCharacterIds] = useState<string[]>([]);
  const [minCharacters, setMinCharacters] = useState(1);
  const [availableAccounts, setAvailableAccounts] = useState<InstagramAccount[]>([]);

  useEffect(() => {
    loadConfig();
    loadInstagramAccounts();
  }, [userId]);

  const loadInstagramAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const accounts = InstagramService.getAccounts();
      
      // Fetch real usernames from Instagram API
      const accountsWithUsernames = await Promise.all(
        accounts.map(async (account) => {
          try {
            const response = await fetch(
              `https://graph.facebook.com/v18.0/${account.accountId}?fields=username,name&access_token=${account.accessToken}`
            );
            const data = await response.json();
            
            return {
              ...account,
              username: data.username || account.username,
              name: data.name || account.name
            };
          } catch (err) {
            console.error(`Failed to fetch username for account ${account.accountId}:`, err);
            return account;
          }
        })
      );
      
      setAvailableAccounts(accountsWithUsernames);
    } catch (err) {
      console.error('Failed to load Instagram accounts:', err);
      setAvailableAccounts(InstagramService.getAccounts());
    } finally {
      setLoadingAccounts(false);
    }
  };

  const loadConfig = async () => {
    try {
      setLoading(true);
      const loadedConfig = await APIBook.autoPostConfig.getOrCreateConfig(userId);
      setConfig(loadedConfig);
      
      // Set form state from config
      setIsEnabled(loadedConfig.isEnabled);
      setActiveCharacterIds(loadedConfig.activeCharacterIds || []);
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
      if (activeCharacterIds.length === 0) {
        throw new Error('Please select at least one character for auto-posting');
      }

      // Check if at least one active character has posting times
      const activeChars = characters.filter(char => activeCharacterIds.includes(char.id));
      const hasPostingTimes = activeChars.some(char => char.postingTimes && char.postingTimes.length > 0);
      
      if (!hasPostingTimes) {
        throw new Error('At least one active character must have posting times configured. Edit character to set posting times.');
      }

      // Update config
      await APIBook.autoPostConfig.updateConfig(userId, {
        isEnabled,
        activeCharacterIds,
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
        if (activeCharacterIds.length === 0) {
          setError('Please select at least one character for auto-posting');
          return;
        }

        // Check if at least one active character has posting times
        const activeChars = characters.filter(char => activeCharacterIds.includes(char.id));
        const hasPostingTimes = activeChars.some(char => char.postingTimes && char.postingTimes.length > 0);
        
        if (!hasPostingTimes) {
          setError('At least one active character must have posting times configured');
          return;
        }

        // Save config first before enabling
        await APIBook.autoPostConfig.updateConfig(userId, {
          isEnabled: enabled,
          activeCharacterIds,
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

  const handleToggleCharacter = (characterId: string) => {
    if (activeCharacterIds.includes(characterId)) {
      setActiveCharacterIds(activeCharacterIds.filter((id: string) => id !== characterId));
    } else {
      setActiveCharacterIds([...activeCharacterIds, characterId]);
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

      {/* Active Characters */}
      <Card>
        <CardHeader>
          <CardTitle>Active Characters</CardTitle>
          <CardDescription>
            Select which characters to enable for auto-posting. Each character has its own posting schedule.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {characters.length === 0 ? (
            <Alert>
              <AlertDescription>
                No characters uploaded yet. Please upload characters and assign them to Instagram accounts.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {characters.map((character) => {
                const isActive = activeCharacterIds.includes(character.id);
                const assignedAccount = availableAccounts.find((acc) => acc.accountId === character.assignedAccountId);
                const hasPostingTimes = character.postingTimes && character.postingTimes.length > 0;
                
                return (
                  <div
                    key={character.id}
                    className={`flex items-center space-x-3 rounded-md border p-3 transition-colors ${
                      isActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
                    }`}
                  >
                    <Switch
                      id={`character-${character.id}`}
                      checked={isActive}
                      onCheckedChange={() => handleToggleCharacter(character.id)}
                    />
                    {character.imageUrl ? (
                      <img 
                        src={character.imageUrl} 
                        alt={character.name}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {character.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <Label
                      htmlFor={`character-${character.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium leading-none flex items-center gap-1.5">
                            {character.name}
                            {isActive && (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            )}
                            {!hasPostingTimes && isActive && (
                              <span title="No posting times configured">
                                <AlertCircle className="h-3 w-3 text-amber-500" />
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {assignedAccount ? `→ @${assignedAccount.username || assignedAccount.name}` : 'No account assigned'}
                          </p>
                          {hasPostingTimes && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {character.postingTimes.map((time: string) => (
                                <Badge key={time} variant="outline" className="text-[10px] px-1 py-0">
                                  <Clock className="h-2 w-2 mr-0.5" />
                                  {time}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {!hasPostingTimes && (
                            <p className="text-[10px] text-amber-600 mt-1">
                              No posting times set - Edit character to configure
                            </p>
                          )}
                        </div>
                        {isActive && (
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
        </CardContent>
      </Card>

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
      </div>
    </div>
  );
}
