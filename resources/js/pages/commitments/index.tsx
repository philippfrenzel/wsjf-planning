import { useConfirm } from '@/components/confirm-dialog-provider';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WorkflowStateBadge } from '@/components/workflow-state-badge';
import AppLayout from '@/layouts/app-layout';
import { Link, router } from '@inertiajs/react';
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
import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Planning {
    id: number;
    title: string;
}

interface User {
    id: number;
    name: string;
}

interface Feature {
    id: number;
    jira_key: string;
    name: string;
}

interface Commitment {
    id: number;
    planning: Planning;
    feature: Feature;
    user: User;
    commitment_type: string;
    status_details?: {
        value: string;
        name: string;
        color: string;
    };
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

interface CommitmentsIndexProps {
    commitments: Commitment[] | Paginated<Commitment>;
    plannings: Planning[];
    selectedPlanning?: number;
}

function getCommitmentTypeBadge(type: string) {
    const classes = {
        D: 'bg-red-100 text-red-800',
        C: 'bg-blue-100 text-blue-800',
        B: 'bg-yellow-100 text-yellow-800',
        A: 'bg-green-100 text-green-800',
    };
    const labels = {
        A: 'Typ A - Hohe P & D',
        B: 'Typ B - Hohe P, geringe D',
        C: 'Typ C - Geringe P, hohe D',
        D: 'Typ D - Geringe P & D',
    };

    return <Badge className={classes[type as keyof typeof classes]}>{labels[type as keyof typeof labels]}</Badge>;
}

function arrIncludesFilter(row: any, columnId: string, filterValue: string[]) {
    if (!filterValue?.length) return true;
    const value = row.getValue(columnId);
    return filterValue.includes(value as string);
}

export default function CommitmentsIndex({ commitments, plannings, selectedPlanning }: CommitmentsIndexProps) {
    const confirm = useConfirm();
    const commitmentData = Array.isArray(commitments) ? commitments : commitments.data;

    const planningOptions = useMemo(
        () => plannings.map((p) => ({ label: p.title, value: String(p.id) })),
        [plannings],
    );

    const initialFilters: ColumnFiltersState = selectedPlanning
        ? [{ id: 'planning', value: [String(selectedPlanning)] }]
        : [];

    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialFilters);

    const columns = useMemo<ColumnDef<Commitment>[]>(
        () => [
            {
                id: 'planning',
                accessorFn: (row) => String(row.planning.id),
                header: ({ column }) => <DataTableColumnHeader column={column} label="Planning" />,
                cell: ({ row }) => row.original.planning.title,
                filterFn: arrIncludesFilter,
                meta: {
                    label: 'Planning',
                    variant: 'multiSelect' as const,
                    options: planningOptions,
                },
                enableColumnFilter: true,
            },
            {
                id: 'feature',
                accessorFn: (row) => `${row.feature.jira_key}: ${row.feature.name}`,
                header: ({ column }) => <DataTableColumnHeader column={column} label="Feature" />,
                cell: ({ row }) => (
                    <span>
                        {row.original.feature.jira_key}: {row.original.feature.name}
                    </span>
                ),
            },
            {
                id: 'commitment_type',
                accessorKey: 'commitment_type',
                header: 'Commitment-Typ',
                cell: ({ row }) => getCommitmentTypeBadge(row.original.commitment_type),
                enableSorting: false,
            },
            {
                id: 'user',
                accessorFn: (row) => row.user.name,
                header: ({ column }) => <DataTableColumnHeader column={column} label="Benutzer" />,
                cell: ({ row }) => row.original.user.name,
            },
            {
                id: 'status',
                accessorFn: (row) => row.status_details?.name ?? '',
                header: 'Status',
                cell: ({ row }) => <WorkflowStateBadge statusDetails={row.original.status_details} />,
                enableSorting: false,
            },
            {
                id: 'actions',
                header: 'Aktionen',
                cell: ({ row }) => {
                    const commitment = row.original;
                    return (
                        <div className="flex gap-2">
                            <Link href={route('commitments.show', commitment.id)}>
                                <Button size="sm" variant="outline">
                                    Anzeigen
                                </Button>
                            </Link>
                            <Link href={route('commitments.edit', commitment.id)}>
                                <Button size="sm" variant="outline">
                                    Bearbeiten
                                </Button>
                            </Link>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={async () => {
                                    const ok = await confirm({
                                        title: 'Commitment löschen',
                                        description: 'Soll dieses Commitment wirklich gelöscht werden?',
                                        confirmLabel: 'Löschen',
                                        cancelLabel: 'Abbrechen',
                                    });
                                    if (!ok) return;
                                    router.delete(route('commitments.destroy', commitment.id));
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                                Löschen
                            </Button>
                        </div>
                    );
                },
                enableSorting: false,
                enableHiding: false,
            },
        ],
        [planningOptions, confirm],
    );

    const table = useReactTable({
        data: commitmentData,
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
            sorting: [{ id: 'planning', desc: false }],
            pagination: { pageSize: 10 },
        },
        getRowId: (row) => String(row.id),
    });

    return (
        <AppLayout breadcrumbs={[{ title: 'Commitments', href: route('commitments.index') }]}>
            <div className="my-6 flex items-center justify-between p-5">
                <h1 className="text-2xl font-bold">Commitments</h1>
                <Link href={route('commitments.create', selectedPlanning ? { planning_id: selectedPlanning } : {})}>
                    <Button>Neues Commitment</Button>
                </Link>
            </div>

            <div className="flex flex-col gap-4 p-5">
                <DataTable table={table} emptyMessage="Keine Commitments gefunden.">
                    <DataTableToolbar table={table} />
                </DataTable>
            </div>
        </AppLayout>
    );
}
