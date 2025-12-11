'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle, CheckCircle2, RefreshCw, Zap, DollarSign } from 'lucide-react';
import { AIService } from '@/lib/services/ai.service';
import type { ProviderType } from '@/lib/services/image-generation';
import { UserPreferencesService } from '@/lib/firebase/services';

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
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('gemini');
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
      // Get saved provider from Firebase or default to gemini
      const prefsResponse = await UserPreferencesService.getPreferences();
      const currentProvider = prefsResponse.data?.aiProvider || 'gemini';
      console.log('✅ Provider loaded from Firebase:', currentProvider);
      setSelectedProvider(currentProvider);
      AIService.setDefaultProvider(currentProvider);

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
      console.log(`💾 Saving provider to Firebase: ${selectedProvider}`);
      // Save to Firebase
      await UserPreferencesService.updateAIProvider(selectedProvider);
      AIService.setDefaultProvider(selectedProvider);
      
      console.log(`✅ Provider successfully saved to Firebase: ${selectedProvider}`);
      
      setTimeout(() => {
        setSaving(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to save provider:', error);
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
          AI Image Generation Provider
        </CardTitle>
        <CardDescription>
          Choose which AI service to use for image generation.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Provider Selection */}
        <RadioGroup value={selectedProvider} onValueChange={(value) => setSelectedProvider(value as ProviderType)}>
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
