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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2 } from "lucide-react";
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
import type { Character } from "@/lib/firebase/config/types";

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
  const [name, setName] = useState(character?.name || "");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleRename = async () => {
    if (!character || !name.trim()) return;

    try {
      setIsRenaming(true);
      await onRename(character.id, name.trim());
      onClose();
    } catch (error) {
      console.error("Failed to rename character:", error);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!character) return;

    try {
      setIsDeleting(true);
      await onDelete(character.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error("Failed to delete character:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!character) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Character</DialogTitle>
            <DialogDescription>
              Rename or delete this character
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="aspect-square w-32 mx-auto rounded-lg overflow-hidden bg-muted">
              <img
                src={character.thumbnailUrl || character.imageUrl}
                alt={character.name}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="character-name">Character Name</Label>
              <Input
                id="character-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter character name"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isRenaming || isDeleting}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isRenaming || isDeleting}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRename}
                disabled={isRenaming || !name.trim() || name === character.name}
                className="flex-1 sm:flex-none"
              >
                {isRenaming ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
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
              Are you sure you want to delete &quot;{character.name}&quot;? This action
              cannot be undone. All associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
