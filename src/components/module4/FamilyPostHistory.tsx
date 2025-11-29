'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, XCircle, ExternalLink, Image as ImageIcon, Loader2 } from 'lucide-react';
import type { CharacterPost } from '@/lib/firebase/config/types';
import { CharacterPostService } from '@/lib/services/character-post.service';
import Image from 'next/image';

interface FamilyPostHistoryProps {
  userId: string;
  familyProfileId?: string;
}

export function FamilyPostHistory({ userId, familyProfileId }: FamilyPostHistoryProps) {
  const [posts, setPosts] = useState<CharacterPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<CharacterPost | null>(null);

  useEffect(() => {
    loadPosts();
  }, [userId, familyProfileId]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      // Load all posts for this user from character_posts collection
      const allPosts = await CharacterPostService.getRecentPosts(userId, 50);
      
      // Filter by familyProfileId if provided (characterId is used as familyProfileId)
      const filteredPosts = familyProfileId
        ? allPosts.filter((post: CharacterPost) => post.characterId === familyProfileId)
        : allPosts;
      
      setPosts(filteredPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (posted: boolean) => {
    return posted 
      ? <CheckCircle2 className="h-5 w-5 text-green-500" />
      : <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = (posted: boolean) => {
    return posted
      ? <Badge className="bg-green-500">Posted</Badge>
      : <Badge variant="destructive">Failed</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">No posts yet</p>
          <p className="text-sm text-muted-foreground">
            Posted content will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Post History</CardTitle>
          <CardDescription>
            {posts.length} post{posts.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid gap-4 md:grid-cols-[200px_1fr] p-6">
                {/* Image Preview */}
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                  {post.generatedImageUrl ? (
                    <Image
                      src={post.generatedImageUrl}
                      alt="Generated post"
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Post Details */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{post.characterName}</h3>
                        {getStatusBadge(post.postedToInstagram)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Posted to @{post.instagramAccountName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {getStatusIcon(post.postedToInstagram)}
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(post.timestamp)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Prompt</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{post.prompt}</p>
                    </div>

                    {post.caption && (
                      <div>
                        <p className="text-sm font-medium">Caption</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{post.caption}</p>
                      </div>
                    )}

                    {post.hashtags && (
                      <div>
                        <p className="text-sm font-medium">Hashtags</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{post.hashtags}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPost(post)}
                    >
                      View Details
                    </Button>
                    {post.instagramPostId && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={`https://www.instagram.com/p/${post.instagramPostId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View on Instagram
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedPost && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedPost(null)}
        >
          <Card className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedPost.characterName}</CardTitle>
                  <CardDescription>Posted on {formatDate(selectedPost.timestamp)}</CardDescription>
                </div>
                {getStatusBadge(selectedPost.postedToInstagram)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPost.generatedImageUrl && (
                <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                  <Image
                    src={selectedPost.generatedImageUrl}
                    alt="Generated post"
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              <div className="space-y-2">
                <div>
                  <p className="font-semibold">Instagram Account</p>
                  <p className="mt-1 text-sm text-muted-foreground">@{selectedPost.instagramAccountName}</p>
                </div>

                <div>
                  <p className="font-semibold">Prompt</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedPost.prompt}
                  </p>
                </div>

                {selectedPost.caption && (
                  <div>
                    <p className="font-semibold">Caption</p>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedPost.caption}</p>
                  </div>
                )}

                {selectedPost.hashtags && (
                  <div>
                    <p className="font-semibold">Hashtags</p>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedPost.hashtags}</p>
                  </div>
                )}
              </div>

              <Button onClick={() => setSelectedPost(null)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
