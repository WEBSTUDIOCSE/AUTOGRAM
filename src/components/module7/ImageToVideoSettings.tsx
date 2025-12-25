'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface ImageToVideoSettingsProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  duration: string;
  onDurationChange: (value: string) => void;
  resolution: string;
  onResolutionChange: (value: string) => void;
  generateAudio: boolean;
  onGenerateAudioChange: (value: boolean) => void;
  cameraFixed: boolean;
  onCameraFixedChange: (value: boolean) => void;
  disabled?: boolean;
}

export default function ImageToVideoSettings({
  prompt,
  onPromptChange,
  duration,
  onDurationChange,
  resolution,
  onResolutionChange,
  generateAudio,
  onGenerateAudioChange,
  cameraFixed,
  onCameraFixedChange,
  disabled = false,
}: ImageToVideoSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Video Settings</CardTitle>
        <CardDescription>
          Configure your video generation parameters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prompt */}
        <div className="space-y-2">
          <Label htmlFor="prompt">Motion Description (Optional)</Label>
          <Textarea
            id="prompt"
            placeholder="Describe the motion or animation you want... (e.g., 'camera slowly zooms in', 'character waves hand')"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            disabled={disabled}
            rows={4}
            maxLength={2000}
          />
          <p className="text-xs text-muted-foreground">
            {prompt.length}/2000 characters
          </p>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label htmlFor="duration">Video Duration</Label>
          <Select
            value={duration}
            onValueChange={onDurationChange}
            disabled={disabled}
          >
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

        {/* Resolution */}
        <div className="space-y-2">
          <Label htmlFor="resolution">Video Resolution</Label>
          <Select
            value={resolution}
            onValueChange={onResolutionChange}
            disabled={disabled}
          >
            <SelectTrigger id="resolution">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="720p">720p (HD)</SelectItem>
              <SelectItem value="1080p">1080p (Full HD)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Camera Fixed */}
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="camera-fixed">Fixed Camera</Label>
            <p className="text-xs text-muted-foreground">
              Keep camera static (no movement)
            </p>
          </div>
          <Switch
            id="camera-fixed"
            checked={cameraFixed}
            onCheckedChange={onCameraFixedChange}
            disabled={disabled}
          />
        </div>

        {/* Generate Audio */}
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="generate-audio">Generate Audio</Label>
            <p className="text-xs text-muted-foreground">
              Add background audio to video
            </p>
          </div>
          <Switch
            id="generate-audio"
            checked={generateAudio}
            onCheckedChange={onGenerateAudioChange}
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
