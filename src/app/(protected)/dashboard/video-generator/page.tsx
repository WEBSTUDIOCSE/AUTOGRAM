'use client';

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import VideoPromptInput from "@/components/module6/VideoPromptInput";
import VideoPreview from "@/components/module6/VideoPreview";
import VideoSettings from "@/components/module6/VideoSettings";
import VideoInstagramPost from "@/components/module6/VideoInstagramPost";
import { useAuth } from "@/contexts/AuthContext";

export default function VideoGeneratorPage() {
  const { user } = useAuth();
  // Generation state
  const [prompt, setPrompt] = useState("");
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  // Settings
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState("5");
  const [resolution, setResolution] = useState("720p");
  const [selectedModel, setSelectedModel] = useState<string>('bytedance/v1-pro-text-to-video');

  // Error handling
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadModelPreference();
    }
  }, [user]);

  const loadModelPreference = async () => {
    try {
      const { UserPreferencesService } = await import('@/lib/firebase/services');
      const prefsResponse = await UserPreferencesService.getPreferences();
      const prefs = prefsResponse.data;
      if (prefs?.textToVideoModel) {
        setSelectedModel(prefs.textToVideoModel);
        console.log('✅ Loaded text-to-video model:', prefs.textToVideoModel);
      }
    } catch (err) {
      console.error('Failed to load model preference:', err);
    }
  };

  const handleRefinePrompt = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt first");
      return;
    }

    try {
      setIsRefining(true);
      setError(null);

      const { Module6PromptRefiner } = await import('@/lib/services/module6/prompt-refiner.service');
      const refinedPrompt = await Module6PromptRefiner.refineVideoPrompt(prompt);
      setPrompt(refinedPrompt);
    } catch (err) {
      console.error('Failed to refine prompt:', err);
      setError(err instanceof Error ? err.message : 'Failed to refine prompt');
    } finally {
      setIsRefining(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a video description");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch("/api/video-generation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          aspectRatio,
          duration,
          resolution,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate video");
      }

      const result = await response.json();
      setGeneratedVideoUrl(result.videoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate video");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedVideoUrl) return;

    try {
      const response = await fetch(generatedVideoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `video-${Date.now()}.mp4`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download video");
    }
  };

  const handleRegenerate = () => {
    setGeneratedVideoUrl(null);
    handleGenerate();
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">AI Video Generator</h1>
        <p className="text-muted-foreground">
          Create stunning AI-generated videos from text descriptions
        </p>
      </div>

      <Separator />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Generation Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Input */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <VideoPromptInput
                value={prompt}
                onChange={setPrompt}
                disabled={isGenerating}
              />

              <VideoSettings
                aspectRatio={aspectRatio}
                onAspectRatioChange={setAspectRatio}
                duration={duration}
                onDurationChange={setDuration}
                resolution={resolution}
                onResolutionChange={setResolution}
                disabled={isGenerating}
              />

              <div className="flex gap-2">
                <Button
                  onClick={handleRefinePrompt}
                  disabled={!prompt.trim() || isGenerating || isRefining}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  {isRefining ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Refining...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-5 w-5" />
                      Refine Prompt
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating || isRefining}
                  className="flex-1"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Video...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Video
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Model settings can be configured in AI Settings • Generation takes 1-3 minutes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          <VideoPreview
            videoUrl={generatedVideoUrl}
            isLoading={isGenerating}
            onDownload={handleDownload}
            onRegenerate={handleRegenerate}
            disabled={isGenerating}
          />

          {/* Instagram Post Component */}
          {user && generatedVideoUrl && (
            <VideoInstagramPost
              videoUrl={generatedVideoUrl}
              prompt={prompt}
              userId={user.uid}
              moduleType="module6"
              disabled={isGenerating}
            />
          )}
        </div>
      </div>
    </div>
  );
}
