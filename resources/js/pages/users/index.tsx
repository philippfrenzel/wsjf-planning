import { useConfirm } from '@/components/confirm-dialog-provider';
import { DataTable, DataTableColumnHeader, DataTableToolbar } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import {
    type ColumnDef,
    type ColumnFiltersState,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Role {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    roles?: Role[];
}

interface UsersIndexProps {
    users: User[];
}

export default function Index({ users }: UsersIndexProps) {
    const confirm = useConfirm();

    const handleDeleteUser = async (userId: number, userName: string) => {
        const ok = await confirm({
            title: 'Benutzer löschen',
            description: `Möchten Sie den Benutzer "${userName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
            confirmLabel: 'Löschen',
            cancelLabel: 'Abbrechen',
        });
        if (!ok) return;
        router.delete(route('users.destroy', { user: userId }));
    };

    const columns = useMemo<ColumnDef<User>[]>(
        () => [
            {
                id: 'name',
                accessorKey: 'name',
                header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />,
                cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
                meta: {
                    label: 'Name',
                    placeholder: 'Name filtern...',
                    variant: 'text',
                },
                enableColumnFilter: true,
            },
            {
                id: 'email',
                accessorKey: 'email',
                header: ({ column }) => <DataTableColumnHeader column={column} label="E-Mail" />,
                meta: {
                    label: 'E-Mail',
                    placeholder: 'E-Mail filtern...',
                    variant: 'text',
                },
                enableColumnFilter: true,
            },
            {
                id: 'roles',
                accessorKey: 'roles',
                header: 'Rollen',
                cell: ({ row }) => {
                    const user = row.original;
                    return (
                        <div className="flex flex-wrap gap-1">
                            {user.roles &&
                                user.roles.map((role) => (
                                    <Badge key={role.id} variant="outline">
                                        {role.name}
                                    </Badge>
                                ))}
                            {(!user.roles || user.roles.length === 0) && (
                                <span className="text-muted-foreground text-sm">Keine Rollen</span>
                            )}
                        </div>
                    );
                },
                enableSorting: false,
                enableColumnFilter: false,
            },
            {
                id: 'actions',
                header: () => <div className="text-right">Aktionen</div>,
                cell: ({ row }) => {
                    const user = row.original;
                    return (
                        <div className="flex justify-end gap-2">
                            <Button asChild size="icon" variant="outline">
                                <Link href={route('users.show', user.id)}>
                                    <Eye className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button asChild size="icon" variant="outline">
                                <Link href={route('users.edit', user.id)}>
                                    <Pencil className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => handleDeleteUser(user.id, user.name)}
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
        [confirm],
    );

    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const table = useReactTable({
        data: users,
        columns,
        state: { columnFilters },
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        defaultColumn: { enableColumnFilter: false },
        initialState: {
            sorting: [{ id: 'name', desc: false }],
            pagination: { pageSize: 10 },
        },
        getRowId: (row) => String(row.id),
    });

    return (
        <AppLayout>
            <Head title="Benutzer" />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Benutzerverwaltung</h1>
                    <Button asChild>
                        <Link href={route('users.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Neuer Benutzer
                        </Link>
                    </Button>
                </div>

                <DataTable table={table} emptyMessage="Keine Benutzer gefunden.">
                    <DataTableToolbar table={table} />
                </DataTable>
            </div>
        </AppLayout>
    );
}
