'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import type { FamilyPromptCategory } from '@/lib/services/module4';
import { FamilyPromptService } from '@/lib/services/module4';

interface PromptManagerProps {
  userId: string;
  familyProfileId: string;
  onPromptsUpdated: () => void;
}

export function PromptManager({ userId, familyProfileId, onPromptsUpdated }: PromptManagerProps) {
  const [category, setCategory] = useState<FamilyPromptCategory>('couple');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [defaultPrompts, setDefaultPrompts] = useState<string[]>([]);

  useEffect(() => {
    const loadDefaults = async () => {
      const prompts = await FamilyPromptService.getDefaultPrompts(category);
      setDefaultPrompts(prompts.slice(0, 5));
    };
    loadDefaults();
  }, [category]);

  const handleAddCustomPrompt = async () => {
    if (!customPrompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    setIsSubmitting(true);
    try {
      await FamilyPromptService.createPrompt(
        userId,
        familyProfileId,
        category,
        customPrompt.trim()
      );
      setCustomPrompt('');
      onPromptsUpdated();
    } catch (error) {
      alert('Failed to add prompt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitializeDefaults = async () => {
    setIsInitializing(true);
    try {
      await FamilyPromptService.initializeDefaultPrompts(userId, familyProfileId);
      onPromptsUpdated();
    } catch (error) {
      alert('Failed to initialize default prompts');
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Prompts</CardTitle>
        <CardDescription>
          Add custom prompts or initialize with default prompts for quick start
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Initialize Default Prompts */}
        <div className="rounded-lg border border-dashed p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium">Quick Start</h4>
              <p className="text-sm text-muted-foreground">
                Initialize with 15 default prompts (5 each for Couple, Family, Kids)
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleInitializeDefaults}
              disabled={isInitializing}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isInitializing ? 'Initializing...' : 'Initialize Defaults'}
            </Button>
          </div>
        </div>

        {/* Add Custom Prompt */}
        <div className="space-y-3">
          <Label>Add Custom Prompt</Label>
          <div className="flex gap-2">
            <Select value={category} onValueChange={(v) => setCategory(v as FamilyPromptCategory)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="couple">Couple</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="kids">Kids</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Enter your prompt..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={isSubmitting}
            />
            <Button onClick={handleAddCustomPrompt} disabled={isSubmitting}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Preview of default prompts for selected category */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Example {category} prompts:
          </Label>
          <div className="flex flex-wrap gap-2">
            {defaultPrompts.map((prompt, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {prompt}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
