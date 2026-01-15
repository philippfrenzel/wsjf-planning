import axios from '@/bootstrap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { Comment, CommentableEntity } from '@/types/comment';
import { MessageSquare, Send } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { CommentItem } from './CommentItem';

interface CommentsProps {
    entity: CommentableEntity;
    initialComments?: Comment[];
}

export function Comments({ entity, initialComments = [] }: CommentsProps) {
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const loadComments = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/comments', {
                params: {
                    commentable_type: entity.type,
                    commentable_id: entity.id,
                },
            });
            setComments(response.data.data || []);
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            setLoading(false);
        }
    }, [entity.type, entity.id]);

    useEffect(() => {
        loadComments();
    }, [loadComments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            await axios.post('/comments', {
                body: newComment,
                commentable_type: entity.type,
                commentable_id: entity.id,
            });

            setNewComment('');
            // Reload comments to show new comment in the correct place
            await loadComments();
        } catch (error) {
            console.error('Error creating comment:', error);
            alert('Fehler beim Erstellen des Kommentars. Bitte versuchen Sie es erneut.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = async (parentId: number, body: string) => {
        try {
            const response = await axios.post('/comments', {
                body,
                commentable_type: entity.type,
                commentable_id: entity.id,
                parent_id: parentId,
            });

            // Reload comments to show new reply in the correct place
            await loadComments();
        } catch (error) {
            console.error('Error creating reply:', error);
            alert('Fehler beim Erstellen der Antwort. Bitte versuchen Sie es erneut.');
        }
    };

    const handleUpdate = async (commentId: number, body: string) => {
        try {
            await axios.put(`/comments/${commentId}`, { body });
            await loadComments();
        } catch (error) {
            console.error('Error updating comment:', error);
            alert('Fehler beim Aktualisieren des Kommentars. Bitte versuchen Sie es erneut.');
        }
    };

    const handleDelete = async (commentId: number) => {
        if (!confirm('Möchten Sie diesen Kommentar wirklich löschen?')) return;

        try {
            await axios.delete(`/comments/${commentId}`);
            await loadComments();
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Fehler beim Löschen des Kommentars. Bitte versuchen Sie es erneut.');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Kommentare {comments.length > 0 && `(${comments.length})`}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* New Comment Form */}
                <form onSubmit={handleSubmit} className="space-y-2">
                    <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Schreiben Sie einen Kommentar..."
                        rows={3}
                        className="resize-none"
                    />
                    <div className="flex justify-end">
                        <Button type="submit" disabled={submitting || !newComment.trim()} size="sm">
                            <Send className="mr-2 h-4 w-4" />
                            Kommentar abschicken
                        </Button>
                    </div>
                </form>

                {/* Comments List */}
                {loading ? (
                    <div className="text-muted-foreground py-4 text-center text-sm">Kommentare werden geladen...</div>
                ) : comments.length === 0 ? (
                    <div className="text-muted-foreground py-8 text-center text-sm">Noch keine Kommentare vorhanden. Seien Sie der Erste!</div>
                ) : (
                    <div className="space-y-4">
                        {comments.map((comment) => (
                            <CommentItem key={comment.id} comment={comment} onReply={handleReply} onUpdate={handleUpdate} onDelete={handleDelete} />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
