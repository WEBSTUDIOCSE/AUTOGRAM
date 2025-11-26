'use client';

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InstagramAccount } from "@/lib/firebase/config/types";

interface UploadCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, name: string, assignedAccountId: string) => Promise<void>;
  availableAccounts: InstagramAccount[];
}

export default function UploadCharacterModal({
  isOpen,
  onClose,
  onUpload,
  availableAccounts,
}: UploadCharacterModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [characterName, setCharacterName] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !characterName.trim()) {
      setError("Please provide both an image and a name");
      return;
    }

    if (!selectedAccountId) {
      setError("Please select an Instagram account");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      await onUpload(selectedFile, characterName.trim(), selectedAccountId);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload character");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setCharacterName("");
    setSelectedAccountId("");
    setPreview(null);
    setError(null);
    setIsUploading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Character Model</DialogTitle>
          <DialogDescription>
            Upload an image of your character and give it a name
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="character-name">Character Name</Label>
            <Input
              id="character-name"
              placeholder="Enter character name"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              disabled={isUploading}
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram-account">Instagram Account</Label>
            <Select
              value={selectedAccountId}
              onValueChange={setSelectedAccountId}
              disabled={isUploading}
            >
              <SelectTrigger id="instagram-account">
                <SelectValue placeholder="Select an Instagram account" />
              </SelectTrigger>
              <SelectContent>
                {availableAccounts.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground">
                    No accounts available
                  </div>
                ) : (
                  availableAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.username || account.name}
                      {account.username && (
                        <span className="text-xs text-muted-foreground ml-2">
                          @{account.username}
                        </span>
                      )}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Character Image</Label>
            <div
              className="flex h-[200px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed transition-colors hover:border-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="h-8 w-8" />
                  <span className="text-sm">Click to upload image</span>
                  <span className="text-xs">Max 5MB, JPG/PNG</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !characterName.trim() || !selectedAccountId || isUploading}
          >
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
