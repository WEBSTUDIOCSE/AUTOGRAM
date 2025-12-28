'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle2, RefreshCw, Zap, DollarSign, Layers, Image as ImageIcon, Video } from 'lucide-react';
import { AIService } from '@/lib/services/ai.service';
import { UserPreferencesService } from '@/lib/firebase/services';
import { getModelsByType, type ModelMetadata } from '@/lib/services/image-generation/model-registry';

interface ProviderInfo {
  name: string;
  displayName: string;
  description: string;
  features: string[];
  icon: string;
}

const PROVIDERS: Record<string, ProviderInfo> = {
  gemini: {
    name: 'gemini',
    displayName: 'Google Gemini',
    description: 'High-quality image generation with character consistency support',
    features: ['Character Consistency', 'High Quality', 'Fast Generation'],
    icon: '🤖'
  },
  kieai: {
    name: 'kieai',
    displayName: 'Kie.ai',
    description: 'Cost-effective image generation with multiple model options',
    features: ['Low Cost', 'Multiple Models', 'Async Generation'],
    icon: '⚡'
  }
};

export function AIProviderSettings() {
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'kieai'>('gemini');
  const [textToImageModel, setTextToImageModel] = useState<string>('');
  const [imageToImageModel, setImageToImageModel] = useState<string>('');
  const [textToVideoModel, setTextToVideoModel] = useState<string>('');
  const [imageToVideoModel, setImageToVideoModel] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [credits, setCredits] = useState<Record<string, { remaining: number; total?: number; used?: number }>>({});
  const [costs, setCosts] = useState<Record<string, number>>({});
  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProviderSettings();
  }, []);

  const loadProviderSettings = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading provider preferences from Firebase...');
      // Get saved preferences from Firebase
      const prefsResponse = await UserPreferencesService.getPreferences();
      const prefs = prefsResponse.data;
      
      const currentProvider = prefs?.aiProvider || 'gemini';
      console.log('✅ Provider loaded from Firebase:', currentProvider);
      setSelectedProvider(currentProvider);
      AIService.setDefaultProvider(currentProvider);
      
      // Load model selections
      if (prefs?.textToImageModel) {
        console.log('🎨 Text-to-Image Model:', prefs.textToImageModel);
        setTextToImageModel(prefs.textToImageModel);
      } else {
        // Set default based on provider
        const defaultModel = currentProvider === 'gemini' ? 'gemini-2.5-flash-' : 'google/imagen4-fast';
        setTextToImageModel(defaultModel);
      }
      
      if (prefs?.imageToImageModel) {
        console.log('🖼️ Image-to-Image Model:', prefs.imageToImageModel);
        setImageToImageModel(prefs.imageToImageModel);
      } else {
        // Set default based on provider
        const defaultModel = currentProvider === 'gemini' ? 'gemini-2.5-flash-reference' : 'seedream/4.5-edit';
        setImageToImageModel(defaultModel);
      }
      
      // Load video model selections
      if (prefs?.textToVideoModel) {
        console.log('🎬 Text-to-Video Model:', prefs.textToVideoModel);
        setTextToVideoModel(prefs.textToVideoModel);
      } else {
        setTextToVideoModel('bytedance/v1-pro-text-to-video');
      }
      
      if (prefs?.imageToVideoModel) {
        console.log('🎥 Image-to-Video Model:', prefs.imageToVideoModel);
        setImageToVideoModel(prefs.imageToVideoModel);
      } else {
        setImageToVideoModel('bytedance/v1-pro-image-to-video');
      }

      // Load credits
      const creditsResponse = await AIService.getAllCredits();
      if (creditsResponse.success && creditsResponse.data) {
        setCredits(creditsResponse.data);
      }

      // Get cost comparison
      const costsResponse = await AIService.getCostComparison('sample prompt');
      if (costsResponse.success && costsResponse.data) {
        setCosts(costsResponse.data);
      }

      // Test connections
      await testConnections();
    } catch (error) {
      console.error('Failed to load provider settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnections = async () => {
    setTesting(true);
    try {
      const response = await AIService.testConnection();
      if (response.success && response.data) {
        setConnections(response.data);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const handleSaveProvider = async () => {
    setSaving(true);
    try {
      console.log(`💾 Saving settings to Firebase:`);
      console.log(`   Provider: ${selectedProvider}`);
      console.log(`   Text-to-Image Model: ${textToImageModel}`);
      console.log(`   Image-to-Image Model: ${imageToImageModel}`);
      console.log(`   Text-to-Video Model: ${textToVideoModel}`);
      console.log(`   Image-to-Video Model: ${imageToVideoModel}`);
      
      // Get current preferences
      const prefsResponse = await UserPreferencesService.getPreferences();
      const currentPrefs = prefsResponse.data || {};
      
      // Update with new values
      const updatedPrefs = {
        ...currentPrefs,
        aiProvider: selectedProvider,
        textToImageModel,
        imageToImageModel,
        textToVideoModel,
        imageToVideoModel
      };
      
      // Save to Firebase
      await UserPreferencesService.savePreferences(updatedPrefs);
      AIService.setDefaultProvider(selectedProvider);
      
      console.log(`✅ Settings successfully saved to Firebase`);
      
      setTimeout(() => {
        setSaving(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaving(false);
    }
  };

  const formatCredits = (provider: string) => {
    const credit = credits[provider];
    if (!credit) return 'N/A';
    
    if (credit.total) {
      return `${credit.remaining.toFixed(0)} / ${credit.total.toFixed(0)} (${credit.used?.toFixed(0) || 0} used)`;
    }
    
    return credit.remaining > 0 ? '✓ Available' : '✗ Unavailable';
  };

  const formatCost = (provider: string) => {
    const cost = costs[provider];
    return cost ? `$${cost.toFixed(4)}` : 'N/A';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI Image Generation Provider
          </CardTitle>
          <CardDescription>
            Loading provider settings...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="animate-pulse space-y-3">
            <div className="h-24 bg-muted rounded-lg" />
            <div className="h-24 bg-muted rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          AI Provider Settings
        </CardTitle>
        <CardDescription>
          Configure AI models for image and video generation.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Provider Selection */}
        <RadioGroup value={selectedProvider} onValueChange={(value) => setSelectedProvider(value as 'gemini' | 'kieai')}>
          <div className="space-y-3">
            {Object.entries(PROVIDERS).map(([key, provider]) => (
              <div key={key} className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={provider.name} id={provider.name} className="mt-1" />
                <Label htmlFor={provider.name} className="flex-1 cursor-pointer">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{provider.icon}</span>
                      <div className="flex-1">
                        <div className="font-semibold">{provider.displayName}</div>
                        <div className="text-sm text-muted-foreground">{provider.description}</div>
                      </div>
                      {connections[provider.name] !== undefined && (
                        <Badge variant={connections[provider.name] ? 'default' : 'destructive'} className="shrink-0">
                          {connections[provider.name] ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</>
                          ) : (
                            <><AlertCircle className="h-3 w-3 mr-1" /> Offline</>
                          )}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-1.5">
                      {provider.features.map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        <span>Cost: {formatCost(provider.name)}</span>
                      </div>
                      <div className="text-muted-foreground">
                        Credits: {formatCredits(provider.name)}
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>

        {/* Model Selection */}
        {selectedProvider === 'kieai' && (
          <div className="space-y-6 pt-6 border-t">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Text-to-Image Model
                  </Label>
                  <Badge variant="secondary" className="text-xs">
                    New Generation
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Select the model for generating new images from text prompts
                </p>
                <Select value={textToImageModel} onValueChange={setTextToImageModel}>
                  <SelectTrigger className="h-auto py-3">
                    <SelectValue placeholder="Select text-to-image model" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px]">
                    {(() => {
                      const models = getModelsByType('text-to-image', selectedProvider);
                      const categories = Array.from(new Set(models.map((m: ModelMetadata) => m.category || 'Other')));
                      
                      return categories.map(category => (
                        <div key={category}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                            {category}
                          </div>
                          {models
                            .filter((m: ModelMetadata) => (m.category || 'Other') === category)
                            .map((model: ModelMetadata) => (
                              <SelectItem key={model.id} value={model.id} className="py-3">
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{model.name}</span>
                                    <div className="flex gap-1">
                                      <Badge variant="outline" className="text-xs font-normal">
                                        {model.quality}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs font-normal">
                                        {model.speed}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs font-normal">
                                        {model.costLevel}
                                      </Badge>
                                    </div>
                                  </div>
                                  <span className="text-xs text-muted-foreground line-clamp-2">
                                    {model.description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                        </div>
                      ));
                    })()}
                  </SelectContent>
                </Select>
                {textToImageModel && (
                  <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                    {(() => {
                      const model = getModelsByType('text-to-image', selectedProvider).find((m: ModelMetadata) => m.id === textToImageModel);
                      return model ? (
                        <>
                          <p className="text-sm">{model.description}</p>
                          {model.features && model.features.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {model.features.map((feature: string) => (
                                <Badge key={feature} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <Layers className="h-5 w-5 text-primary" />
                    Image-to-Image Model
                  </Label>
                  <Badge variant="secondary" className="text-xs">
                    Character Consistency
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Select the model for maintaining character consistency with reference images
                </p>
                <Select value={imageToImageModel} onValueChange={setImageToImageModel}>
                  <SelectTrigger className="h-auto py-3">
                    <SelectValue placeholder="Select image-to-image model" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px]">
                    {(() => {
                      const models = getModelsByType('image-to-image', selectedProvider);
                      const categories = Array.from(new Set(models.map((m: ModelMetadata) => m.category || 'Other')));
                      
                      return categories.map(category => (
                        <div key={category}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                            {category}
                          </div>
                          {models
                            .filter((m: ModelMetadata) => (m.category || 'Other') === category)
                            .map((model: ModelMetadata) => (
                              <SelectItem key={model.id} value={model.id} className="py-3">
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{model.name}</span>
                                    <div className="flex gap-1">
                                      <Badge variant="outline" className="text-xs font-normal">
                                        {model.quality}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs font-normal">
                                        {model.speed}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs font-normal">
                                        {model.costLevel}
                                      </Badge>
                                    </div>
                                  </div>
                                  <span className="text-xs text-muted-foreground line-clamp-2">
                                    {model.description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                        </div>
                      ));
                    })()}
                  </SelectContent>
                </Select>
                {imageToImageModel && (
                  <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                    {(() => {
                      const model = getModelsByType('image-to-image', selectedProvider).find((m: ModelMetadata) => m.id === imageToImageModel);
                      return model ? (
                        <>
                          <p className="text-sm">{model.description}</p>
                          {model.features && model.features.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {model.features.map((feature: string) => (
                                <Badge key={feature} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

              {/* Video Models Section */}
              <div className="space-y-3 pt-6 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <Video className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-semibold">Video Generation Models</h3>
                </div>
                
                {/* Text-to-Video Model */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-base font-semibold">
                      <Video className="h-4 w-4 text-primary" />
                      Text-to-Video Model
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      New Video
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Select the model for generating videos from text descriptions
                  </p>
                  <Select value={textToVideoModel} onValueChange={setTextToVideoModel}>
                    <SelectTrigger className="h-auto py-3">
                      <SelectValue placeholder="Select text-to-video model" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      {(() => {
                        const models = getModelsByType('text-to-video', 'kieai');
                        const categories = Array.from(new Set(models.map((m: ModelMetadata) => m.category || 'Other')));
                        
                        return categories.map(category => (
                          <div key={category}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                              {category}
                            </div>
                            {models
                              .filter((m: ModelMetadata) => (m.category || 'Other') === category)
                              .map((model: ModelMetadata) => (
                                <SelectItem key={model.id} value={model.id} className="py-3">
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{model.name}</span>
                                      <div className="flex gap-1">
                                        <Badge variant="outline" className="text-xs font-normal">
                                          {model.quality}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs font-normal">
                                          {model.speed}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs font-normal">
                                          {model.costLevel}
                                        </Badge>
                                      </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground line-clamp-2">
                                      {model.description}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                          </div>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                  {textToVideoModel && (
                    <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                      {(() => {
                        const model = getModelsByType('text-to-video', 'kieai').find((m: ModelMetadata) => m.id === textToVideoModel);
                        return model ? (
                          <>
                            <p className="text-sm">{model.description}</p>
                            {model.features && model.features.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {model.features.map((feature: string) => (
                                  <Badge key={feature} variant="secondary" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>

                {/* Image-to-Video Model */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-base font-semibold">
                      <Layers className="h-4 w-4 text-primary" />
                      Image-to-Video Model
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      Animate Images
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Select the model for animating static images into videos
                  </p>
                  <Select value={imageToVideoModel} onValueChange={setImageToVideoModel}>
                    <SelectTrigger className="h-auto py-3">
                      <SelectValue placeholder="Select image-to-video model" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      {(() => {
                        const models = getModelsByType('image-to-video', 'kieai');
                        const categories = Array.from(new Set(models.map((m: ModelMetadata) => m.category || 'Other')));
                        
                        return categories.map(category => (
                          <div key={category}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                              {category}
                            </div>
                            {models
                              .filter((m: ModelMetadata) => (m.category || 'Other') === category)
                              .map((model: ModelMetadata) => (
                                <SelectItem key={model.id} value={model.id} className="py-3">
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{model.name}</span>
                                      <div className="flex gap-1">
                                        <Badge variant="outline" className="text-xs font-normal">
                                          {model.quality}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs font-normal">
                                          {model.speed}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs font-normal">
                                          {model.costLevel}
                                        </Badge>
                                      </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground line-clamp-2">
                                      {model.description}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                          </div>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                  {imageToVideoModel && (
                    <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                      {(() => {
                        const model = getModelsByType('image-to-video', 'kieai').find((m: ModelMetadata) => m.id === imageToVideoModel);
                        return model ? (
                          <>
                            <p className="text-sm">{model.description}</p>
                            {model.features && model.features.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {model.features.map((feature: string) => (
                                  <Badge key={feature} variant="secondary" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            onClick={handleSaveProvider}
            disabled={saving || loading}
            className="flex-1"
          >
            {saving ? 'Saving...' : 'Save Provider Settings'}
          </Button>
          
          <Button
            variant="outline"
            onClick={testConnections}
            disabled={testing || loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testing...' : 'Test Connections'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
