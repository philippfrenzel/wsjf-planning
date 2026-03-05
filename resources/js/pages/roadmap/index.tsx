import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Iteration {
    id: number;
    number: number;
    name: string;
    start_date: string;
    end_date: string;
    is_ip: boolean;
}

interface Feature {
    id: number;
    jira_key: string;
    name: string;
    type: string;
    team_id: number | null;
    iteration_id: number | null;
    team?: { id: number; name: string } | null;
}

interface Planning {
    id: number;
    title: string;
    planned_at: string | null;
    executed_at: string | null;
    status: string;
    project?: { id: number; name: string } | null;
    features: Feature[];
    iterations: Iteration[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Startseite', href: '/' },
    { title: 'Roadmap', href: '#' },
];

const statusColors: Record<string, string> = {
    'in-planning': 'bg-blue-500',
    'in-execution': 'bg-yellow-500',
    completed: 'bg-green-500',
};

const typeColors: Record<string, string> = {
    business: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    enabler: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    tech_debt: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    nfr: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export default function Index({ plannings }: { plannings: Planning[] }) {
    if (plannings.length === 0) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Roadmap" />
                <div className="mx-auto max-w-5xl p-4">
                    <p className="text-muted-foreground">Keine Planungen vorhanden.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roadmap" />
            <div className="mx-auto w-full max-w-7xl p-4 space-y-6">
                <h1 className="text-2xl font-bold">Roadmap</h1>

                {/* Timeline view: each planning as a swimlane */}
                <div className="space-y-4">
                    {plannings.map((planning) => {
                        const sortedIter = [...planning.iterations].sort((a, b) => a.number - b.number);
                        const totalFeatures = planning.features.length;
                        const assignedFeatures = planning.features.filter((f) => f.iteration_id).length;

                        return (
                            <Card key={planning.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className={`inline-block h-3 w-3 rounded-full ${statusColors[planning.status] || 'bg-gray-400'}`} />
                                            <Link href={route('plannings.show', planning.id)} className="hover:underline">
                                                <CardTitle className="text-base">{planning.title}</CardTitle>
                                            </Link>
                                            {planning.project && (
                                                <Badge variant="outline">{planning.project.name}</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            {planning.planned_at && <span>Geplant: {new Date(planning.planned_at).toLocaleDateString('de-DE')}</span>}
                                            <span>{assignedFeatures}/{totalFeatures} Features zugewiesen</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {sortedIter.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">Keine Iterationen definiert.</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <div className="flex gap-1" style={{ minWidth: sortedIter.length * 180 }}>
                                                {sortedIter.map((iter) => {
                                                    const iterFeatures = planning.features.filter((f) => f.iteration_id === iter.id);
                                                    return (
                                                        <div
                                                            key={iter.id}
                                                            className={`flex-1 rounded border p-2 min-w-[170px] ${
                                                                iter.is_ip ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950' : ''
                                                            }`}
                                                        >
                                                            <div className="mb-1 flex items-center justify-between">
                                                                <span className="text-xs font-semibold">{iter.name}</span>
                                                                {iter.is_ip && <Badge variant="outline" className="text-[10px]">IP</Badge>}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground mb-2">
                                                                {new Date(iter.start_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                                                                {' – '}
                                                                {new Date(iter.end_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                                                            </div>
                                                            <div className="space-y-1">
                                                                {iterFeatures.map((f) => (
                                                                    <Tooltip key={f.id}>
                                                                        <TooltipTrigger asChild>
                                                                            <div className={`rounded px-1.5 py-0.5 text-[11px] truncate ${typeColors[f.type] || 'bg-gray-100 dark:bg-gray-800'}`}>
                                                                                {f.jira_key} {f.name}
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <div>{f.jira_key} — {f.name}</div>
                                                                            {f.team && <div className="text-xs">Team: {f.team.name}</div>}
                                                                            <div className="text-xs">Typ: {f.type}</div>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                ))}
                                                                {iterFeatures.length === 0 && (
                                                                    <div className="text-[10px] text-muted-foreground italic">Keine Features</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Unassigned features summary */}
                                    {planning.features.filter((f) => !f.iteration_id).length > 0 && (
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            {planning.features.filter((f) => !f.iteration_id).length} Feature(s) nicht einer Iteration zugeordnet
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
