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
import { ModuleAIModelSelector } from '@/components/common/ModuleAIModelSelector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const CATEGORIES = ['discipline', 'stoicism', 'wealth', 'grindset', 'philosophy', 'focus', 'resilience', 'shadow-work', 'mixed'];
const VISUAL_STYLES = ['monks-midnight', 'dark-academia', 'noir-cinematic', 'olive-spruce', 'plum-noir', 'slate-rust', 'raw-authentic', 'custom', 'mixed'];

// Display labels for the new categories and styles (2026 Monk Mode Strategy)
const CATEGORY_LABELS: Record<string, string> = {
  'discipline': '🔥 Discipline',
  'stoicism': '🏛️ Stoicism',
  'wealth': '💰 Wealth & Freedom',
  'grindset': '⚡ Grindset',
  'philosophy': '📖 Philosophy',
  'focus': '🎯 Deep Focus',
  'resilience': '🛡️ Resilience',
  'shadow-work': '🌑 Shadow Work',
  'mixed': '🔀 Mixed',
};

const STYLE_LABELS: Record<string, string> = {
  'monks-midnight': '🌙 Monk\'s Midnight (Deep Navy & Gold)',
  'dark-academia': '📚 Dark Academia (Classic & Moody)',
  'noir-cinematic': '🎬 Noir Cinematic (Film Grain & Shadows)',
  'olive-spruce': '🌿 Olive Spruce (Nature & Grounding)',
  'plum-noir': '🍷 Plum Noir (Stoic & Introspective)',
  'slate-rust': '🪨 Slate & Rust (Gritty Resilience)',
  'raw-authentic': '📱 Raw & Authentic (Handheld B-Roll)',
  'custom': '⬛ Custom (Pure Black)',
  'mixed': '🔀 Mixed',
};
const LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi (हिंदी)' },
  { value: 'marathi', label: 'Marathi (मराठी)' }
];

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
  language?: 'english' | 'hindi' | 'marathi';
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
  const [category, setCategory] = React.useState('discipline');
  const [style, setStyle] = React.useState('monks-midnight');
  const [contentType, setContentType] = React.useState<'image' | 'video'>('image');
  const [language, setLanguage] = React.useState<'english' | 'hindi' | 'marathi'>('english');
  const [postingTimes, setPostingTimes] = React.useState<string[]>([]);
  const [selectedTime, setSelectedTime] = React.useState('');
  const [selectedHour, setSelectedHour] = React.useState('');
  const [selectedMinute, setSelectedMinute] = React.useState('');
  const [selectedModel, setSelectedModel] = React.useState<string>('');
  
  // Module-specific AI model settings
  const [moduleTextToImageModel, setModuleTextToImageModel] = React.useState('');
  const [moduleImageToImageModel, setModuleImageToImageModel] = React.useState('');
  const [moduleTextToVideoModel, setModuleTextToVideoModel] = React.useState('');
  const [moduleImageToVideoModel, setModuleImageToVideoModel] = React.useState('');
  const [savingModels, setSavingModels] = React.useState(false);

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
      
      // Load module-specific AI model settings
      if (config?.aiModelConfig) {
        setModuleTextToImageModel(config.aiModelConfig.textToImageModel || '');
        setModuleImageToImageModel(config.aiModelConfig.imageToImageModel || '');
        setModuleTextToVideoModel(config.aiModelConfig.textToVideoModel || '');
        setModuleImageToVideoModel(config.aiModelConfig.imageToVideoModel || '');
      }
      
      // Load Instagram accounts
      const accounts = await APIBook.instagram.getAccounts();
      
      // Fetch actual usernames from Instagram API
      const accountsWithUsernames = await Promise.all(
        accounts.map(async (account) => {
          try {
            const accountWithUsername = await APIBook.instagram.testConnection(account.id);
            return accountWithUsername;
          } catch (error) {
            // Return original account if fetch fails
            return account;
          }
        })
      );
      
      setInstagramAccounts(accountsWithUsernames);
    } catch (error) {
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
      setLanguage(config.language || 'english');
      setPostingTimes(config.postingTimes);
    } else {
      // New config
      setEditingConfigIndex(null);
      setSelectedAccountId('');
      setCategory('discipline');
      setStyle('monks-midnight');
      setContentType('image');
      setLanguage('english');
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
        language,
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
      toast.error('Failed to update settings');
    } finally {
      setUpdating(false);
    }
  };

  // Handle module-specific AI model changes
  const handleTextToImageModelChange = async (model: string) => {
    if (!user?.uid) return;
    
    setModuleTextToImageModel(model);
    setSavingModels(true);
    
    try {
      // Filter out empty values to avoid undefined in Firebase
      const aiModelConfig: any = {};
      if (model) aiModelConfig.textToImageModel = model;
      if (moduleImageToImageModel) aiModelConfig.imageToImageModel = moduleImageToImageModel;
      if (moduleTextToVideoModel) aiModelConfig.textToVideoModel = moduleTextToVideoModel;
      if (moduleImageToVideoModel) aiModelConfig.imageToVideoModel = moduleImageToVideoModel;
      
      await APIBook.motivationalAutoPostConfig.updateConfig(user.uid, {
        aiModelConfig: Object.keys(aiModelConfig).length > 0 ? aiModelConfig : undefined,
      });
      toast.success(model ? 'Text-to-image model updated' : 'Text-to-image model reset to global settings');
    } catch (error) {
      toast.error('Failed to save text-to-image model');
    } finally {
      setSavingModels(false);
    }
  };

  const handleImageToImageModelChange = async (model: string) => {
    if (!user?.uid) return;
    
    setModuleImageToImageModel(model);
    setSavingModels(true);
    
    try {
      const aiModelConfig: any = {};
      if (moduleTextToImageModel) aiModelConfig.textToImageModel = moduleTextToImageModel;
      if (model) aiModelConfig.imageToImageModel = model;
      if (moduleTextToVideoModel) aiModelConfig.textToVideoModel = moduleTextToVideoModel;
      if (moduleImageToVideoModel) aiModelConfig.imageToVideoModel = moduleImageToVideoModel;
      
      await APIBook.motivationalAutoPostConfig.updateConfig(user.uid, {
        aiModelConfig: Object.keys(aiModelConfig).length > 0 ? aiModelConfig : undefined,
      });
      toast.success(model ? 'Image-to-image model updated' : 'Image-to-image model reset to global settings');
    } catch (error) {
      toast.error('Failed to save image-to-image model');
    } finally {
      setSavingModels(false);
    }
  };

  const handleTextToVideoModelChange = async (model: string) => {
    if (!user?.uid) return;
    
    setModuleTextToVideoModel(model);
    setSavingModels(true);
    
    try {
      const aiModelConfig: any = {};
      if (moduleTextToImageModel) aiModelConfig.textToImageModel = moduleTextToImageModel;
      if (moduleImageToImageModel) aiModelConfig.imageToImageModel = moduleImageToImageModel;
      if (model) aiModelConfig.textToVideoModel = model;
      if (moduleImageToVideoModel) aiModelConfig.imageToVideoModel = moduleImageToVideoModel;
      
      await APIBook.motivationalAutoPostConfig.updateConfig(user.uid, {
        aiModelConfig: Object.keys(aiModelConfig).length > 0 ? aiModelConfig : undefined,
      });
      toast.success(model ? 'Text-to-video model updated' : 'Text-to-video model reset to global settings');
    } catch (error) {
      toast.error('Failed to save text-to-video model');
    } finally {
      setSavingModels(false);
    }
  };

  const handleImageToVideoModelChange = async (model: string) => {
    if (!user?.uid) return;
    
    setModuleImageToVideoModel(model);
    setSavingModels(true);
    
    try {
      const aiModelConfig: any = {};
      if (moduleTextToImageModel) aiModelConfig.textToImageModel = moduleTextToImageModel;
      if (moduleImageToImageModel) aiModelConfig.imageToImageModel = moduleImageToImageModel;
      if (moduleTextToVideoModel) aiModelConfig.textToVideoModel = moduleTextToVideoModel;
      if (model) aiModelConfig.imageToVideoModel = model;
      
      await APIBook.motivationalAutoPostConfig.updateConfig(user.uid, {
        aiModelConfig: Object.keys(aiModelConfig).length > 0 ? aiModelConfig : undefined,
      });
      toast.success(model ? 'Image-to-video model updated' : 'Image-to-video model reset to global settings');
    } catch (error) {
      toast.error('Failed to save image-to-video model');
    } finally {
      setSavingModels(false);
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
    }
  };

  const getAccountName = (accountId: string) => {
    const account = instagramAccounts.find(acc => acc.id === accountId);
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                Motivational Quotes Configuration
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Configure the theme and style for automatic quote generation
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto" size="sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Add Account</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-lg sm:text-xl">
                    {editingConfigIndex !== null ? 'Edit Configuration' : 'Add Account Configuration'}
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Configure posting settings for an Instagram account
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
                  {/* Instagram Account */}
                  <div className="space-y-2">
                    <Label htmlFor="account" className="text-sm sm:text-base font-semibold">Instagram Account</Label>
                    <Select 
                      value={selectedAccountId} 
                      onValueChange={setSelectedAccountId}
                      disabled={editingConfigIndex !== null}
                    >
                      <SelectTrigger id="account" className="h-10 sm:h-11">
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
                    <Label htmlFor="category" className="text-sm sm:text-base font-semibold">Quote Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category" className="h-10 sm:h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Visual Style */}
                  <div className="space-y-2">
                    <Label htmlFor="style" className="text-sm sm:text-base font-semibold">Visual Style</Label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger id="style" className="h-10 sm:h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VISUAL_STYLES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STYLE_LABELS[s] || s.charAt(0).toUpperCase() + s.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Language Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-sm sm:text-base font-semibold">Quote Language</Label>
                    <Select value={language} onValueChange={(value) => setLanguage(value as 'english' | 'hindi' | 'marathi')}>
                      <SelectTrigger id="language" className="h-10 sm:h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Quotes and blog content will be generated in the selected language
                    </p>
                  </div>

                  {/* Content Type */}
                  <div className="space-y-2">
                    <Label htmlFor="content-type" className="text-sm sm:text-base font-semibold">Content Type</Label>
                    <Select
                      value={contentType}
                      onValueChange={(value) => setContentType(value as 'image' | 'video')}
                    >
                      <SelectTrigger id="content-type" className="h-10 sm:h-11">
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
                    <Label className="text-sm sm:text-base font-semibold">Posting Schedule (IST)</Label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <div className="flex items-center gap-1 w-full sm:flex-1">
                        <Label className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Hour:</Label>
                        <Select value={selectedHour} onValueChange={setSelectedHour}>
                          <SelectTrigger className="w-20 sm:w-24 h-9 sm:h-10">
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
                        <span className="text-base sm:text-lg font-medium">:</span>
                        <Label className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Min:</Label>
                        <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                          <SelectTrigger className="w-20 sm:w-24 h-9 sm:h-10">
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
                        className="h-9 sm:h-10 px-3 sm:px-4 w-full sm:w-auto"
                        size="sm"
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="text-xs sm:text-sm">Add Time</span>
                      </Button>
                    </div>
                    
                    {postingTimes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3 p-2 sm:p-3 bg-muted rounded-md">
                        {postingTimes.map((time) => (
                          <Badge key={time} variant="secondary" className="text-xs sm:text-sm py-1 sm:py-1.5 px-2 sm:px-3">
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

                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button onClick={handleSaveAccountConfig} disabled={saving} className="w-full sm:w-auto">
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
          <div className="flex items-center justify-between space-x-2 p-3 sm:p-4 rounded-lg border bg-muted/30">
            <div className="space-y-0.5 flex-1 min-w-0">
              <Label htmlFor="auto-posting" className="text-sm sm:text-base font-semibold">
                Enable Auto-Posting
              </Label>
              <p className="text-xs sm:text-sm text-muted-foreground">
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
            <div className="text-center py-6 sm:py-8 border-2 border-dashed rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground px-4">
                No account configurations yet. Click "Add Account" to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-sm sm:text-base font-semibold">Configured Accounts</Label>
              {accountConfigs.map((config, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-3 sm:p-4 sm:pt-6">
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                      <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                        {/* Account Name */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <h4 className="text-base sm:text-lg font-semibold text-primary truncate">
                            @{getAccountName(config.accountId)}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {config.contentType === 'image' ? (
                              <><Image className="h-3 w-3 mr-1" /> IMAGE</>
                            ) : (
                              <><Video className="h-3 w-3 mr-1" /> VIDEO</>
                            )}
                          </Badge>
                        </div>

                        {/* Configuration Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 sm:gap-y-2 text-xs sm:text-sm">
                          <div>
                            <span className="text-muted-foreground">Category:</span>{' '}
                            <span className="font-medium">{config.category.charAt(0).toUpperCase() + config.category.slice(1)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Style:</span>{' '}
                            <span className="font-medium">{config.style.charAt(0).toUpperCase() + config.style.slice(1)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Language:</span>{' '}
                            <span className="font-medium">
                              {config.language === 'hindi' ? 'Hindi (हिंदी)' : 
                               config.language === 'marathi' ? 'Marathi (मराठी)' : 
                               'English'}
                            </span>
                          </div>
                        </div>

                        {/* Posting Times */}
                        <div className="space-y-1">
                          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Posting Times (IST):</p>
                          <div className="flex flex-wrap gap-1 sm:gap-1.5">
                            {config.postingTimes.map((time, idx) => (
                              <Badge key={idx} variant="secondary" className="text-[10px] sm:text-xs py-0.5 px-1.5 sm:px-2">
                                🕐 {time}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex sm:flex-col items-center sm:items-start gap-1 sm:gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(index)}
                          title="Edit configuration"
                          className="h-8 w-8 sm:h-9 sm:w-9"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteConfig(index)}
                          title="Delete configuration"
                          className="h-8 w-8 sm:h-9 sm:w-9"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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
                <span>Quotes are auto-generated using your selected AI models below</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Posts are published at the configured times automatically</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Module-specific AI Model Selection */}
      <ModuleAIModelSelector
        moduleId="module9"
        moduleName="Motivational Quotes"
        description="Select AI models specifically for motivational quote generation. These models will be used instead of global AI settings for this module."
        showTextToImageModel={true}
        showImageToImageModel={false}
        showTextToVideoModel={true}
        showImageToVideoModel={false}
        selectedTextToImageModel={moduleTextToImageModel}
        selectedTextToVideoModel={moduleTextToVideoModel}
        onTextToImageModelChange={handleTextToImageModelChange}
        onTextToVideoModelChange={handleTextToVideoModelChange}
        disabled={savingModels}
      />
    </div>
  );
}
