import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, Undo, Redo, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface MarkdownEditorProps {
    value: string;
    onChange: (markdown: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder, className, minHeight = '120px' }: MarkdownEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
            }),
            Markdown,
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.storage.markdown.getMarkdown());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none px-3 py-2',
                style: `min-height: ${minHeight}`,
            },
        },
    });

    useEffect(() => {
        if (editor && value !== editor.storage.markdown.getMarkdown()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) return null;

    const btn = (active: boolean) =>
        cn('rounded p-1 transition-colors', active ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700');

    return (
        <div className={cn('rounded-md border border-slate-200 bg-white', className)}>
            <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 px-2 py-1">
                <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))} title="Fett">
                    <Bold className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))} title="Kursiv">
                    <Italic className="h-4 w-4" />
                </button>
                <span className="mx-1 h-4 w-px bg-slate-200" />
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive('heading', { level: 2 }))} title="Überschrift 2">
                    <Heading2 className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive('heading', { level: 3 }))} title="Überschrift 3">
                    <Heading3 className="h-4 w-4" />
                </button>
                <span className="mx-1 h-4 w-px bg-slate-200" />
                <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))} title="Aufzählung">
                    <List className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))} title="Nummerierung">
                    <ListOrdered className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btn(editor.isActive('codeBlock'))} title="Codeblock">
                    <Code className="h-4 w-4" />
                </button>
                <span className="mx-1 h-4 w-px bg-slate-200" />
                <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={btn(false)} title="Rückgängig">
                    <Undo className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={btn(false)} title="Wiederholen">
                    <Redo className="h-4 w-4" />
                </button>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}
