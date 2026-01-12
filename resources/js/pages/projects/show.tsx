import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { PageProps } from '@inertiajs/inertia';
import { Head, Link, usePage } from '@inertiajs/react';

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
    const { project } = usePage<PageProps & { project: Project }>().props;

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
                <CardHeader className="flex flex-col gap-2 border-b border-slate-200 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-xl font-semibold text-slate-900">{project.name}</CardTitle>
                        <CardDescription className="text-slate-600">Projektnummer: {project.project_number}</CardDescription>
                    </div>
                    <div className="shrink-0">
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
                            <dl className="divide-y divide-slate-200">
                                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-2">
                                    <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Startdatum</dt>
                                    <dd className="text-sm text-slate-900">{project.start_date || '—'}</dd>
                                </div>
                                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-2">
                                    <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Projektleiter</dt>
                                    <dd className="text-sm text-slate-900">{project.project_leader?.name ?? '—'}</dd>
                                </div>
                                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-2">
                                    <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Stellvertretung</dt>
                                    <dd className="text-sm text-slate-900">{project.deputy_leader?.name ?? '—'}</dd>
                                </div>
                                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-2">
                                    <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">JIRA Base URI</dt>
                                    <dd className="text-sm text-slate-900">
                                        {project.jira_base_uri ? (
                                            <a
                                                href={project.jira_base_uri}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline"
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
                            <p className="text-sm whitespace-pre-line text-slate-800">{project.description || 'Keine Beschreibung vorhanden.'}</p>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
