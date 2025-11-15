'use client';

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Character } from "@/lib/firebase/config/types";

interface EditCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character | null;
  onRename: (characterId: string, newName: string) => Promise<void>;
  onDelete: (characterId: string) => Promise<void>;
}

export default function EditCharacterModal({
  isOpen,
  onClose,
  character,
  onRename,
  onDelete,
}: EditCharacterModalProps) {
  const [characterName, setCharacterName] = useState(character?.name || "");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update name when character changes
  useState(() => {
    if (character) {
      setCharacterName(character.name);
    }
  });

  const handleRename = async () => {
    if (!character || !characterName.trim()) {
      setError("Please provide a valid name");
      return;
    }

    if (characterName.trim() === character.name) {
      handleClose();
      return;
    }

    try {
      setIsRenaming(true);
      setError(null);
      await onRename(character.id, characterName.trim());
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename character");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!character) return;

    try {
      setIsDeleting(true);
      setError(null);
      await onDelete(character.id);
      setShowDeleteConfirm(false);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete character");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setCharacterName(character?.name || "");
    setError(null);
    setIsRenaming(false);
    setIsDeleting(false);
    onClose();
  };

  if (!character) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Character</DialogTitle>
            <DialogDescription>
              Rename or delete this character model
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center">
              <img
                src={character.thumbnailUrl}
                alt={character.name}
                className="h-[120px] w-[120px] rounded-md object-cover"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-character-name">Character Name</Label>
              <Input
                id="edit-character-name"
                placeholder="Enter character name"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                disabled={isRenaming || isDeleting}
                maxLength={50}
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isRenaming || isDeleting}
              className="sm:mr-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isRenaming || isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRename}
                disabled={!characterName.trim() || isRenaming || isDeleting}
              >
                {isRenaming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Character?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{character.name}&quot; and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
