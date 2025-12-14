'use client';

import * as React from 'react';
import { Info } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export function PromptInput({ value, onChange, maxLength = 1000 }: PromptInputProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-start gap-2 text-xs md:text-sm text-muted-foreground">
          <Info className="h-3 w-3 md:h-4 md:w-4 mt-0.5 shrink-0" />
          <p>
            Be specific! Include style, format, colors, mood, and details for best results.
          </p>
        </div>
        
        <div className="relative">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Describe the image you want to create with specific details (location, style, mood, lighting, composition)..."
            className="min-h-[100px] md:min-h-[120px] resize-none text-sm break-words whitespace-pre-wrap"
            maxLength={maxLength}
          />
          <div className="absolute bottom-2 md:bottom-3 right-2 md:right-3 text-xs text-muted-foreground">
            {value.length}/{maxLength}
          </div>
        </div>
      </div>
    </div>
  );
}
