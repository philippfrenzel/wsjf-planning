import { useConfirm } from '@/components/confirm-dialog-provider';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { WorkflowStateBadge } from '@/components/workflow-state-badge';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { Link, usePage } from '@inertiajs/react';
import {
    type ColumnDef,
    type ColumnFiltersState,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { Eye, FolderOpen, LayoutGrid, LayoutList, Pencil, Plus, Trash2, Vote } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Project {
    id: number;
    project_number: string;
    name: string;
    project_leader?: { id: number; name: string };
    deputy_leader?: { id: number; name: string };
    created_by?: number;
    status?: string;
    status_details?: {
        value: string;
        name: string;
        color: string;
    };
}

interface IndexProps {
    projects: Project[] | Paginated<Project>;
    currentUserId: number;
}
type Paginated<T> = {
    data: T[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};

export default function Index({ projects, currentUserId }: IndexProps) {
    const confirm = useConfirm();

    const breadcrumbs = [
        { title: 'Startseite', href: '/' },
        { title: 'Projekte', href: '#' },
    ];

    const handleDeleteProject = async (projectId: number) => {
        const ok = await confirm({
            title: 'Projekt löschen',
            description: 'Möchten Sie dieses Projekt wirklich löschen? Alle zugehörigen Daten werden entfernt.',
            confirmLabel: 'Löschen',
            cancelLabel: 'Abbrechen',
        });
        if (!ok) return;
        router.delete(route('projects.destroy', { project: projectId }));
    };

    const projectData = Array.isArray(projects) ? projects : projects.data;
    const userId = (usePage().props as any)?.auth?.user?.id ?? 'guest';
    const [viewMode, setViewMode] = useLocalStorage<'table' | 'card'>(`viewPrefs:${userId}:projects.index:viewMode`, 'table');

    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const columns = useMemo<ColumnDef<Project>[]>(
        () => [
            {
                id: 'id',
                accessorKey: 'id',
                header: ({ column }) => <DataTableColumnHeader column={column} label="ID" />,
                enableColumnFilter: false,
            },
            {
                id: 'project_number',
                accessorKey: 'project_number',
                header: ({ column }) => <DataTableColumnHeader column={column} label="Projektnummer" />,
                meta: {
                    label: 'Projektnummer',
                    placeholder: 'Projektnummer filtern...',
                    variant: 'text',
                },
                enableColumnFilter: true,
            },
            {
                id: 'name',
                accessorKey: 'name',
                header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />,
                meta: {
                    label: 'Projektname',
                    placeholder: 'Projektname filtern...',
                    variant: 'text',
                },
                enableColumnFilter: true,
            },
            {
                id: 'status',
                accessorFn: (row) => row.status_details?.name ?? '',
                header: ({ column }) => <DataTableColumnHeader column={column} label="Status" />,
                cell: ({ row }) => (
                    <WorkflowStateBadge statusDetails={row.original.status_details} defaultLabel="In Planung" />
                ),
                enableColumnFilter: false,
                enableSorting: false,
            },
            {
                id: 'project_leader',
                accessorFn: (row) => row.project_leader?.name ?? '',
                header: ({ column }) => <DataTableColumnHeader column={column} label="Projektleiter" />,
                cell: ({ row }) => row.original.project_leader?.name ?? '-',
                meta: {
                    label: 'Projektleiter',
                    placeholder: 'Projektleiter filtern...',
                    variant: 'text',
                },
                enableColumnFilter: true,
            },
            {
                id: 'deputy_leader',
                accessorFn: (row) => row.deputy_leader?.name ?? '',
                header: ({ column }) => <DataTableColumnHeader column={column} label="Stellvertretung" />,
                cell: ({ row }) => row.original.deputy_leader?.name ?? '-',
                enableColumnFilter: false,
            },
            {
                id: 'actions',
                header: () => <div className="text-right">Aktionen</div>,
                cell: ({ row }) => {
                    const project = row.original;
                    const canEdit =
                        project.created_by === currentUserId ||
                        project.project_leader?.id === currentUserId ||
                        project.deputy_leader?.id === currentUserId;

                    return (
                        <div className="flex justify-end gap-2">
                            <Button asChild size="icon" variant="outline">
                                <Link href={route('projects.show', project.id)}>
                                    <Eye className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button asChild size="icon" variant="outline">
                                <Link href={route('plannings.index', { project_id: project.id })}>
                                    <Vote className="h-4 w-4" />
                                </Link>
                            </Button>
                            {canEdit && (
                                <>
                                    <Button asChild size="icon" variant="outline">
                                        <Link href={route('projects.edit', project.id)}>
                                            <Pencil className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button size="icon" variant="destructive" onClick={() => handleDeleteProject(project.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    );
                },
                enableSorting: false,
                enableHiding: false,
            },
        ],
        [currentUserId],
    );

    const table = useReactTable({
        data: projectData,
        columns,
        state: { columnFilters },
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        defaultColumn: { enableColumnFilter: false },
        initialState: {
            sorting: [{ id: 'project_number', desc: false }],
            pagination: { pageSize: 10 },
        },
        getRowId: (row) => String(row.id),
    });

    const filteredRows = table.getFilteredRowModel().rows;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="mb-6 flex items-center justify-between p-5">
                <h1 className="text-2xl font-bold">Projekte</h1>
                <div className="flex items-center gap-2">
                    <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'table' | 'card')}>
                        <ToggleGroupItem value="table" aria-label="Tabellenansicht">
                            <LayoutList className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="card" aria-label="Kartenansicht">
                            <LayoutGrid className="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <Button asChild>
                        <Link href={route('projects.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Neues Projekt erstellen
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {viewMode === 'table' ? (
                    <DataTable table={table} emptyMessage={
                        projectData.length === 0
                            ? 'Noch keine Projekte'
                            : 'Keine Projekte gefunden.'
                    }>
                        <DataTableToolbar table={table} />
                    </DataTable>
                ) : (
                    <>
                        <DataTableToolbar table={table} />
                        {filteredRows.length === 0 ? (
                            projectData.length === 0 ? (
                                <EmptyState
                                    icon={FolderOpen}
                                    title="Noch keine Projekte"
                                    description="Erstellen Sie Ihr erstes Projekt, um Features und Plannings zu verwalten."
                                    action={{
                                        label: 'Neues Projekt erstellen',
                                        href: route('projects.create'),
                                    }}
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-2 py-8 text-center">
                                    <p className="text-muted-foreground text-sm">Keine Projekte gefunden</p>
                                    <Button variant="link" className="h-auto p-0 text-sm" onClick={() => table.resetColumnFilters()}>
                                        Filter zurücksetzen
                                    </Button>
                                </div>
                            )
                        ) : (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {filteredRows.map((row) => {
                                    const project = row.original;
                                    const canEdit =
                                        project.created_by === currentUserId ||
                                        project.project_leader?.id === currentUserId ||
                                        project.deputy_leader?.id === currentUserId;

                                    return (
                                        <Card key={project.id}>
                                            <CardHeader className="space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <CardTitle className="text-base">{project.name}</CardTitle>
                                                    <WorkflowStateBadge statusDetails={project.status_details} defaultLabel="In Planung" />
                                                </div>
                                                <p className="text-muted-foreground text-xs">#{project.project_number}</p>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="text-sm">
                                                    <p>
                                                        <span className="text-muted-foreground">Projektleiter: </span>
                                                        {project.project_leader?.name ?? '-'}
                                                    </p>
                                                    <p>
                                                        <span className="text-muted-foreground">Stellvertretung: </span>
                                                        {project.deputy_leader?.name ?? '-'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button asChild size="icon" variant="outline">
                                                        <Link href={route('projects.show', project.id)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button asChild size="icon" variant="outline">
                                                        <Link href={route('plannings.index', { project_id: project.id })}>
                                                            <Vote className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    {canEdit && (
                                                        <>
                                                            <Button asChild size="icon" variant="outline">
                                                                <Link href={route('projects.edit', project.id)}>
                                                                    <Pencil className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button size="icon" variant="destructive" onClick={() => handleDeleteProject(project.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
