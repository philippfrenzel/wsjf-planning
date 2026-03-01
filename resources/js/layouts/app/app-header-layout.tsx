import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { ConfirmDialogProvider } from '@/components/confirm-dialog-provider';
import { Toaster } from '@/components/ui/sonner';
import { useFlashToast } from '@/hooks/use-flash-toast';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';

export default function AppHeaderLayout({ children, breadcrumbs }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    useFlashToast();
    const { url } = usePage();

    return (
        <ConfirmDialogProvider>
            <AppShell variant="header">
                <AppHeader breadcrumbs={breadcrumbs} />
                <AppContent>
                    <div key={url} className="animate-in fade-in-0 duration-300">
                        {children}
                    </div>
                </AppContent>
            </AppShell>
            <Toaster position="bottom-right" richColors />
        </ConfirmDialogProvider>
    );
}
