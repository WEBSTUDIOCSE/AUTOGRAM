'use client';

import { useState } from "react";
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
  const maxLength = 2000;
  const [charCount, setCharCount] = useState(value.length);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    // Allow full paste but truncate if exceeds max
    const truncatedValue = newValue.slice(0, maxLength);
    onChange(truncatedValue);
    setCharCount(truncatedValue.length);
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="character-prompt">Scene Description</Label>
        <span className="text-xs text-muted-foreground">
          {charCount}/{maxLength}
        </span>
      </div>
      <Textarea
        id="character-prompt"
        placeholder="Describe the scene for your character (e.g., standing on a beach at sunset, wearing casual clothes...)"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="h-[160px] resize-none break-words whitespace-pre-wrap"
      />
    </div>
  );
}
