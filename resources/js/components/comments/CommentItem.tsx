import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Comment } from '@/types/comment';
import { Edit2, Loader2, MessageCircle, Trash2, X } from 'lucide-react';
import { useCallback, useState } from 'react';

interface CommentItemProps {
    comment: Comment;
    onReply: (parentId: number, body: string) => Promise<boolean>;
    onUpdate: (commentId: number, body: string) => Promise<boolean>;
    onDelete: (commentId: number) => Promise<void>;
    depth?: number;
}

export function CommentItem({ comment, onReply, onUpdate, onDelete, depth = 0 }: CommentItemProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [editText, setEditText] = useState(comment.body);
    const [replySubmitting, setReplySubmitting] = useState(false);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);

    const handleReply = useCallback(async () => {
        if (!replyText.trim() || replySubmitting) return;
        setReplySubmitting(true);
        try {
            const success = await onReply(comment.id, replyText);
            if (success) {
                setReplyText('');
                setIsReplying(false);
            }
        } finally {
            setReplySubmitting(false);
        }
    }, [replyText, replySubmitting, onReply, comment.id]);

    const handleUpdate = useCallback(async () => {
        if (!editText.trim() || editSubmitting) return;
        setEditSubmitting(true);
        try {
            const success = await onUpdate(comment.id, editText);
            if (success) {
                setIsEditing(false);
            }
        } finally {
            setEditSubmitting(false);
        }
    }, [editText, editSubmitting, onUpdate, comment.id]);

    const handleDelete = useCallback(async () => {
        if (deleteSubmitting) return;
        setDeleteSubmitting(true);
        try {
            await onDelete(comment.id);
        } finally {
            setDeleteSubmitting(false);
        }
    }, [deleteSubmitting, onDelete, comment.id]);

    const handleReplyKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleReply();
            }
        },
        [handleReply],
    );

    const handleEditKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleUpdate();
            }
            if (e.key === 'Escape') {
                setIsEditing(false);
                setEditText(comment.body);
            }
        },
        [handleUpdate, comment.body],
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'gerade eben';
        if (diffInSeconds < 3600) return `vor ${Math.floor(diffInSeconds / 60)} Minuten`;
        if (diffInSeconds < 86400) return `vor ${Math.floor(diffInSeconds / 3600)} Stunden`;
        if (diffInSeconds < 604800) return `vor ${Math.floor(diffInSeconds / 86400)} Tagen`;

        return date.toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const maxDepth = 3;
    const canReply = depth < maxDepth;

    return (
        <div className={`space-y-2 ${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
                        <AvatarFallback>{comment.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0 flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold">{comment.user.name}</span>
                                <span className="text-muted-foreground text-xs">{formatDate(comment.created_at)}</span>
                                {comment.created_at !== comment.updated_at && <span className="text-muted-foreground text-xs">(bearbeitet)</span>}
                            </div>

                            {comment.is_owner && !isEditing && (
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-7 px-2" disabled={deleteSubmitting}>
                                        <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleDelete}
                                        className="h-7 px-2 text-red-600 hover:text-red-700"
                                        disabled={deleteSubmitting}
                                    >
                                        {deleteSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-2">
                                <Textarea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onKeyDown={handleEditKeyDown}
                                    rows={3}
                                    className="resize-none"
                                    disabled={editSubmitting}
                                    autoFocus
                                />
                                <div className="flex items-center gap-2">
                                    <Button size="sm" onClick={handleUpdate} disabled={editSubmitting || !editText.trim()}>
                                        {editSubmitting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                                        Speichern
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={editSubmitting}
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditText(comment.body);
                                        }}
                                    >
                                        <X className="mr-1 h-3 w-3" />
                                        Abbrechen
                                    </Button>
                                    <span className="text-muted-foreground text-xs">⌘+Enter zum Speichern</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-foreground text-sm break-words whitespace-pre-wrap">{comment.body}</div>
                        )}

                        {!isEditing && canReply && (
                            <Button variant="ghost" size="sm" onClick={() => setIsReplying(!isReplying)} className="h-7 px-2 text-xs">
                                <MessageCircle className="mr-1 h-3 w-3" />
                                Antworten
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {isReplying && (
                <div className="bg-muted ml-11 space-y-2 rounded-lg border p-3">
                    <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={handleReplyKeyDown}
                        placeholder="Schreiben Sie eine Antwort..."
                        rows={2}
                        className="resize-none"
                        disabled={replySubmitting}
                        autoFocus
                    />
                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handleReply} disabled={replySubmitting || !replyText.trim()}>
                            {replySubmitting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                            Antworten
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={replySubmitting}
                            onClick={() => {
                                setIsReplying(false);
                                setReplyText('');
                            }}
                        >
                            <X className="mr-1 h-3 w-3" />
                            Abbrechen
                        </Button>
                        <span className="text-muted-foreground text-xs">⌘+Enter zum Senden</span>
                    </div>
                </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
                <div className="space-y-2">
                    {comment.replies.map((reply) => (
                        <CommentItem key={reply.id} comment={reply} onReply={onReply} onUpdate={onUpdate} onDelete={onDelete} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}
