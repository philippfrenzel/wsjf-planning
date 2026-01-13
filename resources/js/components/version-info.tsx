import { SidebarGroup, SidebarGroupContent } from '@/components/ui/sidebar';
import { usePage } from '@inertiajs/react';
import { type ComponentPropsWithoutRef } from 'react';

export function VersionInfo({ className, ...props }: ComponentPropsWithoutRef<typeof SidebarGroup>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { appVersion } = usePage().props as any;

    if (!appVersion) {
        return null;
    }

    return (
        <SidebarGroup {...props} className={`group-data-[collapsible=icon]:hidden ${className || ''}`}>
            <SidebarGroupContent>
                <div className="px-2 py-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center justify-between gap-2">
                        <span>Version {appVersion.version}</span>
                        {appVersion.commitShort && (
                            <span className="font-mono text-[10px]" title={`Commit: ${appVersion.commit || ''}`}>
                                {appVersion.commitShort}
                            </span>
                        )}
                    </div>
                    {appVersion.commitDate && (
                        <div className="mt-0.5 text-[10px] text-neutral-400 dark:text-neutral-500">
                            {new Date(appVersion.commitDate).toLocaleDateString('de-DE', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                            })}
                        </div>
                    )}
                </div>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
