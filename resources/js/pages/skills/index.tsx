import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { useConfirm } from '@/components/confirm-dialog-provider';
import { Pencil, Plus, Trash2, X, Save, Zap, Sparkles, Check } from 'lucide-react';
import { useState } from 'react';

interface Skill {
    id: number;
    name: string;
    category: string | null;
    description: string | null;
    users_count: number;
}

interface RoleItem {
    name: string;
    category: string;
    description: string;
    exists: boolean;
}

interface RoleSet {
    key: string;
    label: string;
    items: RoleItem[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Startseite', href: '/' },
    { title: 'Skills', href: '#' },
];

export default function Index({ skills, roleSets }: { skills: Skill[]; roleSets: RoleSet[] }) {
    const confirm = useConfirm();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [seedOpen, setSeedOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(roleSets[0]?.key ?? 'safe');
    const [selectedNames, setSelectedNames] = useState<Set<string>>(() => {
        const allAvailable = roleSets.flatMap((s) => s.items).filter((d) => !d.exists).map((d) => d.name);
        return new Set(allAvailable);
    });

    const createForm = useForm({ name: '', category: '', description: '' });
    const editForm = useForm({ name: '', category: '', description: '' });

    function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post(route('skills.store'), {
            onSuccess: () => createForm.reset(),
        });
    }

    function startEdit(skill: Skill) {
        setEditingId(skill.id);
        editForm.setData({
            name: skill.name,
            category: skill.category ?? '',
            description: skill.description ?? '',
        });
    }

    function handleUpdate(e: React.FormEvent, id: number) {
        e.preventDefault();
        editForm.put(route('skills.update', id), {
            onSuccess: () => setEditingId(null),
        });
    }

    async function handleDelete(skill: Skill) {
        const ok = await confirm({
            title: 'Skill löschen',
            description: `Möchten Sie "${skill.name}" wirklich löschen?`,
            confirmLabel: 'Löschen',
            cancelLabel: 'Abbrechen',
        });
        if (ok) router.delete(route('skills.destroy', skill.id));
    }

    const grouped = skills.reduce<Record<string, Skill[]>>((acc, skill) => {
        const cat = skill.category || 'Allgemein';
        (acc[cat] ??= []).push(skill);
        return acc;
    }, {});

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="mx-auto w-full max-w-4xl space-y-6 p-5">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Skills</h1>
                    <Popover open={seedOpen} onOpenChange={setSeedOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Sparkles className="mr-1.5 h-4 w-4" /> Projekt-Skills laden
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[28rem] p-0" align="end">
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <div className="border-b px-3 pt-3">
                                    <TabsList className="w-full">
                                        {roleSets.map((rs) => (
                                            <TabsTrigger key={rs.key} value={rs.key} className="flex-1 text-xs">
                                                {rs.label}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </div>
                                {roleSets.map((rs) => {
                                    const grouped = rs.items.reduce<Record<string, RoleItem[]>>((acc, d) => {
                                        (acc[d.category] ??= []).push(d);
                                        return acc;
                                    }, {});
                                    const availableNames = rs.items.filter((d) => !d.exists).map((d) => d.name);
                                    const tabSelected = availableNames.filter((n) => selectedNames.has(n));
                                    const allSelected = availableNames.length > 0 && tabSelected.length === availableNames.length;
                                    return (
                                        <TabsContent key={rs.key} value={rs.key} className="m-0 max-h-[24rem] overflow-y-auto px-3 pb-3">
                                            <div className="space-y-3">
                                                <div className="sticky top-0 z-10 flex items-center justify-between bg-popover pt-2 pb-1">
                                                    <span className="text-xs text-muted-foreground">
                                                        {tabSelected.length} / {availableNames.length} verfügbar ausgewählt
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="text-xs text-muted-foreground hover:underline"
                                                        onClick={() => {
                                                            setSelectedNames((prev) => {
                                                                const next = new Set(prev);
                                                                availableNames.forEach((n) => allSelected ? next.delete(n) : next.add(n));
                                                                return next;
                                                            });
                                                        }}
                                                    >
                                                        {allSelected ? 'Keine' : 'Alle'}
                                                    </button>
                                                </div>
                                                {Object.entries(grouped).map(([cat, items]) => {
                                                    const catAvail = items.filter((i) => !i.exists).map((i) => i.name);
                                                    const catSelectedCount = catAvail.filter((n) => selectedNames.has(n)).length;
                                                    const catAllSelected = catAvail.length > 0 && catSelectedCount === catAvail.length;
                                                    const catSomeSelected = catSelectedCount > 0 && !catAllSelected;
                                                    return (
                                                        <div key={cat}>
                                                            <label className={`flex items-center gap-2 mb-1 ${catAvail.length > 0 ? 'cursor-pointer' : 'cursor-default'}`}>
                                                                <input
                                                                    type="checkbox"
                                                                    className="h-4 w-4 rounded border-gray-300"
                                                                    checked={catAllSelected}
                                                                    ref={(el) => { if (el) el.indeterminate = catSomeSelected; }}
                                                                    disabled={catAvail.length === 0}
                                                                    onChange={() => {
                                                                        setSelectedNames((prev) => {
                                                                            const next = new Set(prev);
                                                                            catAvail.forEach((n) => catAllSelected ? next.delete(n) : next.add(n));
                                                                            return next;
                                                                        });
                                                                    }}
                                                                />
                                                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{cat}</span>
                                                                <span className="text-[10px] text-muted-foreground">({catSelectedCount}/{catAvail.length})</span>
                                                            </label>
                                                            {items.map((item) => (
                                                                <label
                                                                    key={item.name}
                                                                    className={`flex items-start gap-2 rounded px-1.5 py-1 text-sm ${item.exists ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-accent'}`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        className="mt-0.5 h-4 w-4 rounded border-gray-300"
                                                                        disabled={item.exists}
                                                                        checked={item.exists || selectedNames.has(item.name)}
                                                                        onChange={() => {
                                                                            if (item.exists) return;
                                                                            setSelectedNames((prev) => {
                                                                                const next = new Set(prev);
                                                                                next.has(item.name) ? next.delete(item.name) : next.add(item.name);
                                                                                return next;
                                                                            });
                                                                        }}
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="font-medium">{item.name}</span>
                                                                            {item.exists && <Check className="h-3 w-3 text-green-500" />}
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground leading-tight">{item.description}</p>
                                                                    </div>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </TabsContent>
                                    );
                                })}
                            </Tabs>
                            <div className="border-t p-3">
                                <Button
                                    size="sm"
                                    className="w-full"
                                    disabled={selectedNames.size === 0}
                                    onClick={() => {
                                        router.post(
                                            route('skills.seed-defaults'),
                                            { names: Array.from(selectedNames) },
                                            {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    setSeedOpen(false);
                                                    setSelectedNames(new Set());
                                                },
                                            },
                                        );
                                    }}
                                >
                                    {selectedNames.size} Rolle{selectedNames.size !== 1 ? 'n' : ''} hinzufügen
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Create form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Plus className="h-4 w-4" /> Neuen Skill anlegen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
                            <div className="min-w-[180px] flex-1">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    placeholder="z.B. React, Java, AWS"
                                    required
                                />
                            </div>
                            <div className="min-w-[140px] flex-1">
                                <Label htmlFor="category">Kategorie</Label>
                                <Input
                                    id="category"
                                    value={createForm.data.category}
                                    onChange={(e) => createForm.setData('category', e.target.value)}
                                    placeholder="z.B. Frontend, Backend"
                                />
                            </div>
                            <div className="min-w-[200px] flex-1">
                                <Label htmlFor="description">Beschreibung</Label>
                                <Input
                                    id="description"
                                    value={createForm.data.description}
                                    onChange={(e) => createForm.setData('description', e.target.value)}
                                    placeholder="Optionale Beschreibung"
                                />
                            </div>
                            <Button type="submit" disabled={createForm.processing}>
                                <Plus className="mr-1 h-4 w-4" /> Hinzufügen
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Grouped list */}
                {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([category, catSkills]) => (
                    <Card key={category}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Zap className="h-4 w-4" /> {category}
                                <Badge variant="secondary" className="ml-1">{catSkills.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {catSkills.map((skill) => (
                                    <div key={skill.id}>
                                        {editingId === skill.id ? (
                                            <form onSubmit={(e) => handleUpdate(e, skill.id)} className="flex flex-wrap items-center gap-2">
                                                <Input
                                                    className="h-8 min-w-[150px] flex-1"
                                                    value={editForm.data.name}
                                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                                    required
                                                />
                                                <Input
                                                    className="h-8 min-w-[120px] flex-1"
                                                    value={editForm.data.category}
                                                    onChange={(e) => editForm.setData('category', e.target.value)}
                                                    placeholder="Kategorie"
                                                />
                                                <Input
                                                    className="h-8 min-w-[180px] flex-1"
                                                    value={editForm.data.description}
                                                    onChange={(e) => editForm.setData('description', e.target.value)}
                                                    placeholder="Beschreibung"
                                                />
                                                <Button type="submit" size="sm" disabled={editForm.processing}>
                                                    <Save className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                                    <X className="h-3.5 w-3.5" />
                                                </Button>
                                            </form>
                                        ) : (
                                            <div className="flex items-center justify-between rounded-md border px-3 py-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-medium">{skill.name}</span>
                                                    {skill.description && (
                                                        <span className="text-muted-foreground text-sm">{skill.description}</span>
                                                    )}
                                                    <Badge variant="outline" className="text-xs">{skill.users_count} Nutzer</Badge>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(skill)}>
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(skill)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {skills.length === 0 && (
                    <div className="text-muted-foreground py-12 text-center">
                        Noch keine Skills vorhanden. Erstellen Sie oben den ersten Skill.
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
