import type { FilterOption } from '@/components/data-table/data-table-faceted-filter';
import type { RowData } from '@tanstack/react-table';

declare module '@tanstack/react-table' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData extends RowData, TValue> {
        label?: string;
        placeholder?: string;
        variant?: 'text' | 'select' | 'multiSelect';
        options?: FilterOption[];
    }
}
