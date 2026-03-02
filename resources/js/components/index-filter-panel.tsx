import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import type { ReactNode } from 'react';

interface IndexFilterPanelProps {
    children: ReactNode;
    onReset?: () => void;
    resetDisabled?: boolean;
    className?: string;
    contentClassName?: string;
    title?: string;
}

export function IndexFilterPanel({
    children,
    onReset,
    resetDisabled = false,
    className,
    contentClassName,
    title = 'Filter',
}: IndexFilterPanelProps) {
    return (
        <Card className={cn('border bg-card/60', className)}>
            <CardContent className={cn('space-y-4 p-4 md:p-5', contentClassName)}>
                <div className="flex items-center gap-2">
                    <Search className="text-muted-foreground h-4 w-4" />
                    <h2 className="text-sm font-semibold">{title}</h2>
                    {onReset && (
                        <Button variant="outline" size="sm" onClick={onReset} className="ml-auto" disabled={resetDisabled}>
                            <X className="mr-1 h-4 w-4" />
                            Filter zurücksetzen
                        </Button>
                    )}
                </div>
                {children}
            </CardContent>
        </Card>
    );
}
