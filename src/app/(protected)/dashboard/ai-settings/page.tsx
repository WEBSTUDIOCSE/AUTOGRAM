'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIProviderSettings } from '@/components/dashboard/AIProviderSettings';
import { Settings, Save } from 'lucide-react';
import { getGeminiConfig, getKieAIConfig } from '@/lib/firebase/config/environments';
import { UserPreferencesService } from '@/lib/firebase/services';

const GEMINI_MODELS = [
  { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image', description: 'Latest image generation model' },
  { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash Experimental', description: 'Experimental fast model' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', description: 'High-quality generation' }
];

const KIEAI_MODELS = [
  { value: 'bytedance/seedream', label: 'ByteDance SeeDream', description: 'Cost-effective image generation' },
  { value: 'stable-diffusion-xl', label: 'Stable Diffusion XL', description: 'High-quality SDXL model' },
  { value: 'flux-schnell', label: 'Flux Schnell', description: 'Fast generation model' }
];

export default function AISettingsPage() {
  const geminiConfig = getGeminiConfig();
  const kieaiConfig = getKieAIConfig();

  const [geminiImageModel, setGeminiImageModel] = useState(geminiConfig.imageModel);
  const [geminiTextModel, setGeminiTextModel] = useState(geminiConfig.textModel);
  const [kieaiModel, setKieaiModel] = useState(kieaiConfig.defaultModel);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModelPreferences();
  }, []);

  const loadModelPreferences = async () => {
    try {
      const prefsResponse = await UserPreferencesService.getPreferences();
      const prefs = prefsResponse.data;

      if (prefs?.geminiImageModel) {
        setGeminiImageModel(prefs.geminiImageModel);
      }
      if (prefs?.geminiTextModel) {
        setGeminiTextModel(prefs.geminiTextModel);
      }
      if (prefs?.kieaiModel) {
        setKieaiModel(prefs.kieaiModel);
      }
    } catch (error) {
      console.error('Failed to load model preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Save model selections to Firebase
      await UserPreferencesService.updateAIModels({
        geminiImageModel,
        geminiTextModel,
        kieaiModel
      });

      console.log('✅ AI model settings saved to Firebase:', {
        gemini: { imageModel: geminiImageModel, textModel: geminiTextModel },
        kieai: { defaultModel: kieaiModel }
      });

      setTimeout(() => {
        setSaving(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to save AI settings:', error);
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AI Settings</h1>
        <p className="text-muted-foreground">
          Configure AI providers and model preferences for image generation
        </p>
      </div>

      {/* Settings Content */}
      <Tabs defaultValue="provider" className="space-y-6">
        <TabsList>
          <TabsTrigger value="provider">Provider Selection</TabsTrigger>
          <TabsTrigger value="models">Model Configuration</TabsTrigger>
        </TabsList>

        {/* Provider Selection Tab */}
        <TabsContent value="provider">
          <AIProviderSettings />
        </TabsContent>

        {/* Model Configuration Tab */}
        <TabsContent value="models" className="space-y-6">
          {/* Gemini Models */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                Google Gemini Models
              </CardTitle>
              <CardDescription>
                Select which Gemini models to use for image and text generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gemini-image-model">Image Generation Model</Label>
                <Select value={geminiImageModel} onValueChange={setGeminiImageModel}>
                  <SelectTrigger id="gemini-image-model">
                    <SelectValue placeholder="Select image model" />
                  </SelectTrigger>
                  <SelectContent>
                    {GEMINI_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.label}</span>
                          <span className="text-xs text-muted-foreground">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Current: {geminiImageModel}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gemini-text-model">Text/Caption Model</Label>
                <Select value={geminiTextModel} onValueChange={setGeminiTextModel}>
                  <SelectTrigger id="gemini-text-model">
                    <SelectValue placeholder="Select text model" />
                  </SelectTrigger>
                  <SelectContent>
                    {GEMINI_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.label}</span>
                          <span className="text-xs text-muted-foreground">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Current: {geminiTextModel}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Kie.ai Models */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                Kie.ai Models
              </CardTitle>
              <CardDescription>
                Select which Kie.ai model to use for cost-effective image generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="kieai-model">Image Generation Model</Label>
                <Select value={kieaiModel} onValueChange={setKieaiModel}>
                  <SelectTrigger id="kieai-model">
                    <SelectValue placeholder="Select Kie.ai model" />
                  </SelectTrigger>
                  <SelectContent>
                    {KIEAI_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.label}</span>
                          <span className="text-xs text-muted-foreground">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Current: {kieaiModel}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={saving} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Model Settings'}
            </Button>
          </div>

          {/* Info Box */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <div className="font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Model Selection Tips
                </div>
                <ul className="space-y-1 text-muted-foreground ml-6 list-disc">
                  <li><strong>Gemini 2.5 Flash Image:</strong> Recommended for best image quality and character consistency</li>
                  <li><strong>Gemini 2.0 Flash Exp:</strong> Faster generation with experimental features</li>
                  <li><strong>ByteDance SeeDream:</strong> Best cost-to-quality ratio for Kie.ai</li>
                  <li><strong>Flux Schnell:</strong> Fastest Kie.ai model for quick iterations</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
