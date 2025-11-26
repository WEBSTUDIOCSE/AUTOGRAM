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
import { Loader2, Trash2, Clock, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { CharacterService } from "@/lib/services/character.service";

interface EditCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character | null;
  onRename: (characterId: string, newName: string) => Promise<void>;
  onDelete: (characterId: string) => Promise<void>;
  onUpdate?: () => void; // Callback to refresh character list
}

export default function EditCharacterModal({
  isOpen,
  onClose,
  character,
  onRename,
  onDelete,
  onUpdate,
}: EditCharacterModalProps) {
  const [name, setName] = useState(character?.name || "");
  const [postingTimes, setPostingTimes] = useState<string[]>(character?.postingTimes || []);
  const [newTime, setNewTime] = useState("");
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

  const handleAddTime = () => {
    if (!newTime) return;
    
    // Validate time format HH:mm
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(newTime)) {
      alert("Please enter time in HH:mm format (e.g., 09:00, 14:30)");
      return;
    }

    if (postingTimes.includes(newTime)) {
      alert("This time is already added");
      return;
    }

    setPostingTimes([...postingTimes, newTime].sort());
    setNewTime("");
  };

  const handleRemoveTime = (time: string) => {
    setPostingTimes(postingTimes.filter(t => t !== time));
  };

  const handleSavePostingTimes = async () => {
    if (!character) return;

    try {
      setIsRenaming(true);
      await CharacterService.updatePostingTimes(character.id, postingTimes);
      
      // Also save name if changed
      if (name.trim() !== character.name) {
        await onRename(character.id, name.trim());
      }
      
      onUpdate?.(); // Refresh the character list
      onClose();
    } catch (error) {
      console.error("Failed to update character:", error);
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

  const hasChanges = name.trim() !== character?.name || 
    JSON.stringify(postingTimes.sort()) !== JSON.stringify((character?.postingTimes || []).sort());

  if (!character) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Character</DialogTitle>
            <DialogDescription>
              Update character details and posting schedule
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

            <div className="space-y-2">
              <Label>Posting Times (24-hour format)</Label>
              <p className="text-sm text-muted-foreground">
                Set specific times when this character should post
              </p>
              
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  placeholder="HH:mm"
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={handleAddTime}
                  disabled={!newTime}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {postingTimes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {postingTimes.map((time) => (
                    <Badge key={time} variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {time}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => handleRemoveTime(time)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}

              {postingTimes.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No posting times configured. Add at least one time to enable auto-posting for this character.
                </p>
              )}
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
                onClick={handleSavePostingTimes}
                disabled={isRenaming || !name.trim() || !hasChanges}
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