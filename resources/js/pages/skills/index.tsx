import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { useConfirm } from '@/components/confirm-dialog-provider';
import { Pencil, Plus, Trash2, X, Save, Zap, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface Skill {
    id: number;
    name: string;
    category: string | null;
    description: string | null;
    users_count: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Startseite', href: '/' },
    { title: 'Skills', href: '#' },
];

export default function Index({ skills }: { skills: Skill[] }) {
    const confirm = useConfirm();
    const [editingId, setEditingId] = useState<number | null>(null);

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
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.post(route('skills.seed-defaults'), {}, { preserveScroll: true })}
                    >
                        <Sparkles className="mr-1.5 h-4 w-4" /> SAFe-Rollen laden
                    </Button>
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
