import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { type LucideIcon } from 'lucide-react';

interface EmptyStateAction {
    label: string;
    href?: string; // use for Link (Inertia navigation)
    onClick?: () => void; // use for Button onClick
}

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: EmptyStateAction;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-slate-100 p-4">
                <Icon className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-1 text-base font-semibold text-slate-900">{title}</h3>
            <p className="mb-6 max-w-sm text-sm text-slate-500">{description}</p>
            {action &&
                (action.href ? (
                    <Button asChild>
                        <Link href={action.href}>{action.label}</Link>
                    </Button>
                ) : (
                    <Button onClick={action.onClick}>{action.label}</Button>
                ))}
        </div>
    );
}
