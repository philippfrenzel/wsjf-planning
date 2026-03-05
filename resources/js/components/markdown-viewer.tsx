import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { cn } from '@/lib/utils';

interface MarkdownViewerProps {
    content: string;
    className?: string;
}

export default function MarkdownViewer({ content, className }: MarkdownViewerProps) {
    const editor = useEditor({
        extensions: [StarterKit, Markdown],
        content,
        editable: false,
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none',
            },
        },
    });

    if (!editor) return null;

    return <EditorContent editor={editor} className={cn('text-sm text-muted-foreground', className)} />;
}
