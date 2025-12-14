'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Sparkles,
  Calendar,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { PromptTemplate } from '@/lib/firebase/config/types';
import { APIBook } from '@/lib/firebase/services';

interface PromptLibraryProps {
  userId: string;
}

export default function PromptLibrary({ userId }: PromptLibraryProps) {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);

  // Form states
  const [promptText, setPromptText] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generatingVariations, setGeneratingVariations] = useState(false);
  const [variations, setVariations] = useState<string[]>([]);

  useEffect(() => {
    loadPrompts();
  }, [userId]);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      setError(null);
      const userPrompts = await APIBook.promptLibrary.getUserPrompts(userId);
      setPrompts(userPrompts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrompt = async () => {
    if (!promptText.trim()) {
      setError('Prompt text is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await APIBook.promptLibrary.createPrompt(
        userId,
        promptText.trim(),
        category.trim() || undefined
      );

      setSuccess('Prompt added successfully!');
      setShowAddModal(false);
      setPromptText('');
      setCategory('');
      await loadPrompts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleEditPrompt = async () => {
    if (!selectedPrompt || !promptText.trim()) {
      setError('Prompt text is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await APIBook.promptLibrary.updatePrompt(selectedPrompt.id, {
        basePrompt: promptText.trim(),
        category: category.trim() || undefined,
      });

      setSuccess('Prompt updated successfully!');
      setShowEditModal(false);
      setSelectedPrompt(null);
      setPromptText('');
      setCategory('');
      await loadPrompts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrompt = async () => {
    if (!selectedPrompt) return;

    try {
      setDeleting(true);
      setError(null);

      await APIBook.promptLibrary.deletePrompt(selectedPrompt.id);

      setSuccess('Prompt deleted successfully!');
      setShowDeleteDialog(false);
      setSelectedPrompt(null);
      await loadPrompts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete prompt');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (prompt: PromptTemplate) => {
    try {
      setError(null);
      await APIBook.promptLibrary.toggleActive(prompt.id, !prompt.isActive);
      await loadPrompts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle prompt status');
    }
  };

  const handleGenerateVariations = async (basePrompt: string) => {
    try {
      setGeneratingVariations(true);
      setError(null);
      setVariations([]);

      // TODO: Implement multiple variations in new Module3PromptGenerator
      // For now, just show the base prompt
      setVariations([basePrompt, basePrompt, basePrompt]);
      
      setError('Multiple variations feature coming soon with new prompt generator');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate variations');
    } finally {
      setGeneratingVariations(false);
    }
  };

  const openEditModal = (prompt: PromptTemplate) => {
    setSelectedPrompt(prompt);
    setPromptText(prompt.basePrompt);
    setCategory(prompt.category || '');
    setShowEditModal(true);
  };

  const openDeleteDialog = (prompt: PromptTemplate) => {
    setSelectedPrompt(prompt);
    setShowDeleteDialog(true);
  };

  const getActivePromptsCount = () => prompts.filter((p) => p.isActive).length;
  const getTotalUsage = () => prompts.reduce((sum, p) => sum + p.usageCount, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prompts.length}</div>
            <p className="text-xs text-muted-foreground">
              {getActivePromptsCount()} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalUsage()}</div>
            <p className="text-xs text-muted-foreground">
              Across all prompts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Usage</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {prompts.length > 0 ? Math.round(getTotalUsage() / prompts.length) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Per prompt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
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

      {/* Add Prompt Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Prompt Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage your base prompts for auto-posting
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Prompt
        </Button>
      </div>

      {/* Prompts List */}
      {prompts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No prompts yet</p>
            <Button onClick={() => setShowAddModal(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Prompt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {prompts.map((prompt) => (
            <Card key={prompt.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-base">{prompt.basePrompt}</CardTitle>
                      {prompt.isActive ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                      {prompt.category && (
                        <Badge variant="outline">{prompt.category}</Badge>
                      )}
                    </div>
                    <CardDescription>
                      Used {prompt.usageCount} times
                      {prompt.lastUsedAt && (
                        <> • Last used: {new Date(prompt.lastUsedAt).toLocaleDateString()}</>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={prompt.isActive}
                      onCheckedChange={() => handleToggleActive(prompt)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(prompt)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(prompt)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateVariations(prompt.basePrompt)}
                  disabled={generatingVariations}
                >
                  {generatingVariations ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-2" />
                      Preview Variations
                    </>
                  )}
                </Button>

                {variations.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">AI-Generated Variations:</p>
                    {variations.map((variation, index) => (
                      <div key={index} className="p-3 bg-muted rounded-md text-sm">
                        {index + 1}. {variation}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Prompt Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Prompt</DialogTitle>
            <DialogDescription>
              Create a base prompt that will be used to generate variations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt-text">Prompt Text *</Label>
              <Textarea
                id="prompt-text"
                placeholder="e.g., wearing elegant dress in a modern cafe"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Describe the scene without mentioning the character
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <Input
                id="category"
                placeholder="e.g., fashion, outdoor, studio"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setPromptText('');
                setCategory('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddPrompt} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Prompt'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Prompt Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
            <DialogDescription>
              Update the prompt text or category
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-prompt-text">Prompt Text *</Label>
              <Textarea
                id="edit-prompt-text"
                placeholder="e.g., wearing elegant dress in a modern cafe"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category (Optional)</Label>
              <Input
                id="edit-category"
                placeholder="e.g., fashion, outdoor, studio"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedPrompt(null);
                setPromptText('');
                setCategory('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditPrompt} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prompt?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this prompt? This action cannot be undone.
              {selectedPrompt && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  &quot;{selectedPrompt.basePrompt}&quot;
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPrompt(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePrompt}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
