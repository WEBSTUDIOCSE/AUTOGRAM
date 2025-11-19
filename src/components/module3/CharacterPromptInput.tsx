'use client';

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CharacterPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function CharacterPromptInput({
  value,
  onChange,
  disabled = false,
}: CharacterPromptInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="scene-prompt">Scene Description</Label>
      <Textarea
        id="scene-prompt"
        placeholder="Describe the scene you want to generate with your character... (e.g., 'standing in a futuristic city at sunset')"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={4}
        className="resize-none"
      />
      <p className="text-xs text-muted-foreground">
        Describe what you want your character to do or where they should be
      </p>
    </div>
  );
}
