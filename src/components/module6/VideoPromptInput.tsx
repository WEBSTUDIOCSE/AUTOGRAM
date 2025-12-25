'use client';

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface VideoPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function VideoPromptInput({
  value,
  onChange,
  disabled = false,
}: VideoPromptInputProps) {
  const maxLength = 2000;
  const [charCount, setCharCount] = useState(value.length);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const truncatedValue = newValue.slice(0, maxLength);
    onChange(truncatedValue);
    setCharCount(truncatedValue.length);
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="video-prompt">Video Description</Label>
        <span className="text-xs text-muted-foreground">
          {charCount}/{maxLength}
        </span>
      </div>
      <Textarea
        id="video-prompt"
        placeholder="Describe the video you want to generate (e.g., A serene beach at sunset with waves gently crashing on the shore...)"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="h-[160px] resize-none"
      />
      <p className="text-xs text-muted-foreground">
        Tip: For best results, describe camera movements, scene details, and atmosphere
      </p>
    </div>
  );
}
