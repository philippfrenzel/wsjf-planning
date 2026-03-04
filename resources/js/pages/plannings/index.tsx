import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/empty-state';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import AppLayout from '@/layouts/app-layout';
import { useConfirm } from '@/components/confirm-dialog-provider';
import { router } from '@inertiajs/react';
import { Link, usePage } from '@inertiajs/react';
import {
    type ColumnDef,
    type ColumnFiltersState,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { CalendarX2, Eye, LayoutGrid, LayoutList, Pencil, Plus, Search, Trash2, Vote } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Planning {
    id: number;
    title: string;
    planned_at: string;
    executed_at: string;
    project?: { id: number; name: string };
    created_by: number; // ID des Erstellers
    owner_id?: number; // ID des Hauptverantwortlichen
    deputy_id?: number; // ID des Stellvertreters
    features_count?: number; // Number of features
    stakeholders_count?: number; // Number of users/stakeholders
}

type Paginated<T> = {
    data: T[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    links?: { url: string | null; label: string; active: boolean }[];
};

interface IndexProps {
    plannings: Planning[] | Paginated<Planning>;
    auth: {
        currentRole?: string;
        user: {
            id: number;
        };
    };
}

function arrIncludesFilter(row: any, columnId: string, filterValue: string[]) {
    if (!filterValue?.length) return true;
    const value = row.getValue(columnId);
    return filterValue.includes(value as string);
}

export default function Index({ plannings }: IndexProps) {
    const breadcrumbs = [
        { title: 'Startseite', href: '/' },
        { title: 'Plannings', href: '#' },
    ];

    const { auth } = usePage().props as unknown as IndexProps;
    const canCreate = auth?.currentRole === 'Admin' || auth?.currentRole === 'Planner';

    const userId = (usePage().props as any)?.auth?.user?.id ?? 'guest';
    const [viewMode, setViewMode] = useLocalStorage<'table' | 'card'>(`viewPrefs:${userId}:plannings.index:viewMode`, 'table');

    const confirm = useConfirm();

    const planningData = Array.isArray(plannings) ? plannings : plannings.data;

    const uniqueProjects = useMemo(() => {
        const projectSet = new Set<string>();
        planningData.forEach((planning) => {
            if (planning.project?.name) {
                projectSet.add(planning.project.name);
            }
        });
        return Array.from(projectSet).sort().map((s) => ({ label: s, value: s }));
    }, [planningData]);

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    const canEditPlanning = (planning: Planning) => {
        return planning.created_by === auth.user.id || planning.owner_id === auth.user.id || planning.deputy_id === auth.user.id;
    };

    const columns = useMemo<ColumnDef<Planning>[]>(
        () => [
            {
                id: 'id',
                accessorKey: 'id',
                header: ({ column }) => <DataTableColumnHeader column={column} label="ID" />,
                cell: ({ row }) => row.original.id,
            },
            {
                id: 'title',
                accessorKey: 'title',
                header: ({ column }) => <DataTableColumnHeader column={column} label="Titel" />,
                cell: ({ row }) => row.original.title,
                meta: {
                    label: 'Titel',
                    placeholder: 'Titel filtern...',
                    variant: 'text' as const,
                },
                enableColumnFilter: true,
            },
            {
                id: 'project',
                accessorFn: (row) => row.project?.name ?? '',
                header: ({ column }) => <DataTableColumnHeader column={column} label="Projekt" />,
                cell: ({ row }) => row.original.project?.name ?? '-',
                filterFn: arrIncludesFilter,
                meta: {
                    label: 'Projekt',
                    variant: 'multiSelect' as const,
                    options: uniqueProjects,
                },
                enableColumnFilter: true,
            },
            {
                id: 'features_count',
                accessorKey: 'features_count',
                header: ({ column }) => <DataTableColumnHeader column={column} label="Features" />,
                cell: ({ row }) => row.original.features_count ?? 0,
                enableColumnFilter: false,
            },
            {
                id: 'stakeholders_count',
                accessorKey: 'stakeholders_count',
                header: ({ column }) => <DataTableColumnHeader column={column} label="Benutzer" />,
                cell: ({ row }) => row.original.stakeholders_count ?? 0,
                enableColumnFilter: false,
            },
            {
                id: 'planned_at',
                accessorKey: 'planned_at',
                header: ({ column }) => <DataTableColumnHeader column={column} label="Geplant am" />,
                cell: ({ row }) => formatDate(row.original.planned_at),
                enableColumnFilter: false,
            },
            {
                id: 'executed_at',
                accessorKey: 'executed_at',
                header: ({ column }) => <DataTableColumnHeader column={column} label="Durchgeführt am" />,
                cell: ({ row }) => formatDate(row.original.executed_at),
                enableColumnFilter: false,
            },
            {
                id: 'actions',
                header: () => <div className="text-right">Aktionen</div>,
                cell: ({ row }) => {
                    const planning = row.original;
                    return (
                        <div className="flex justify-end gap-2">
                            <Button asChild size="icon" variant="outline">
                                <Link href={route('plannings.show', planning.id)}>
                                    <Eye className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button asChild size="icon" variant="outline">
                                <Link href={route('votes.session', planning.id)}>
                                    <Vote className="h-4 w-4" />
                                </Link>
                            </Button>
                            {canEditPlanning(planning) && (
                                <Button asChild size="icon" variant="outline">
                                    <Link href={route('plannings.edit', planning.id)}>
                                        <Pencil className="h-4 w-4" />
                                    </Link>
                                </Button>
                            )}
                            {canEditPlanning(planning) && (
                                <Button
                                    size="icon"
                                    variant="destructive"
                                    onClick={async () => {
                                        const ok = await confirm({
                                            title: 'Planning löschen',
                                            description: 'Möchten Sie dieses Planning wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
                                            confirmLabel: 'Löschen',
                                            cancelLabel: 'Abbrechen',
                                        });
                                        if (!ok) return;
                                        router.delete(route('plannings.destroy', planning.id));
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    );
                },
                enableSorting: false,
                enableHiding: false,
            },
        ],
        [uniqueProjects, confirm],
    );

    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const table = useReactTable({
        data: planningData,
        columns,
        state: { columnFilters },
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        defaultColumn: { enableColumnFilter: false },
        initialState: {
            sorting: [{ id: 'id', desc: true }],
            pagination: { pageSize: 10 },
        },
        getRowId: (row) => String(row.id),
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="mb-6 flex items-center justify-between p-5">
                <h1 className="text-2xl font-bold">Plannings</h1>
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
                        <Link href={route('plannings.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Neues Planning erstellen
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-4 p-5">
                    {viewMode === 'table' ? (
                        <DataTable table={table} emptyMessage="Keine Plannings gefunden.">
                            <DataTableToolbar table={table} />
                        </DataTable>
                    ) : (
                        <>
                            <DataTableToolbar table={table} />
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {table.getFilteredRowModel().rows.length === 0 ? (
                                    table.getState().columnFilters.length > 0 ? (
                                        <div className="col-span-full flex flex-col items-center gap-2 py-8 text-center">
                                            <Search className="text-muted-foreground h-8 w-8" />
                                            <p className="text-muted-foreground text-sm">Keine Plannings gefunden</p>
                                            <Button variant="link" className="h-auto p-0 text-sm" onClick={() => table.resetColumnFilters()}>
                                                Filter zurücksetzen
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="col-span-full">
                                            <EmptyState
                                                icon={CalendarX2}
                                                title="Noch keine Planning-Sessions"
                                                description="Erstellen Sie die erste Planning-Session, um mit dem Abstimmen zu beginnen."
                                                action={
                                                    canCreate
                                                        ? {
                                                              label: 'Planning erstellen',
                                                              href: route('plannings.create'),
                                                          }
                                                        : undefined
                                                }
                                            />
                                        </div>
                                    )
                                ) : (
                                    table.getFilteredRowModel().rows.map((row) => {
                                        const planning = row.original;
                                        return (
                                            <Card key={planning.id} className="flex flex-col">
                                                <CardHeader>
                                                    <CardTitle className="text-lg">{planning.title}</CardTitle>
                                                </CardHeader>
                                                <CardContent className="flex flex-1 flex-col gap-3">
                                                    <div className="space-y-2 text-sm">
                                                        <div>
                                                            <span className="font-medium">Projekt:</span>{' '}
                                                            <span className="text-muted-foreground">{planning.project?.name ?? '-'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Features:</span>{' '}
                                                            <span className="text-muted-foreground">{planning.features_count ?? 0}</span>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Benutzer:</span>{' '}
                                                            <span className="text-muted-foreground">{planning.stakeholders_count ?? 0}</span>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Geplant am:</span>{' '}
                                                            <span className="text-muted-foreground">{formatDate(planning.planned_at)}</span>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Durchgeführt am:</span>{' '}
                                                            <span className="text-muted-foreground">{formatDate(planning.executed_at)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-auto flex gap-2 pt-4">
                                                        <Button asChild size="sm" variant="outline" className="flex-1">
                                                            <Link href={route('plannings.show', planning.id)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Ansehen
                                                            </Link>
                                                        </Button>
                                                        <Button asChild size="sm" variant="outline" className="flex-1">
                                                            <Link href={route('votes.session', planning.id)}>
                                                                <Vote className="mr-2 h-4 w-4" />
                                                                Voting
                                                            </Link>
                                                        </Button>
                                                        {canEditPlanning(planning) && (
                                                            <Button asChild size="sm" variant="outline">
                                                                <Link href={route('plannings.edit', planning.id)}>
                                                                    <Pencil className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        {canEditPlanning(planning) && (
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={async () => {
                                                                    const ok = await confirm({
                                                                        title: 'Planning löschen',
                                                                        description: 'Möchten Sie dieses Planning wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
                                                                        confirmLabel: 'Löschen',
                                                                        cancelLabel: 'Abbrechen',
                                                                    });
                                                                    if (!ok) return;
                                                                    router.delete(route('plannings.destroy', planning.id));
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    )}
            </div>
        </AppLayout>
    );
}
