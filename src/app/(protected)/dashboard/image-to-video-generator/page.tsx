'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sparkles, Info, Wand2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ImageUploadZone from "@/components/module7/ImageUploadZone";
import ImageToVideoSettings from "@/components/module7/ImageToVideoSettings";
import ImageToVideoPreview from "@/components/module7/ImageToVideoPreview";
import ImageToVideoInstagramPost from "@/components/module7/ImageToVideoInstagramPost";
import { UnifiedImageStorageService } from "@/lib/services/unified/image-storage.service";
import { useAuth } from "@/contexts/AuthContext";

export default function ImageToVideoGeneratorPage() {
  const { user } = useAuth();
  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Video state
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  // Settings
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState("5");
  const [resolution, setResolution] = useState("720p");
  const [generateAudio, setGenerateAudio] = useState(false);
  const [cameraFixed, setCameraFixed] = useState(false);

  // Error handling
  const [error, setError] = useState<string | null>(null);

  const handleRefinePrompt = async () => {
    if (!prompt.trim()) {
      setError("Please enter a motion description first");
      return;
    }

    try {
      setIsRefining(true);
      setError(null);

      const { Module7PromptRefiner } = await import('@/lib/services/module7/prompt-refiner.service');
      const refinedPrompt = await Module7PromptRefiner.refineMotionPrompt(prompt);
      setPrompt(refinedPrompt);
    } catch (err) {
      console.error('Failed to refine prompt:', err);
      setError(err instanceof Error ? err.message : 'Failed to refine prompt');
    } finally {
      setIsRefining(false);
    }
  };

  const handleImageSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB");
      return;
    }

    setError(null);
    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageUrl(null);
    setGeneratedVideoUrl(null);
  };

  const handleGenerate = async () => {
    if (!selectedImage) {
      setError("Please upload an image first");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      if (!user?.uid) {
        throw new Error("User not authenticated");
      }

      // Upload image to storage
      const uploadResult = await UnifiedImageStorageService.uploadFromFile(
        selectedImage,
        user.uid,
        'module7/image-to-video'
      );

      setImageUrl(uploadResult.imageUrl);

      // Generate video
      const response = await fetch("/api/video-generation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim() || "Animate this image naturally",
          imageUrl: uploadResult.imageUrl,
          duration,
          resolution,
          generateAudio,
          cameraFixed,
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
      link.download = `image-to-video-${Date.now()}.mp4`;
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
        <h1 className="text-3xl font-bold">Image to Video Generator</h1>
        <p className="text-muted-foreground">
          Transform your images into stunning AI-generated videos with motion and animation
        </p>
      </div>

      <Separator />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> Model settings can be configured in{" "}
          <a href="/dashboard/ai-settings" className="underline">
            AI Settings
          </a>
          . The selected image-to-video model will be used for generation.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Image Upload & Settings */}
        <div className="space-y-6">
          <ImageUploadZone
            selectedImage={selectedImage}
            preview={imagePreview}
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            disabled={isGenerating}
          />

          <ImageToVideoSettings
            prompt={prompt}
            onPromptChange={setPrompt}
            duration={duration}
            onDurationChange={setDuration}
            resolution={resolution}
            onResolutionChange={setResolution}
            generateAudio={generateAudio}
            onGenerateAudioChange={setGenerateAudio}
            cameraFixed={cameraFixed}
            onCameraFixedChange={setCameraFixed}
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
                  Refine Motion
                </>
              )}
            </Button>

            <Button
              onClick={handleGenerate}
              disabled={!selectedImage || isGenerating || isRefining}
              className="flex-1"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Video...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Video
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Column: Video Preview */}
        <div className="space-y-6">
          <ImageToVideoPreview
            videoUrl={generatedVideoUrl}
            onDownload={handleDownload}
            onRegenerate={handleRegenerate}
            isGenerating={isGenerating}
          />

          {/* Instagram Post Component */}
          {user && generatedVideoUrl && (
            <ImageToVideoInstagramPost
              videoUrl={generatedVideoUrl}
              prompt={prompt}
              userId={user.uid}
              disabled={isGenerating}
            />
          )}
        </div>
      </div>
    </div>
  );
}
