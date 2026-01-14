import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Inertia } from '@inertiajs/inertia';
import { Check } from 'lucide-react';
import React, { useState } from 'react';

interface DependencyItem {
    id: number;
    type: 'ermoeglicht' | 'verhindert' | 'bedingt' | 'ersetzt' | string;
    related: { id: number; jira_key: string; name: string } | null;
}

interface DependencyManagerProps {
    featureId: number;
    options: { id: number; jira_key: string; name: string }[];
    initialItems: DependencyItem[];
}

export default function DependencyManager({ featureId, options, initialItems }: DependencyManagerProps) {
    const [items, setItems] = useState<DependencyItem[]>(initialItems || []);
    const [type, setType] = useState<'ermoeglicht' | 'verhindert' | 'bedingt' | 'ersetzt' | 'ignore'>('ermoeglicht');
    const [relatedId, setRelatedId] = useState<string>('');
    const [open, setOpen] = useState(false);

    const add = (e: React.FormEvent) => {
        e.preventDefault();
        if (!relatedId || type === 'ignore') return;
        Inertia.post(route('features.dependencies.store', featureId), { related_feature_id: Number(relatedId), type });
    };

    const remove = (depId: number) => {
        Inertia.delete(route('features.dependencies.destroy', { feature: featureId, dependency: depId }));
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-2">
                <div>
                    <Label>Typ</Label>
                    <select className="rounded border px-2 py-1" value={type} onChange={(e) => setType(e.target.value as any)}>
                        <option value="ermoeglicht">ermöglicht</option>
                        <option value="verhindert">verhindert</option>
                        <option value="bedingt">bedingt</option>
                        <option value="ersetzt">ersetzt</option>
                    </select>
                </div>
                <div className="min-w-[260px] flex-1">
                    <Label>Feature</Label>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                                {relatedId
                                    ? (() => {
                                          const sel = options.find((o) => String(o.id) === String(relatedId));
                                          return sel ? `${sel.jira_key} — ${sel.name}` : '— Feature wählen —';
                                      })()
                                    : '— Feature wählen —'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Feature suchen..." className="h-9" />
                                <CommandEmpty>Kein Feature gefunden.</CommandEmpty>
                                <CommandGroup className="max-h-64 overflow-y-auto">
                                    {options.map((f) => (
                                        <CommandItem
                                            key={f.id}
                                            value={`${f.jira_key} ${f.name}`}
                                            onSelect={() => {
                                                setRelatedId(String(f.id));
                                                setOpen(false);
                                            }}
                                            className="text-sm"
                                        >
                                            <Check className={cn('mr-2 h-4 w-4', String(relatedId) === String(f.id) ? 'opacity-100' : 'opacity-0')} />
                                            {f.jira_key} — {f.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
                <Button onClick={add} type="button">
                    Hinzufügen
                </Button>
            </div>

            <div className="rounded border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Typ</TableHead>
                            <TableHead>Feature</TableHead>
                            <TableHead className="w-[120px] text-right">Aktionen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(items && items.length > 0 ? items : initialItems).map((dep) => (
                            <TableRow key={dep.id}>
                                <TableCell className="capitalize">{dep.type}</TableCell>
                                <TableCell>{dep.related ? `${dep.related.jira_key} — ${dep.related.name}` : '-'}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="destructive" size="sm" onClick={() => remove(dep.id)}>
                                        Entfernen
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
