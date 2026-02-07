'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InstagramAccountSelector } from "@/components/module1/InstagramAccountSelector";
import { Instagram, Loader2 } from "lucide-react";
import { APIBook } from "@/lib/firebase/services";
import { VideoStorageService } from "@/lib/services/video-storage.service";

interface VideoInstagramPostProps {
  videoUrl: string | null;
  prompt: string;
  userId: string;
  moduleType: 'module6' | 'module7';
  disabled?: boolean;
}

export default function VideoInstagramPost({
  videoUrl,
  prompt,
  userId,
  moduleType,
  disabled = false,
}: VideoInstagramPostProps) {
  const [selectedAccount, setSelectedAccount] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("#AI #AIVideo #GeneratedVideo");
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePostToInstagram = async () => {
    if (!videoUrl) {
      setError("No video to post");
      return;
    }

    if (!selectedAccount) {
      setError("Please select an Instagram account");
      return;
    }

    if (!caption.trim()) {
      setError("Please enter a caption");
      return;
    }

    try {
      setIsPosting(true);
      setError(null);
      setSuccess(null);

      // Step 1: Download video and upload to Firebase Storage
      // Instagram requires videos to be hosted on publicly accessible URLs
      const firebaseVideoUrl = await VideoStorageService.uploadVideoFromUrl(
        videoUrl,
        userId,
        moduleType
      );

      // Step 2: Post video to Instagram using Firebase URL
      const instagramPostId = await APIBook.instagram.postImage(
        firebaseVideoUrl,
        `${caption}\n\n${hashtags}`,
        selectedAccount,
        true // isVideo flag
      );

      // Get account info for display
      const account = APIBook.instagram.getAccountById(selectedAccount);

      setSuccess(`Posted successfully to Instagram! Post ID: ${instagramPostId}`);
      
      // Reset form
      setCaption("");
      setHashtags("#AI #AIVideo #GeneratedVideo");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post to Instagram");
    } finally {
      setIsPosting(false);
    }
  };

  if (!videoUrl) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Instagram className="h-5 w-5" />
          Post to Instagram
        </CardTitle>
        <CardDescription>
          Share your AI-generated video on Instagram
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        {/* Instagram Account Selector */}
        <InstagramAccountSelector
          selectedAccountId={selectedAccount}
          onSelectAccount={setSelectedAccount}
        />

        {/* Caption */}
        <div className="space-y-2">
          <Label htmlFor="caption">Caption</Label>
          <Textarea
            id="caption"
            placeholder="Write a caption for your video..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            disabled={disabled || isPosting}
            rows={3}
            maxLength={2200}
          />
          <p className="text-xs text-muted-foreground">
            {caption.length}/2200 characters
          </p>
        </div>

        {/* Hashtags */}
        <div className="space-y-2">
          <Label htmlFor="hashtags">Hashtags</Label>
          <Textarea
            id="hashtags"
            placeholder="#AI #Video #Generated"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            disabled={disabled || isPosting}
            rows={2}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {hashtags.length}/500 characters
          </p>
        </div>

        {/* Post Button */}
        <Button
          onClick={handlePostToInstagram}
          disabled={!selectedAccount || !caption.trim() || disabled || isPosting}
          className="w-full"
        >
          {isPosting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Posting to Instagram...
            </>
          ) : (
            <>
              <Instagram className="mr-2 h-4 w-4" />
              Post to Instagram
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Note: Video must meet Instagram&apos;s requirements (aspect ratio, duration, file size).
          Posting may take a moment to process.
        </p>
      </CardContent>
    </Card>
  );
}
