import MDEditor from '@uiw/react-md-editor';
import { cn } from '@/lib/utils';
import { useColorMode } from '@/hooks/use-color-mode';

interface MarkdownViewerProps {
    content: string;
    className?: string;
}

export default function MarkdownViewer({ content, className }: MarkdownViewerProps) {
    const colorMode = useColorMode();

    return (
        <div className={cn(className)} data-color-mode={colorMode}>
            <MDEditor.Markdown source={content} />
        </div>
    );
}
