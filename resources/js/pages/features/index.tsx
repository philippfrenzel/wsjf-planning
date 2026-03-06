import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useConfirm } from '@/components/confirm-dialog-provider';
import AppLayout from '@/layouts/app-layout';
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
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Feature {
    id: number;
    jira_key: string;
    name: string;
    description: string;
    requester?: { id: number; name: string } | null;
    project?: { id: number; name: string; jira_base_uri?: string } | null;
    status?: {
        name: string;
        color: string;
    };
    type?: string;
    estimation_components_count?: number;
    total_weighted_case?: number;
    estimation_units?: string[];
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
    features: Feature[] | Paginated<Feature>;
}

function formatUnits(units?: string[]): string {
    if (!units || units.length === 0) return '';
    if (units.length === 1) {
        switch (units[0]) {
            case 'hours': return 'Stunden';
            case 'days': return 'Tage';
            case 'story_points': return 'Story Points';
            default: return units[0];
        }
    }
    return 'Gemischt';
}

function arrIncludesFilter(row: any, columnId: string, filterValue: string[]) {
    if (!filterValue?.length) return true;
    const value = row.getValue(columnId);
    return filterValue.includes(value as string);
}

export default function Index({ features }: IndexProps) {
    const breadcrumbs = [
        { title: 'Startseite', href: '/' },
        { title: 'Features', href: '#' },
    ];

    const pageProps = usePage().props as any;
    const initialFiltersProp = (pageProps?.initialFilters ?? {}) as Partial<{
        status: string;
    }>;

    const confirm = useConfirm();
    const featureData = Array.isArray(features) ? features : features.data;

    const uniqueStatuses = useMemo(() => {
        const set = new Set<string>();
        featureData.forEach((f) => { if (f.status?.name) set.add(f.status.name); });
        return Array.from(set).sort().map((s) => ({ label: s, value: s }));
    }, [featureData]);

    const uniqueProjects = useMemo(() => {
        const set = new Set<string>();
        featureData.forEach((f) => { if (f.project?.name) set.add(f.project.name); });
        return Array.from(set).sort().map((s) => ({ label: s, value: s }));
    }, [featureData]);

    const uniqueRequesters = useMemo(() => {
        const set = new Set<string>();
        featureData.forEach((f) => { if (f.requester?.name) set.add(f.requester.name); });
        return Array.from(set).sort().map((s) => ({ label: s, value: s }));
    }, [featureData]);

    const columns = useMemo<ColumnDef<Feature>[]>(
        () => [
            {
                id: 'jira_key',
                accessorKey: 'jira_key',
                header: ({ column }) => <DataTableColumnHeader column={column} label="Feature-Key" />,
                cell: ({ row }) => {
                    const feature = row.original;
                    return feature.project?.jira_base_uri && feature.jira_key ? (
                        <a
                            href={`${feature.project.jira_base_uri}${feature.jira_key}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            {feature.jira_key}
                        </a>
                    ) : (
                        <span>{feature.jira_key}</span>
                    );
                },
                meta: {
                    label: 'Feature-Key',
                    placeholder: 'Feature-Key filtern...',
                    variant: 'text',
                },
                enableColumnFilter: true,
            },
            {
                id: 'name',
                accessorKey: 'name',
                header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />,
                cell: ({ row }) => {
                    const name = row.original.name;
                    if (name.length > 50) {
                        return (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="block max-w-[260px] cursor-help truncate">{name.slice(0, 50)}&hellip;</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <span className="max-w-xs break-words whitespace-pre-line">{name}</span>
                                </TooltipContent>
                            </Tooltip>
                        );
                    }
                    return <span className="max-w-[260px] block truncate">{name}</span>;
                },
                meta: {
                    label: 'Name',
                    placeholder: 'Name filtern...',
                    variant: 'text',
                },
                enableColumnFilter: true,
            },
            {
                id: 'type',
                accessorKey: 'type',
                header: 'Typ',
                cell: ({ row }) => {
                    const labels: Record<string, string> = { business: 'Business', enabler: 'Enabler', tech_debt: 'Tech Debt', nfr: 'NFR' };
                    const colors: Record<string, string> = { business: 'bg-blue-100 text-blue-800', enabler: 'bg-purple-100 text-purple-800', tech_debt: 'bg-orange-100 text-orange-800', nfr: 'bg-teal-100 text-teal-800' };
                    const t = row.original.type ?? 'business';
                    return <Badge className={colors[t] ?? ''}>{labels[t] ?? t}</Badge>;
                },
                meta: {
                    label: 'Typ',
                    variant: 'select' as const,
                    options: [
                        { label: 'Business', value: 'business' },
                        { label: 'Enabler', value: 'enabler' },
                        { label: 'Tech Debt', value: 'tech_debt' },
                        { label: 'NFR', value: 'nfr' },
                    ],
                },
                enableColumnFilter: true,
                filterFn: arrIncludesFilter,
            },
            {
                accessorFn: (row) => row.status?.name ?? '',
                header: 'Status',
                cell: ({ row }) => {
                    const feature = row.original;
                    return feature.status ? (
                        <span className={`inline-block rounded-md px-2 py-1 text-xs ${feature.status.color}`}>
                            {feature.status.name}
                        </span>
                    ) : (
                        <Badge variant="outline">Unbekannt</Badge>
                    );
                },
                filterFn: arrIncludesFilter,
                meta: {
                    label: 'Status',
                    variant: 'multiSelect',
                    options: uniqueStatuses,
                },
                enableColumnFilter: true,
                enableSorting: false,
            },
            {
                id: 'estimation_components_count',
                accessorKey: 'estimation_components_count',
                header: 'Komp.',
                cell: ({ row }) => (
                    <Badge variant="outline" className="bg-blue-50">
                        {row.original.estimation_components_count || 0}
                    </Badge>
                ),
                enableSorting: false,
            },
            {
                id: 'total_weighted_case',
                accessorKey: 'total_weighted_case',
                header: 'Gesamt',
                cell: ({ row }) => {
                    const f = row.original;
                    return f.total_weighted_case != null && f.estimation_components_count
                        ? `${f.total_weighted_case.toFixed(2)} ${formatUnits(f.estimation_units)}`
                        : '-';
                },
                enableSorting: false,
            },
            {
                id: 'project',
                accessorFn: (row) => row.project?.name ?? '',
                header: ({ column }) => <DataTableColumnHeader column={column} label="Projekt" />,
                cell: ({ row }) => <span className="max-w-[120px] block truncate">{row.original.project?.name || '-'}</span>,
                filterFn: arrIncludesFilter,
                meta: {
                    label: 'Projekt',
                    variant: 'multiSelect',
                    options: uniqueProjects,
                },
                enableColumnFilter: true,
            },
            {
                id: 'requester',
                accessorFn: (row) => row.requester?.name ?? '',
                header: ({ column }) => <DataTableColumnHeader column={column} label="Anforderer" />,
                cell: ({ row }) => <span className="max-w-[110px] block truncate">{row.original.requester?.name || '-'}</span>,
                filterFn: arrIncludesFilter,
                meta: {
                    label: 'Anforderer',
                    variant: 'multiSelect',
                    options: uniqueRequesters,
                },
                enableColumnFilter: true,
            },
            {
                id: 'actions',
                header: () => <div className="text-right">Aktionen</div>,
                cell: ({ row }) => {
                    const feature = row.original;
                    return (
                        <div className="flex justify-end gap-2">
                            <Button asChild size="icon" variant="outline">
                                <Link href={route('features.show', feature.id)}>
                                    <Eye className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button asChild size="icon" variant="outline">
                                <Link href={route('features.edit', feature.id)}>
                                    <Pencil className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button
                                size="icon"
                                variant="destructive"
                                onClick={async () => {
                                    const ok = await confirm({
                                        title: 'Feature löschen',
                                        description: 'Möchten Sie dieses Feature wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
                                        confirmLabel: 'Löschen',
                                        cancelLabel: 'Abbrechen',
                                    });
                                    if (!ok) return;
                                    router.delete(route('features.destroy', feature.id));
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    );
                },
                enableSorting: false,
                enableHiding: false,
            },
        ],
        [uniqueStatuses, uniqueProjects, uniqueRequesters, confirm],
    );

    const initialFilters: ColumnFiltersState = initialFiltersProp.status
        ? [{ id: 'status', value: [initialFiltersProp.status] }]
        : [];

    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialFilters);

    const table = useReactTable({
        data: featureData,
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
            sorting: [{ id: 'jira_key', desc: false }],
            pagination: { pageSize: 10 },
        },
        getRowId: (row) => String(row.id),
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="mb-6 flex items-center justify-between p-5">
                <h1 className="text-2xl font-bold">Features</h1>
                <div className="flex gap-2">
                    <Button asChild variant="success">
                        <Link href={route('features.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Neues Feature
                        </Link>
                    </Button>
                    <Button variant="secondary" asChild>
                        <Link href={route('features.lineage')}>Lineage</Link>
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-4 p-5">
                <DataTable table={table} emptyMessage="Keine Features gefunden.">
                    <DataTableToolbar table={table} />
                </DataTable>
            </div>
        </AppLayout>
    );
}
