'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Image, Video, Plus, X, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { APIBook, UserPreferencesService } from '@/lib/firebase/services';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const CATEGORIES = ['success', 'mindset', 'motivation', 'inspiration', 'life', 'wisdom', 'mixed'];
const VISUAL_STYLES = ['modern', 'minimalist', 'vibrant', 'elegant', 'bold', 'serene', 'mixed'];

// Generate time options with 15-minute intervals
const generateTimeOptions = () => {
  const times: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const hourStr = hour.toString().padStart(2, '0');
      const minuteStr = minute.toString().padStart(2, '0');
      times.push(`${hourStr}:${minuteStr}`);
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

interface AccountConfig {
  accountId: string;
  category: string;
  style: string;
  contentType: 'image' | 'video';
  postingTimes: string[];
}

export function MotivationalQuoteSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState(false);
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  
  // Account configurations
  const [accountConfigs, setAccountConfigs] = React.useState<AccountConfig[]>([]);
  const [instagramAccounts, setInstagramAccounts] = React.useState<any[]>([]);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingConfigIndex, setEditingConfigIndex] = React.useState<number | null>(null);
  
  // Form state
  const [selectedAccountId, setSelectedAccountId] = React.useState('');
  const [category, setCategory] = React.useState('motivation');
  const [style, setStyle] = React.useState('modern');
  const [contentType, setContentType] = React.useState<'image' | 'video'>('image');
  const [postingTimes, setPostingTimes] = React.useState<string[]>([]);
  const [selectedTime, setSelectedTime] = React.useState('');
  const [selectedHour, setSelectedHour] = React.useState('');
  const [selectedMinute, setSelectedMinute] = React.useState('');
  const [selectedModel, setSelectedModel] = React.useState<string>('');

  React.useEffect(() => {
    if (user?.uid) {
      loadConfig();
    }
  }, [user]);

  const loadConfig = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      
      // Load configuration
      const config = await APIBook.motivationalAutoPostConfig.getConfig(user.uid);
      setIsEnabled(config?.isEnabled || false);
      
      if (config && config.accountConfigs) {
        setAccountConfigs(config.accountConfigs);
      }
      
      // Load Instagram accounts
      const accounts = await APIBook.instagram.getAccounts();
      console.log('Instagram accounts loaded:', accounts);
      
      // Fetch actual usernames from Instagram API
      const accountsWithUsernames = await Promise.all(
        accounts.map(async (account) => {
          try {
            const accountWithUsername = await APIBook.instagram.testConnection(account.id);
            console.log('Fetched username for account:', accountWithUsername);
            return accountWithUsername;
          } catch (error) {
            console.error(`Failed to fetch username for ${account.name}:`, error);
            // Return original account if fetch fails
            return account;
          }
        })
      );
      
      console.log('Accounts with usernames:', accountsWithUsernames);
      setInstagramAccounts(accountsWithUsernames);
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (configIndex?: number) => {
    if (configIndex !== undefined) {
      // Edit existing config
      const config = accountConfigs[configIndex];
      setEditingConfigIndex(configIndex);
      setSelectedAccountId(config.accountId);
      setCategory(config.category);
      setStyle(config.style);
      setContentType(config.contentType);
      setPostingTimes(config.postingTimes);
    } else {
      // New config
      setEditingConfigIndex(null);
      setSelectedAccountId('');
      setCategory('motivation');
      setStyle('modern');
      setContentType('image');
      setPostingTimes([]);
    }
    setSelectedTime('');
    setDialogOpen(true);
  };

  const handleAddPostingTime = () => {
    const timeString = selectedHour && selectedMinute ? `${selectedHour}:${selectedMinute}` : selectedTime;
    if (timeString && !postingTimes.includes(timeString)) {
      setPostingTimes([...postingTimes, timeString].sort());
      setSelectedTime('');
      setSelectedHour('');
      setSelectedMinute('');
    }
  };

  const handleRemovePostingTime = (timeToRemove: string) => {
    setPostingTimes(postingTimes.filter(time => time !== timeToRemove));
  };

  const handleSaveAccountConfig = async () => {
    if (!user?.uid) return;
    
    if (!selectedAccountId) {
      toast.error('Please select an Instagram account');
      return;
    }
    
    if (postingTimes.length === 0) {
      toast.error('Please add at least one posting time');
      return;
    }
    
    // Check if account already configured (when adding new)
    if (editingConfigIndex === null) {
      const existingConfig = accountConfigs.find(c => c.accountId === selectedAccountId);
      if (existingConfig) {
        toast.error('This account is already configured. Please edit the existing configuration.');
        return;
      }
    }
    
    try {
      setSaving(true);
      
      const newConfig: AccountConfig = {
        accountId: selectedAccountId,
        category,
        style,
        contentType,
        postingTimes,
      };
      
      let updatedConfigs: AccountConfig[];
      
      if (editingConfigIndex !== null) {
        // Update existing
        updatedConfigs = [...accountConfigs];
        updatedConfigs[editingConfigIndex] = newConfig;
      } else {
        // Add new
        updatedConfigs = [...accountConfigs, newConfig];
      }
      
      setAccountConfigs(updatedConfigs);
      
      await APIBook.motivationalAutoPostConfig.updateConfig(user.uid, {
        accountConfigs: updatedConfigs,
      });
      
      toast.success(editingConfigIndex !== null ? 'Configuration updated' : 'Configuration added');
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfig = async (configIndex: number) => {
    if (!user?.uid) return;
    
    try {
      setUpdating(true);
      const updatedConfigs = accountConfigs.filter((_, idx) => idx !== configIndex);
      setAccountConfigs(updatedConfigs);
      
      await APIBook.motivationalAutoPostConfig.updateConfig(user.uid, {
        accountConfigs: updatedConfigs,
      });
      
      toast.success('Configuration deleted');
    } catch (error) {
      console.error('Error deleting config:', error);
      toast.error('Failed to delete configuration');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleAutoPosting = async (enabled: boolean) => {
    if (!user?.uid) return;
    
    if (enabled && accountConfigs.length === 0) {
      toast.error('Please add at least one account configuration');
      return;
    }
    
    try {
      setUpdating(true);
      if (enabled) {
        await APIBook.motivationalAutoPostConfig.enable(user.uid);
      } else {
        await APIBook.motivationalAutoPostConfig.disable(user.uid);
      }
      setIsEnabled(enabled);
      toast.success(
        enabled
          ? 'Auto-posting enabled successfully'
          : 'Auto-posting disabled successfully'
      );
    } catch (error) {
      console.error('Error updating auto-post config:', error);
      toast.error('Failed to update settings');
    } finally {
      setUpdating(false);
    }
  };

  React.useEffect(() => {
    if (user?.uid && contentType) {
      loadAIModel();
    }
  }, [contentType, user]);

  const loadAIModel = async () => {
    if (!user?.uid) return;
    try {
      const prefs = await UserPreferencesService.getPreferences(user.uid);
      if (contentType === 'image') {
        setSelectedModel(prefs.data?.textToImageModel || 'Not configured');
      } else {
        setSelectedModel(prefs.data?.textToVideoModel || 'Not configured');
      }
    } catch (error) {
      console.error('Error loading AI model:', error);
    }
  };

  const getAccountName = (accountId: string) => {
    const account = instagramAccounts.find(acc => acc.id === accountId);
    console.log('getAccountName called:', { accountId, account });
    // Prioritize actual username fetched from API
    return account?.username || account?.name || 'Unknown';
  };

  const getAvailableAccounts = () => {
    if (editingConfigIndex !== null) {
      // When editing, show all accounts including the one being edited
      return instagramAccounts;
    }
    // When adding new, exclude already configured accounts
    const configuredAccountIds = accountConfigs.map(c => c.accountId);
    return instagramAccounts.filter(acc => !configuredAccountIds.includes(acc.id));
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Motivational Quotes Configuration
              </CardTitle>
              <CardDescription>
                Configure the theme and style for automatic quote generation
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingConfigIndex !== null ? 'Edit Configuration' : 'Add Account Configuration'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure posting settings for an Instagram account
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Instagram Account */}
                  <div className="space-y-2">
                    <Label htmlFor="account" className="text-base font-semibold">Instagram Account</Label>
                    <Select 
                      value={selectedAccountId} 
                      onValueChange={setSelectedAccountId}
                      disabled={editingConfigIndex !== null}
                    >
                      <SelectTrigger id="account" className="h-11">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableAccounts().length === 0 ? (
                          <SelectItem value="" disabled>
                            {editingConfigIndex !== null ? 'Loading...' : 'No accounts available'}
                          </SelectItem>
                        ) : (
                          getAvailableAccounts().map((account) => {
                            const displayName = account.username || account.name || account.id;
                            console.log('Rendering account:', { id: account.id, name: account.name, username: account.username, displayName });
                            return (
                              <SelectItem key={account.id} value={account.id}>
                                @{displayName}
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                    {editingConfigIndex !== null && (
                      <p className="text-xs text-muted-foreground">Account cannot be changed when editing</p>
                    )}
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-base font-semibold">Quote Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category" className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Visual Style */}
                  <div className="space-y-2">
                    <Label htmlFor="style" className="text-base font-semibold">Visual Style</Label>
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

                  {/* Content Type */}
                  <div className="space-y-2">
                    <Label htmlFor="content-type" className="text-base font-semibold">Content Type</Label>
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
                    <p className="text-xs text-muted-foreground">
                      AI Model: <span className="font-medium">{selectedModel}</span>
                    </p>
                  </div>

                  {/* Posting Schedule */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Posting Schedule (IST)</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 flex-1">
                        <Label className="text-sm text-muted-foreground">Hour:</Label>
                        <Select value={selectedHour} onValueChange={setSelectedHour}>
                          <SelectTrigger className="w-24 h-11">
                            <SelectValue placeholder="HH" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {Array.from({ length: 24 }, (_, i) => {
                              const hour = i.toString().padStart(2, '0');
                              return (
                                <SelectItem key={hour} value={hour}>
                                  {hour}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <span className="text-lg font-medium">:</span>
                        <Label className="text-sm text-muted-foreground">Min:</Label>
                        <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                          <SelectTrigger className="w-24 h-11">
                            <SelectValue placeholder="MM" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {Array.from({ length: 60 }, (_, i) => {
                              const minute = i.toString().padStart(2, '0');
                              return (
                                <SelectItem key={minute} value={minute}>
                                  {minute}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddPostingTime}
                        disabled={!selectedHour || !selectedMinute}
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
                              className="ml-2 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveAccountConfig} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingConfigIndex !== null ? 'Update' : 'Add'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="auto-posting" className="text-base font-semibold">
                Enable Auto-Posting
              </Label>
              <p className="text-sm text-muted-foreground">
                {isEnabled
                  ? `Active for ${accountConfigs.length} account${accountConfigs.length !== 1 ? 's' : ''}`
                  : accountConfigs.length > 0
                  ? 'Enable to start posting'
                  : 'Add account configurations to get started'}
              </p>
            </div>
            <Switch
              id="auto-posting"
              checked={isEnabled}
              onCheckedChange={handleToggleAutoPosting}
              disabled={updating || accountConfigs.length === 0}
            />
          </div>

          {/* Account Configurations List */}
          {accountConfigs.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">
                No account configurations yet. Click "Add Account" to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Configured Accounts</Label>
              {accountConfigs.map((config, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Account Name */}
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-semibold text-primary">
                            @{getAccountName(config.accountId)}
                          </h4>
                          <Badge variant="outline">
                            {config.contentType === 'image' ? (
                              <><Image className="h-3 w-3 mr-1" /> IMAGE</>
                            ) : (
                              <><Video className="h-3 w-3 mr-1" /> VIDEO</>
                            )}
                          </Badge>
                        </div>

                        {/* Configuration Details */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Category:</span>{' '}
                            <span className="font-medium">{config.category.charAt(0).toUpperCase() + config.category.slice(1)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Style:</span>{' '}
                            <span className="font-medium">{config.style.charAt(0).toUpperCase() + config.style.slice(1)}</span>
                          </div>
                        </div>

                        {/* Posting Times */}
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">Posting Times (IST):</p>
                          <div className="flex flex-wrap gap-1.5">
                            {config.postingTimes.map((time, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                🕐 {time}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-start gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(index)}
                          title="Edit configuration"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteConfig(index)}
                          title="Delete configuration"
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

          <div className="space-y-2 pt-2">
            <h4 className="text-sm font-medium">Note</h4>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Each account can have different category, style, and posting schedule</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Quotes are auto-generated using your selected AI models from settings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Posts are published at the configured times automatically</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
