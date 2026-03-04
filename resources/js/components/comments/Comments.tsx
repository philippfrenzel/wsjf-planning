import axios from '@/bootstrap';
import { useConfirm } from '@/components/confirm-dialog-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { Comment, CommentableEntity } from '@/types/comment';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CommentItem } from './CommentItem';

interface CommentsProps {
    entity: CommentableEntity;
    initialComments?: Comment[];
}

export function Comments({ entity, initialComments = [] }: CommentsProps) {
    const confirm = useConfirm();
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const loadRef = useRef(0);

    const loadComments = useCallback(async () => {
        const id = ++loadRef.current;
        setLoading(true);
        try {
            const response = await axios.get('/comments', {
                params: {
                    commentable_type: entity.type,
                    commentable_id: entity.id,
                },
            });
            // Only apply if this is still the latest request
            if (id === loadRef.current) {
                setComments(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            if (id === loadRef.current) {
                setLoading(false);
            }
        }
    }, [entity.type, entity.id]);

    useEffect(() => {
        loadComments();
    }, [loadComments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || submitting) return;

        setSubmitting(true);
        try {
            await axios.post('/comments', {
                body: newComment,
                commentable_type: entity.type,
                commentable_id: entity.id,
            });
            setNewComment('');
            await loadComments();
        } catch (error) {
            console.error('Error creating comment:', error);
            toast.error('Fehler beim Erstellen des Kommentars. Bitte versuchen Sie es erneut.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = useCallback(async (parentId: number, body: string): Promise<boolean> => {
        try {
            await axios.post('/comments', {
                body,
                commentable_type: entity.type,
                commentable_id: entity.id,
                parent_id: parentId,
            });
            await loadComments();
            return true;
        } catch (error) {
            console.error('Error creating reply:', error);
            toast.error('Fehler beim Erstellen der Antwort. Bitte versuchen Sie es erneut.');
            return false;
        }
    }, [entity.type, entity.id, loadComments]);

    const handleUpdate = useCallback(async (commentId: number, body: string): Promise<boolean> => {
        try {
            await axios.put(`/comments/${commentId}`, { body });
            await loadComments();
            return true;
        } catch (error) {
            console.error('Error updating comment:', error);
            toast.error('Fehler beim Aktualisieren des Kommentars. Bitte versuchen Sie es erneut.');
            return false;
        }
    }, [loadComments]);

    const handleDelete = useCallback(async (commentId: number): Promise<void> => {
        const ok = await confirm({
            title: 'Kommentar löschen',
            description: 'Möchten Sie diesen Kommentar wirklich löschen?',
            confirmLabel: 'Löschen',
            cancelLabel: 'Abbrechen',
        });
        if (!ok) return;

        try {
            await axios.delete(`/comments/${commentId}`);
            await loadComments();
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error('Fehler beim Löschen des Kommentars. Bitte versuchen Sie es erneut.');
        }
    }, [confirm, loadComments]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Kommentare {comments.length > 0 && `(${comments.length})`}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-2">
                    <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Schreiben Sie einen Kommentar..."
                        rows={3}
                        className="resize-none"
                        disabled={submitting}
                    />
                    <div className="flex justify-end">
                        <Button type="submit" disabled={submitting || !newComment.trim()} size="sm">
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            {submitting ? 'Wird gesendet...' : 'Kommentar abschicken'}
                        </Button>
                    </div>
                </form>

                {loading && comments.length === 0 ? (
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
