import type { Column } from '@tanstack/react-table';
import { Check, PlusCircle, XCircle } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface FilterOption {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
    count?: number;
}

interface DataTableFacetedFilterProps<TData, TValue> {
    column?: Column<TData, TValue>;
    title?: string;
    options: FilterOption[];
    multiple?: boolean;
}

export function DataTableFacetedFilter<TData, TValue>({ column, title, options, multiple }: DataTableFacetedFilterProps<TData, TValue>) {
    const [open, setOpen] = React.useState(false);

    const columnFilterValue = column?.getFilterValue();
    const selectedValues = new Set(Array.isArray(columnFilterValue) ? columnFilterValue : []);

    const onItemSelect = React.useCallback(
        (option: FilterOption, isSelected: boolean) => {
            if (!column) return;

            if (multiple) {
                const newSelectedValues = new Set(selectedValues);
                if (isSelected) {
                    newSelectedValues.delete(option.value);
                } else {
                    newSelectedValues.add(option.value);
                }
                const filterValues = Array.from(newSelectedValues);
                column.setFilterValue(filterValues.length ? filterValues : undefined);
            } else {
                column.setFilterValue(isSelected ? undefined : [option.value]);
                setOpen(false);
            }
        },
        [column, multiple, selectedValues],
    );

    const onReset = React.useCallback(
        (event?: React.MouseEvent) => {
            event?.stopPropagation();
            column?.setFilterValue(undefined);
        },
        [column],
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="border-dashed font-normal">
                    {selectedValues?.size > 0 ? (
                        <div
                            role="button"
                            aria-label={`${title} Filter zurücksetzen`}
                            tabIndex={0}
                            className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            onClick={onReset}
                        >
                            <XCircle className="h-4 w-4" />
                        </div>
                    ) : (
                        <PlusCircle className="h-4 w-4" />
                    )}
                    {title}
                    {selectedValues?.size > 0 && (
                        <>
                            <Separator orientation="vertical" className="mx-0.5 data-[orientation=vertical]:h-4" />
                            <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                                {selectedValues.size}
                            </Badge>
                            <div className="hidden items-center gap-1 lg:flex">
                                {selectedValues.size > 2 ? (
                                    <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                                        {selectedValues.size} ausgewählt
                                    </Badge>
                                ) : (
                                    options
                                        .filter((option) => selectedValues.has(option.value))
                                        .map((option) => (
                                            <Badge variant="secondary" key={option.value} className="rounded-sm px-1 font-normal">
                                                {option.label}
                                            </Badge>
                                        ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-50 p-0" align="start">
                <Command>
                    <CommandInput placeholder={title} />
                    <CommandList className="max-h-full">
                        <CommandEmpty>Keine Ergebnisse.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] scroll-py-1 overflow-y-auto overflow-x-hidden">
                            {options.map((option) => {
                                const isSelected = selectedValues.has(option.value);

                                return (
                                    <CommandItem key={option.value} onSelect={() => onItemSelect(option, isSelected)}>
                                        <div
                                            className={cn(
                                                'flex size-4 items-center justify-center rounded-sm border border-primary',
                                                isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible',
                                            )}
                                        >
                                            <Check className="h-3 w-3" />
                                        </div>
                                        {option.icon && <option.icon className="h-4 w-4 text-muted-foreground" />}
                                        <span className="truncate">{option.label}</span>
                                        {option.count != null && <span className="ml-auto font-mono text-xs">{option.count}</span>}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                        {selectedValues.size > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem onSelect={() => onReset()} className="justify-center text-center">
                                        Filter zurücksetzen
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
