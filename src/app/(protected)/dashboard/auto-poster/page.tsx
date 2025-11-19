'use client';

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Character } from "@/lib/firebase/config/types";
import CharacterCarousel from "@/components/module3/CharacterCarousel";
import CharacterPromptInput from "@/components/module3/CharacterPromptInput";
import UploadCharacterModal from "@/components/module3/UploadCharacterModal";
import EditCharacterModal from "@/components/module3/EditCharacterModal";
import GeneratedCharacterPreview from "@/components/module3/GeneratedCharacterPreview";
import AutoPostSettings from "@/components/module3/AutoPostSettings";
import AutoPostHistory from "@/components/module3/AutoPostHistory";
import { InstagramAccountSelector } from "@/components/module1/InstagramAccountSelector";
import { useAuth } from "@/contexts/AuthContext";
import { APIBook } from "@/lib/firebase/services";

export default function AutoPosterPage() {
  const { user } = useAuth();

  // Character management
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [characterToEdit, setCharacterToEdit] = useState<Character | null>(null);
  const [loadingCharacters, setLoadingCharacters] = useState(true);

  // Generation state
  const [scenePrompt, setScenePrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  // Instagram posting state
  const [selectedAccount, setSelectedAccount] = useState('account1');
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // Error handling
  const [error, setError] = useState<string | null>(null);

  // Load user's characters on mount
  useEffect(() => {
    if (user) {
      loadCharacters();
    }
  }, [user]);

  const loadCharacters = async () => {
    if (!user) return;
    
    try {
      setLoadingCharacters(true);
      const userCharacters = await APIBook.character.getUserCharacters(user.uid);
      setCharacters(userCharacters);
    } catch (err) {
      console.error('Failed to load characters:', err);
      setError('Failed to load characters');
    } finally {
      setLoadingCharacters(false);
    }
  };

  const handleUploadCharacter = async (file: File, name: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const character = await APIBook.character.uploadCharacter(file, name, user.uid);
    setCharacters((prev) => [character, ...prev]);
  };

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
    }
  };

  const handleEditCharacter = (character: Character) => {
    setCharacterToEdit(character);
    setShowEditModal(true);
  };

  const handleRefinePrompt = async () => {
    if (!scenePrompt.trim()) {
      setError("Please enter a prompt first");
      return;
    }

    try {
      setIsRefining(true);
      setError(null);

      const refinedPrompt = await APIBook.promptRefiner.refinePrompt(scenePrompt);
      setScenePrompt(refinedPrompt);
      
      // Show success feedback briefly
      setError(null);
    } catch (err) {
      console.error('Failed to refine prompt:', err);
      setError(err instanceof Error ? err.message : 'Failed to refine prompt');
    } finally {
      setIsRefining(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedCharacter || !scenePrompt.trim() || !user) {
      setError("Please select a character and provide a scene description");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      // Generate image with character
      const result = await APIBook.characterAI.generateWithCharacter(
        selectedCharacter.imageBase64,
        scenePrompt
      );
      
      setGeneratedImage(result.imageBase64);
      setCaption(result.caption);
      setHashtags(result.hashtags);
      
      // Update character usage statistics
      await APIBook.character.updateCharacterUsage(selectedCharacter.id);
      
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `auto-poster-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegenerate = () => {
    setGeneratedImage(null);
    handleGenerate();
  };

  const handlePostToInstagram = async () => {
    if (!generatedImage || !selectedAccount || !user || !selectedCharacter) {
      setError("Please select an Instagram account");
      return;
    }

    try {
      setIsPosting(true);
      setError(null);

      // Extract base64 from data URL
      const base64 = generatedImage.replace(/^data:image\/\w+;base64,/, '');
      
      // Upload to storage with module3 organization
      const imageUrl = await APIBook.storage.uploadImage(base64, user.uid, 'module3', 'generated');
      
      // Post to Instagram with selected account
      const instagramPostId = await APIBook.instagram.postImage(
        imageUrl,
        `${caption}\n\n${hashtags}`,
        selectedAccount
      );
      
      // Get account info for display
      const account = APIBook.instagram.getAccountById(selectedAccount);
      
      // Save character post (without base64 to avoid Firestore 1MB limit)
      await APIBook.characterPost.saveCharacterPost({
        userId: user.uid,
        moduleType: 'module3',
        characterId: selectedCharacter.id,
        characterName: selectedCharacter.name,
        prompt: scenePrompt,
        generatedImageBase64: '',
        generatedImageUrl: imageUrl,
        caption,
        hashtags,
        instagramAccountId: selectedAccount,
        instagramAccountName: account?.name || 'Instagram Account',
        postedToInstagram: true,
        instagramPostId: instagramPostId,
        model: 'character-ai',
        timestamp: new Date().toISOString(),
      });

      // Reset form
      setGeneratedImage(null);
      setScenePrompt("");
      setCaption("");
      setHashtags("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post to Instagram");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Auto-Poster</h1>
        <p className="text-muted-foreground">
          Automate your Instagram posting with AI-generated character scenes
        </p>
      </div>

      <Separator />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Character Selection */}
      <Card>
        <CardContent className="p-6">
          {loadingCharacters ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <CharacterCarousel
              characters={characters}
              selectedCharacter={selectedCharacter}
              onSelectCharacter={setSelectedCharacter}
              onEditCharacter={handleEditCharacter}
              onUploadClick={() => setShowUploadModal(true)}
            />
          )}
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="settings">Auto-Post Settings</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column - Input */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <CharacterPromptInput
                    value={scenePrompt}
                    onChange={setScenePrompt}
                    disabled={!selectedCharacter || isGenerating || isRefining}
                  />

                  <div className="flex gap-2">
                    <Button
                      onClick={handleRefinePrompt}
                      disabled={!scenePrompt.trim() || isGenerating || isRefining}
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
                      disabled={!selectedCharacter || !scenePrompt.trim() || isGenerating || isRefining}
                      className="flex-1"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Generate Scene
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Preview */}
            <div className="space-y-6">
              <GeneratedCharacterPreview
                imageBase64={generatedImage}
                isLoading={isGenerating}
                onDownload={handleDownload}
                onRegenerate={handleRegenerate}
                disabled={isGenerating || isPosting}
              />

              {/* Instagram Posting Section */}
              {generatedImage && (
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold">Post to Instagram</h3>

                    <div className="space-y-2">
                      <Label htmlFor="caption">Caption</Label>
                      <Textarea
                        id="caption"
                        placeholder="Enter caption..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        disabled={isPosting}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hashtags">Hashtags</Label>
                      <Input
                        id="hashtags"
                        placeholder="Enter hashtags..."
                        value={hashtags}
                        onChange={(e) => setHashtags(e.target.value)}
                        disabled={isPosting}
                      />
                    </div>

                    <InstagramAccountSelector
                      selectedAccountId={selectedAccount}
                      onSelectAccount={setSelectedAccount}
                    />

                    <Button
                      onClick={handlePostToInstagram}
                      disabled={!selectedAccount || isPosting}
                      className="w-full"
                    >
                      {isPosting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        "Post to Instagram"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Auto-Post Settings Tab */}
        <TabsContent value="settings">
          {user && <AutoPostSettings userId={user.uid} characters={characters} />}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          {user && <AutoPostHistory userId={user.uid} />}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <UploadCharacterModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUploadCharacter}
      />

      <EditCharacterModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setCharacterToEdit(null);
        }}
        character={characterToEdit}
        onRename={handleRenameCharacter}
        onDelete={handleDeleteCharacter}
      />
    </div>
  );
}
