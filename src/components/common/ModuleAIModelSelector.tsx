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
  imageToImageModel?: string;
  textToVideoModel?: string;
  imageToVideoModel?: string;
}

interface ModuleAIModelSelectorProps {
  moduleId: string;
  moduleName: string;
  description?: string;
  showTextToImageModel?: boolean;
  showImageToImageModel?: boolean;
  showTextToVideoModel?: boolean;
  showImageToVideoModel?: boolean;
  selectedTextToImageModel?: string;
  selectedImageToImageModel?: string;
  selectedTextToVideoModel?: string;
  selectedImageToVideoModel?: string;
  onTextToImageModelChange?: (model: string) => void;
  onImageToImageModelChange?: (model: string) => void;
  onTextToVideoModelChange?: (model: string) => void;
  onImageToVideoModelChange?: (model: string) => void;
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
  showTextToImageModel = true,
  showImageToImageModel = false,
  showTextToVideoModel = true,
  showImageToVideoModel = false,
  selectedTextToImageModel = '',
  selectedImageToImageModel = '',
  selectedTextToVideoModel = '',
  selectedImageToVideoModel = '',
  onTextToImageModelChange,
  onImageToImageModelChange,
  onTextToVideoModelChange,
  onImageToVideoModelChange,
  disabled = false
}: ModuleAIModelSelectorProps) {
  // Get available models
  const textToImageModels = React.useMemo(() => getModelsByType('text-to-image'), []);
  const imageToImageModels = React.useMemo(() => getModelsByType('image-to-image'), []);
  const textToVideoModels = React.useMemo(() => getModelsByType('text-to-video'), []);
  const imageToVideoModels = React.useMemo(() => getModelsByType('image-to-video'), []);

  // Group models by category
  const groupedTextToImageModels = React.useMemo(() => {
    const groups: Record<string, ModelMetadata[]> = {};
    textToImageModels.forEach(model => {
      const category = model.category || model.provider;
      if (!groups[category]) groups[category] = [];
      groups[category].push(model);
    });
    return groups;
  }, [textToImageModels]);

  const groupedImageToImageModels = React.useMemo(() => {
    const groups: Record<string, ModelMetadata[]> = {};
    imageToImageModels.forEach(model => {
      const category = model.category || model.provider;
      if (!groups[category]) groups[category] = [];
      groups[category].push(model);
    });
    return groups;
  }, [imageToImageModels]);

  const groupedTextToVideoModels = React.useMemo(() => {
    const groups: Record<string, ModelMetadata[]> = {};
    textToVideoModels.forEach(model => {
      const category = model.category || model.provider;
      if (!groups[category]) groups[category] = [];
      groups[category].push(model);
    });
    return groups;
  }, [textToVideoModels]);

  const groupedImageToVideoModels = React.useMemo(() => {
    const groups: Record<string, ModelMetadata[]> = {};
    imageToVideoModels.forEach(model => {
      const category = model.category || model.provider;
      if (!groups[category]) groups[category] = [];
      groups[category].push(model);
    });
    return groups;
  }, [imageToVideoModels]);

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
        {/* Text-to-Image Model Selection */}
        {showTextToImageModel && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Image className="h-4 w-4" />
              Text-to-Image Generation Model
            </Label>
            <Select
              value={selectedTextToImageModel || '__global__'}
              onValueChange={(value) => onTextToImageModelChange?.(value === '__global__' ? '' : value)}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select text-to-image model">
                  {selectedTextToImageModel ? getSelectedModelName(selectedTextToImageModel, textToImageModels) : 'Use Global AI Settings'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__global__">
                  <span className="text-muted-foreground">Use Global AI Settings (Fallback)</span>
                </SelectItem>
                {Object.entries(groupedTextToImageModels).map(([category, models]) => (
                  <React.Fragment key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                      {category}
                    </div>
                    {models.map(renderModelOption)}
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
            {selectedTextToImageModel && (
              <p className="text-xs text-muted-foreground">
                {textToImageModels.find(m => m.id === selectedTextToImageModel)?.description}
              </p>
            )}
          </div>
        )}

        {/* Image-to-Image Model Selection */}
        {showImageToImageModel && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Image className="h-4 w-4" />
              Image-to-Image Generation Model
            </Label>
            <Select
              value={selectedImageToImageModel || '__global__'}
              onValueChange={(value) => onImageToImageModelChange?.(value === '__global__' ? '' : value)}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select image-to-image model">
                  {selectedImageToImageModel ? getSelectedModelName(selectedImageToImageModel, imageToImageModels) : 'Use Global AI Settings'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__global__">
                  <span className="text-muted-foreground">Use Global AI Settings (Fallback)</span>
                </SelectItem>
                {Object.entries(groupedImageToImageModels).map(([category, models]) => (
                  <React.Fragment key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                      {category}
                    </div>
                    {models.map(renderModelOption)}
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
            {selectedImageToImageModel && (
              <p className="text-xs text-muted-foreground">
                {imageToImageModels.find(m => m.id === selectedImageToImageModel)?.description}
              </p>
            )}
          </div>
        )}

        {/* Text-to-Video Model Selection */}
        {showTextToVideoModel && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Video className="h-4 w-4" />
              Text-to-Video Generation Model
            </Label>
            <Select
              value={selectedTextToVideoModel || '__global__'}
              onValueChange={(value) => onTextToVideoModelChange?.(value === '__global__' ? '' : value)}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select text-to-video model">
                  {selectedTextToVideoModel ? getSelectedModelName(selectedTextToVideoModel, textToVideoModels) : 'Use Global AI Settings'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__global__">
                  <span className="text-muted-foreground">Use Global AI Settings (Fallback)</span>
                </SelectItem>
                {Object.entries(groupedTextToVideoModels).map(([category, models]) => (
                  <React.Fragment key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                      {category}
                    </div>
                    {models.map(renderModelOption)}
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
            {selectedTextToVideoModel && (
              <p className="text-xs text-muted-foreground">
                {textToVideoModels.find(m => m.id === selectedTextToVideoModel)?.description}
              </p>
            )}
          </div>
        )}

        {/* Image-to-Video Model Selection */}
        {showImageToVideoModel && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Video className="h-4 w-4" />
              Image-to-Video Generation Model
            </Label>
            <Select
              value={selectedImageToVideoModel || '__global__'}
              onValueChange={(value) => onImageToVideoModelChange?.(value === '__global__' ? '' : value)}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select image-to-video model">
                  {selectedImageToVideoModel ? getSelectedModelName(selectedImageToVideoModel, imageToVideoModels) : 'Use Global AI Settings'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__global__">
                  <span className="text-muted-foreground">Use Global AI Settings (Fallback)</span>
                </SelectItem>
                {Object.entries(groupedImageToVideoModels).map(([category, models]) => (
                  <React.Fragment key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                      {category}
                    </div>
                    {models.map(renderModelOption)}
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
            {selectedImageToVideoModel && (
              <p className="text-xs text-muted-foreground">
                {imageToVideoModels.find(m => m.id === selectedImageToVideoModel)?.description}
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
