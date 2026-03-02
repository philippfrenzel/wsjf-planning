import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { SharedData } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import React from 'react';

type Project = {
    id: number;
    project_number: string;
    name: string;
    description?: string;
    jira_base_uri?: string;
    start_date: string;
    project_leader?: { id: number; name: string };
    deputy_leader?: { id: number; name: string };
    created_by?: number;
};

export default function ProjectShow() {
    const { project } = usePage<{ project: Project } & SharedData>().props;
    const { auth } = usePage<SharedData>().props;
    const canManage = auth.currentRole === 'Admin' || auth.currentRole === 'Planner';

    // Quick-start form — POSTs to projects.quick-start-planning
    const quickStartForm = useForm({});
    const handleQuickStart = (e: React.FormEvent) => {
        e.preventDefault();
        quickStartForm.post(route('projects.quick-start-planning', project.id));
    };

    // Breadcrumbs definieren
    const breadcrumbs = [
        { title: 'Startseite', href: '/' },
        { title: 'Projekte', href: route('projects.index') },
        { title: project.name, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Projekt: ${project.name}`} />
            <Card className="rounded-xl shadow-sm">
                <CardHeader className="border-border flex flex-col gap-2 border-b sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-xl font-semibold">{project.name}</CardTitle>
                        <CardDescription className="text-muted-foreground">Projektnummer: {project.project_number}</CardDescription>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {canManage && (
                            <form onSubmit={handleQuickStart}>
                                <Button
                                    type="submit"
                                    disabled={quickStartForm.processing}
                                    variant="default"
                                >
                                    {quickStartForm.processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                                    {quickStartForm.processing ? 'Erstelle…' : 'Planungssession starten'}
                                </Button>
                            </form>
                        )}
                        <Button asChild variant="outline">
                            <Link href={route('projects.features.import', project.id)}>Feature-Import</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Projektinformationen</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="divide-border divide-y">
                                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-2">
                                    <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Startdatum</dt>
                                    <dd className="text-foreground text-sm">{project.start_date || '—'}</dd>
                                </div>
                                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-2">
                                    <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Projektleiter</dt>
                                    <dd className="text-foreground text-sm">{project.project_leader?.name ?? '—'}</dd>
                                </div>
                                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-2">
                                    <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Stellvertretung</dt>
                                    <dd className="text-foreground text-sm">{project.deputy_leader?.name ?? '—'}</dd>
                                </div>
                                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-2">
                                    <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">JIRA Base URI</dt>
                                    <dd className="text-foreground text-sm">
                                        {project.jira_base_uri ? (
                                            <a
                                                href={project.jira_base_uri}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline"
                                            >
                                                {project.jira_base_uri}
                                            </a>
                                        ) : (
                                            '—'
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Beschreibung</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-foreground text-sm whitespace-pre-line">{project.description || 'Keine Beschreibung vorhanden.'}</p>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
