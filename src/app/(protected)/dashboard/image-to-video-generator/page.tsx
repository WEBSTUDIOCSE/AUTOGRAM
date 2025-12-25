'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sparkles, Info, Wand2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ImageUploadZone from "@/components/module7/ImageUploadZone";
import ImageToVideoSettings from "@/components/module7/ImageToVideoSettings";
import ImageToVideoPreview from "@/components/module7/ImageToVideoPreview";
import ImageToVideoInstagramPost from "@/components/module7/ImageToVideoInstagramPost";
import CharacterCarousel from "@/components/module2/CharacterCarousel";
import UploadCharacterModal from "@/components/module2/UploadCharacterModal";
import EditCharacterModal from "@/components/module2/EditCharacterModal";
import { UnifiedImageStorageService } from "@/lib/services/unified/image-storage.service";
import { useAuth } from "@/contexts/AuthContext";
import { Character } from "@/lib/firebase/config/types";
import { APIBook } from "@/lib/firebase/services";

export default function ImageToVideoGeneratorPage() {
  const { user } = useAuth();
  
  // Character management
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [characterToEdit, setCharacterToEdit] = useState<Character | null>(null);
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  
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
  const [selectedModel, setSelectedModel] = useState<string>('hailuo/2-3-image-to-video-pro');

  // Error handling
  const [error, setError] = useState<string | null>(null);

  // Load user's characters on mount
  useEffect(() => {
    if (user) {
      loadCharacters();
      loadModelPreference();
    }
  }, [user]);

  const loadModelPreference = async () => {
    try {
      const { UserPreferencesService } = await import('@/lib/firebase/services');
      const prefsResponse = await UserPreferencesService.getPreferences();
      const prefs = prefsResponse.data;
      if (prefs?.imageToVideoModel) {
        setSelectedModel(prefs.imageToVideoModel);
        console.log('✅ Loaded image-to-video model:', prefs.imageToVideoModel);
      }
    } catch (err) {
      console.error('Failed to load model preference:', err);
    }
  };

  const loadCharacters = async () => {
    if (!user) return;
    
    try {
      setLoadingCharacters(true);
      // Load only characters uploaded from Module 7
      const userCharacters = await APIBook.character.getCharactersByModule(user.uid, 'module7');
      setCharacters(userCharacters);
    } catch (err) {
      console.error('Failed to load characters:', err);
      setError('Failed to load characters');
    } finally {
      setLoadingCharacters(false);
    }
  };

  const handleSelectCharacter = async (character: Character) => {
    setSelectedCharacter(character);
    setError(null);
    
    // Set the preview directly from the character's imageUrl
    setImagePreview(character.imageUrl);
    
    // Don't try to fetch - just store the URL for later use
    // Create a dummy File object to satisfy the form validation
    const dummyBlob = new Blob([''], { type: 'image/jpeg' });
    const dummyFile = new File([dummyBlob], 'character-image', { type: 'image/jpeg' });
    setSelectedImage(dummyFile);
  };

  const handleUploadCharacter = async (file: File, name: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const defaultAccountId = 'account_17841478413044591';
    const character = await APIBook.character.uploadCharacter(file, name, user.uid, defaultAccountId, 'module7');
    setCharacters((prev) => [character, ...prev]);
    setShowUploadModal(false);
  };;

  const handleRenameCharacter = async (characterId: string, newName: string) => {
    await APIBook.character.renameCharacter(characterId, newName);
    setCharacters((prev) =>
      prev.map((char) =>
        char.id === characterId ? { ...char, name: newName } : char
      )
    );
  };

  const handleDeleteCharacter = async (characterId: string) => {
    if (!user) return;
    
    await APIBook.character.deleteCharacter(characterId, user.uid);
    setCharacters((prev) => prev.filter((char) => char.id !== characterId));
    
    if (selectedCharacter?.id === characterId) {
      setSelectedCharacter(null);
      setSelectedImage(null);
      setImagePreview(null);
    }
  };

  const handleEditCharacter = (character: Character) => {
    setCharacterToEdit(character);
    setShowEditModal(true);
  };

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

      // Check if we're using a selected character's image
      let imageUrlToUse: string;
      
      if (selectedCharacter && selectedCharacter.imageUrl) {
        // Use the character's existing Firebase Storage URL directly
        imageUrlToUse = selectedCharacter.imageUrl;
        console.log('Using character image URL:', imageUrlToUse);
      } else {
        // Upload new image to storage
        const uploadResult = await UnifiedImageStorageService.uploadFromFile(
          selectedImage,
          user.uid,
          'module7/image-to-video'
        );
        imageUrlToUse = uploadResult.imageUrl;
        console.log('Uploaded new image:', imageUrlToUse);
      }

      // Generate video
      const response = await fetch("/api/video-generation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim() || "Animate this image naturally",
          imageUrl: imageUrlToUse,
          model: selectedModel,
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
          {/* Character Carousel */}
          {user && (
            <CharacterCarousel
              characters={characters}
              selectedCharacter={selectedCharacter}
              onSelectCharacter={handleSelectCharacter}
              onEditCharacter={handleEditCharacter}
              onUploadClick={() => setShowUploadModal(true)}
            />
          )}

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

      {/* Modals */}
      {user && (
        <>
          <UploadCharacterModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            onUpload={handleUploadCharacter}
          />

          {characterToEdit && (
            <EditCharacterModal
              isOpen={showEditModal}
              character={characterToEdit}
              onClose={() => {
                setShowEditModal(false);
                setCharacterToEdit(null);
              }}
              onRename={handleRenameCharacter}
              onDelete={handleDeleteCharacter}
            />
          )}
        </>
      )}
    </div>
  );
}
