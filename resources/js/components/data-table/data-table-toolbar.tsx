import type { Column, Table } from '@tanstack/react-table';
import { X } from 'lucide-react';
import * as React from 'react';

import { DataTableFacetedFilter } from '@/components/data-table/data-table-faceted-filter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DataTableToolbarProps<TData> extends React.ComponentProps<'div'> {
    table: Table<TData>;
}

export function DataTableToolbar<TData>({ table, children, className, ...props }: DataTableToolbarProps<TData>) {
    const isFiltered = table.getState().columnFilters.length > 0;

    const columns = React.useMemo(() => table.getAllColumns().filter((column) => column.getCanFilter()), [table]);

    const onReset = React.useCallback(() => {
        table.resetColumnFilters();
    }, [table]);

    return (
        <div role="toolbar" aria-orientation="horizontal" className={cn('flex w-full items-start justify-between gap-2 p-1', className)} {...props}>
            <div className="flex flex-1 flex-wrap items-center gap-2">
                {columns.map((column) => (
                    <DataTableToolbarFilter key={column.id} column={column} />
                ))}
                {isFiltered && (
                    <Button aria-label="Filter zurücksetzen" variant="outline" size="sm" className="border-dashed" onClick={onReset}>
                        <X className="mr-1 h-4 w-4" />
                        Zurücksetzen
                    </Button>
                )}
            </div>
            {children && <div className="flex items-center gap-2">{children}</div>}
        </div>
    );
}

interface DataTableToolbarFilterProps<TData> {
    column: Column<TData>;
}

function DataTableToolbarFilter<TData>({ column }: DataTableToolbarFilterProps<TData>) {
    const columnMeta = column.columnDef.meta;

    if (!columnMeta?.variant) return null;

    switch (columnMeta.variant) {
        case 'text':
            return (
                <Input
                    placeholder={columnMeta.placeholder ?? columnMeta.label}
                    value={(column.getFilterValue() as string) ?? ''}
                    onChange={(event) => column.setFilterValue(event.target.value)}
                    className="h-8 w-40 lg:w-56"
                />
            );

        case 'select':
        case 'multiSelect':
            return (
                <DataTableFacetedFilter
                    column={column}
                    title={columnMeta.label ?? column.id}
                    options={columnMeta.options ?? []}
                    multiple={columnMeta.variant === 'multiSelect'}
                />
            );

        default:
            return null;
    }
}
