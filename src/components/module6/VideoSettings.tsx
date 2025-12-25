'use client';

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VideoSettingsProps {
  aspectRatio: string;
  onAspectRatioChange: (value: string) => void;
  duration: string;
  onDurationChange: (value: string) => void;
  resolution: string;
  onResolutionChange: (value: string) => void;
  disabled?: boolean;
}

export default function VideoSettings({
  aspectRatio,
  onAspectRatioChange,
  duration,
  onDurationChange,
  resolution,
  onResolutionChange,
  disabled = false,
}: VideoSettingsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
        <Select value={aspectRatio} onValueChange={onAspectRatioChange} disabled={disabled}>
          <SelectTrigger id="aspect-ratio">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1:1">1:1 (Square)</SelectItem>
            <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
            <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
            <SelectItem value="4:3">4:3 (Standard)</SelectItem>
            <SelectItem value="3:4">3:4 (Vertical)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duration</Label>
        <Select value={duration} onValueChange={onDurationChange} disabled={disabled}>
          <SelectTrigger id="duration">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 seconds</SelectItem>
            <SelectItem value="8">8 seconds</SelectItem>
            <SelectItem value="10">10 seconds</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="resolution">Resolution</Label>
        <Select value={resolution} onValueChange={onResolutionChange} disabled={disabled}>
          <SelectTrigger id="resolution">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="720p">720p</SelectItem>
            <SelectItem value="1080p">1080p</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
