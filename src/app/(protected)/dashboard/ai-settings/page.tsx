'use client';

import { AIProviderSettings } from '@/components/dashboard/AIProviderSettings';

export default function AISettingsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AI Settings</h1>
        <p className="text-muted-foreground">
          Configure AI providers and model preferences for image generation
        </p>
      </div>

      {/* Settings Content */}
      <AIProviderSettings />
    </div>
  );
}
