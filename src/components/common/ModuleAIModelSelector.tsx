'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Cpu, Video, Image, Zap, Star, DollarSign } from 'lucide-react';
import { getModelsByType, type ModelMetadata } from '@/lib/services/image-generation/model-registry';

export interface ModuleModelPreferences {
  textToImageModel?: string;
  textToVideoModel?: string;
}

interface ModuleAIModelSelectorProps {
  moduleId: string;
  moduleName: string;
  description?: string;
  showImageModel?: boolean;
  showVideoModel?: boolean;
  selectedImageModel?: string;
  selectedVideoModel?: string;
  onImageModelChange?: (model: string) => void;
  onVideoModelChange?: (model: string) => void;
  disabled?: boolean;
}

const getQualityColor = (quality: string) => {
  switch (quality) {
    case 'ultra': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'excellent': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'good': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

const getSpeedColor = (speed: string) => {
  switch (speed) {
    case 'very-fast': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'fast': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
    case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    default: return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  }
};

const getCostIcon = (costLevel: string) => {
  switch (costLevel) {
    case 'low': return '💰';
    case 'medium': return '💰💰';
    case 'high': return '💰💰💰';
    default: return '💰';
  }
};

export function ModuleAIModelSelector({
  moduleId,
  moduleName,
  description = 'Select AI models specific to this module. These models will be used instead of global AI settings.',
  showImageModel = true,
  showVideoModel = true,
  selectedImageModel = '',
  selectedVideoModel = '',
  onImageModelChange,
  onVideoModelChange,
  disabled = false
}: ModuleAIModelSelectorProps) {
  // Get available models
  const imageModels = React.useMemo(() => getModelsByType('text-to-image'), []);
  const videoModels = React.useMemo(() => getModelsByType('text-to-video'), []);

  // Group models by category
  const groupedImageModels = React.useMemo(() => {
    const groups: Record<string, ModelMetadata[]> = {};
    imageModels.forEach(model => {
      const category = model.category || model.provider;
      if (!groups[category]) groups[category] = [];
      groups[category].push(model);
    });
    return groups;
  }, [imageModels]);

  const groupedVideoModels = React.useMemo(() => {
    const groups: Record<string, ModelMetadata[]> = {};
    videoModels.forEach(model => {
      const category = model.category || model.provider;
      if (!groups[category]) groups[category] = [];
      groups[category].push(model);
    });
    return groups;
  }, [videoModels]);

  const renderModelOption = (model: ModelMetadata) => (
    <SelectItem key={model.id} value={model.id}>
      <div className="flex items-center gap-2">
        <span className="font-medium">{model.name}</span>
        <Badge variant="outline" className={`text-[10px] px-1 py-0 ${getQualityColor(model.quality)}`}>
          {model.quality}
        </Badge>
        <Badge variant="outline" className={`text-[10px] px-1 py-0 ${getSpeedColor(model.speed)}`}>
          {model.speed}
        </Badge>
        <span className="text-xs opacity-60">{getCostIcon(model.costLevel)}</span>
      </div>
    </SelectItem>
  );

  const getSelectedModelName = (modelId: string, models: ModelMetadata[]) => {
    const model = models.find(m => m.id === modelId);
    return model?.name || 'Select Model';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Cpu className="h-4 w-4" />
          AI Model Selection
        </CardTitle>
        <CardDescription className="text-sm">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Image Model Selection */}
        {showImageModel && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Image className="h-4 w-4" />
              Image Generation Model
            </Label>
            <Select
              value={selectedImageModel}
              onValueChange={onImageModelChange}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select image model">
                  {selectedImageModel && getSelectedModelName(selectedImageModel, imageModels)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  <span className="text-muted-foreground">Use Global AI Settings (Fallback)</span>
                </SelectItem>
                {Object.entries(groupedImageModels).map(([category, models]) => (
                  <React.Fragment key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                      {category}
                    </div>
                    {models.map(renderModelOption)}
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
            {selectedImageModel && (
              <p className="text-xs text-muted-foreground">
                {imageModels.find(m => m.id === selectedImageModel)?.description}
              </p>
            )}
          </div>
        )}

        {/* Video Model Selection */}
        {showVideoModel && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Video className="h-4 w-4" />
              Video Generation Model
            </Label>
            <Select
              value={selectedVideoModel}
              onValueChange={onVideoModelChange}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select video model">
                  {selectedVideoModel && getSelectedModelName(selectedVideoModel, videoModels)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  <span className="text-muted-foreground">Use Global AI Settings (Fallback)</span>
                </SelectItem>
                {Object.entries(groupedVideoModels).map(([category, models]) => (
                  <React.Fragment key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                      {category}
                    </div>
                    {models.map(renderModelOption)}
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
            {selectedVideoModel && (
              <p className="text-xs text-muted-foreground">
                {videoModels.find(m => m.id === selectedVideoModel)?.description}
              </p>
            )}
          </div>
        )}

        {/* Info note */}
        <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <p className="font-medium mb-1">💡 Model Priority:</p>
          <p>Module-specific models are used first. If not selected, global AI settings are used as fallback.</p>
        </div>
      </CardContent>
    </Card>
  );
}
