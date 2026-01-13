import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Comment } from '@/types/comment';
import { Edit2, MessageCircle, Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface CommentItemProps {
    comment: Comment;
    onReply: (parentId: number, body: string) => Promise<void>;
    onUpdate: (commentId: number, body: string) => Promise<void>;
    onDelete: (commentId: number) => Promise<void>;
    depth?: number;
}

export function CommentItem({ comment, onReply, onUpdate, onDelete, depth = 0 }: CommentItemProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [editText, setEditText] = useState(comment.body);

    const handleReply = async () => {
        if (!replyText.trim()) return;
        await onReply(comment.id, replyText);
        setReplyText('');
        setIsReplying(false);
    };

    const handleUpdate = async () => {
        if (!editText.trim()) return;
        await onUpdate(comment.id, editText);
        setIsEditing(false);
    };

    const handleDelete = async () => {
        await onDelete(comment.id);
    };

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

                    <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">{comment.user.name}</span>
                                <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                                {comment.created_at !== comment.updated_at && <span className="text-xs text-muted-foreground">(bearbeitet)</span>}
                            </div>

                            {comment.is_owner && !isEditing && (
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-7 px-2">
                                        <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={handleDelete} className="h-7 px-2 text-red-600 hover:text-red-700">
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-2">
                                <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} className="resize-none" />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleUpdate}>
                                        Speichern
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditText(comment.body);
                                        }}
                                    >
                                        <X className="mr-1 h-3 w-3" />
                                        Abbrechen
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm whitespace-pre-wrap text-foreground">{comment.body}</div>
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
                <div className="ml-11 space-y-2 rounded-lg border bg-muted p-3">
                    <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Schreiben Sie eine Antwort..."
                        rows={2}
                        className="resize-none"
                    />
                    <div className="flex gap-2">
                        <Button size="sm" onClick={handleReply}>
                            Antworten
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setIsReplying(false);
                                setReplyText('');
                            }}
                        >
                            <X className="mr-1 h-3 w-3" />
                            Abbrechen
                        </Button>
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
