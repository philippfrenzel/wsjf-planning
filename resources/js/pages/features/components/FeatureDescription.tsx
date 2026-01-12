import TextAlign from '@tiptap/extension-text-align';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface FeatureDescriptionProps {
    content: string;
}

export default function FeatureDescription({ content }: FeatureDescriptionProps) {
    const editor = useEditor({
        extensions: [StarterKit, TextAlign.configure({ types: ['heading', 'paragraph'] })],
        content,
        editable: false,
    });

    return (
        <div className="overflow-hidden rounded border">
            <EditorContent editor={editor} className="min-h-[120px] bg-white p-2" />
        </div>
    );
}
