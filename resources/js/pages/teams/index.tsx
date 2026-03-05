import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableToolbar, DataTableColumnHeader } from '@/components/data-table';
import AppLayout from '@/layouts/app-layout';
import type { SharedData, BreadcrumbItem } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { useConfirm } from '@/components/confirm-dialog-provider';
import { ColumnDef, useReactTable, getCoreRowModel, getFilteredRowModel, getSortedRowModel, getPaginationRowModel, ColumnFiltersState, SortingState } from '@tanstack/react-table';
import { useState } from 'react';
import { Eye, Pencil, Trash2, Plus, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

interface Team {
    id: number;
    name: string;
    description: string | null;
    members_count: number;
    members: { id: number; name: string; email: string }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Startseite', href: '/' },
    { title: 'Teams', href: '#' },
];

export default function Index({ teams }: { teams: Team[] }) {
    const { auth } = usePage<SharedData>().props;
    const canManage = auth.currentRole === 'Admin' || auth.currentRole === 'Planner';
    const confirm = useConfirm();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const columns: ColumnDef<Team>[] = [
        {
            accessorKey: 'name',
            header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />,
            meta: { label: 'Name', variant: 'text' as const, placeholder: 'Name suchen...' },
        },
        {
            accessorKey: 'members_count',
            header: ({ column }) => <DataTableColumnHeader column={column} label="Mitglieder" />,
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    {row.original.members_count}
                </div>
            ),
        },
        {
            id: 'members',
            header: 'Mitglieder',
            cell: ({ row }) => (
                <div className="flex flex-wrap gap-1">
                    {row.original.members.slice(0, 5).map((m) => (
                        <Badge key={m.id} variant="secondary" className="text-xs">{m.name}</Badge>
                    ))}
                    {row.original.members.length > 5 && (
                        <Badge variant="outline" className="text-xs">+{row.original.members.length - 5}</Badge>
                    )}
                </div>
            ),
        },
        ...(canManage ? [{
            id: 'actions',
            header: () => <div className="text-right">Aktionen</div>,
            cell: ({ row }: { row: { original: Team } }) => {
                const team = row.original;
                return (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={route('teams.edit', team.id)}>
                                        <Pencil className="mr-2 h-4 w-4" /> Bearbeiten
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={async () => {
                                        const ok = await confirm({
                                            title: 'Team löschen',
                                            description: `Möchten Sie "${team.name}" wirklich löschen?`,
                                            confirmLabel: 'Löschen',
                                            cancelLabel: 'Abbrechen',
                                        });
                                        if (ok) router.delete(route('teams.destroy', team.id));
                                    }}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Löschen
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        } as ColumnDef<Team>] : []),
    ];

    const table = useReactTable({
        data: teams,
        columns,
        state: { sorting, columnFilters },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 20 } },
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="mb-6 flex items-center justify-between p-5">
                <h1 className="text-2xl font-bold">Teams</h1>
                {canManage && (
                    <Button asChild>
                        <Link href={route('teams.create')}>
                            <Plus className="mr-1 h-4 w-4" /> Neues Team
                        </Link>
                    </Button>
                )}
            </div>
            <div className="px-5">
                <DataTableToolbar table={table} />
                <DataTable table={table} emptyMessage="Keine Teams vorhanden." />
            </div>
        </AppLayout>
    );
}
