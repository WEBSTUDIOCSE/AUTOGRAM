'use client';

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VIDEO_MODELS } from "@/lib/services/image-generation/model-registry";

interface VideoModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  type: 'text-to-video' | 'image-to-video';
  disabled?: boolean;
}

export default function VideoModelSelector({
  value,
  onChange,
  type,
  disabled = false,
}: VideoModelSelectorProps) {
  const models = Object.values(VIDEO_MODELS).filter(model => model.type === type);

  // Group models by category
  const groupedModels = models.reduce((acc, model) => {
    const category = model.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(model);
    return acc;
  }, {} as Record<string, typeof models>);

  return (
    <div className="space-y-2">
      <Label htmlFor="video-model">AI Model</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="video-model">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(groupedModels).map(([category, categoryModels]) => (
            <div key={category}>
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                {category}
              </div>
              {categoryModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {model.speed} • {model.quality} quality
                    </span>
                  </div>
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
