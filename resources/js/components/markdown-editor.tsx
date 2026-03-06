import MDEditor from '@uiw/react-md-editor';
import { cn } from '@/lib/utils';
import { useColorMode } from '@/hooks/use-color-mode';

interface MarkdownEditorProps {
    value: string;
    onChange: (markdown: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: number;
    height?: number;
    preview?: 'edit' | 'live' | 'preview';
}

export default function MarkdownEditor({ value, onChange, placeholder, className, minHeight = 120, height = 200, preview = 'live' }: MarkdownEditorProps) {
    const colorMode = useColorMode();

    return (
        <div className={cn(className)} data-color-mode={colorMode}>
            <MDEditor
                value={value}
                onChange={(val) => onChange(val ?? '')}
                placeholder={placeholder}
                height={height}
                minHeight={minHeight}
                preview={preview}
            />
        </div>
    );
}
