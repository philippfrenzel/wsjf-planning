import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    const { myProjectsCount, activePlanningsCount, visibleFeatureCount, validPlannings } = usePage().props as {
        myProjectsCount: number;
        activePlanningsCount: number;
        visibleFeatureCount: number;
        validPlannings: { id: number; title: string }[];
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {/* KPI: Meine Projekte */}
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border flex flex-col items-center justify-center bg-white dark:bg-neutral-900">
                        <div className="text-4xl font-bold">{myProjectsCount}</div>
                        <div className="text-lg text-muted-foreground">Meine Projekte</div>
                    </div>
                    {/* KPI: Aktive Plannings */}
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border flex flex-col items-center justify-center bg-white dark:bg-neutral-900">
                        <div className="text-4xl font-bold">{activePlanningsCount}</div>
                        <div className="text-lg text-muted-foreground">Aktive Plannings</div>
                    </div>
                    {/* KPI: Sichtbare Features */}
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border flex flex-col items-center justify-center bg-white dark:bg-neutral-900">
                        <div className="text-4xl font-bold">{visibleFeatureCount}</div>
                        <div className="text-lg text-muted-foreground">Sichtbare Features</div>
                    </div>
                </div>
                {/* Liste gültiger Plannings */}
                <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border flex flex-col items-center justify-center bg-white dark:bg-neutral-900 p-4 mt-4">
                    <div className="text-lg font-semibold mb-2">Meine gültigen Plannings</div>
                    {validPlannings.length === 0 ? (
                        <div className="text-muted-foreground text-sm">Keine gültigen Plannings</div>
                    ) : (
                        <ul className="w-full space-y-1">
                            {validPlannings.map((planning) => (
                                <li key={planning.id}>
                                    <Link
                                        href={route('votes.session', { planning: planning.id })}
                                        className="text-blue-600 hover:underline"
                                    >
                                        {planning.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border md:min-h-min">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </AppLayout>
    );
}
