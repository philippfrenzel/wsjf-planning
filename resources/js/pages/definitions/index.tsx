import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { useConfirm } from '@/components/confirm-dialog-provider';
import MarkdownEditor from '@/components/markdown-editor';
import MarkdownViewer from '@/components/markdown-viewer';

interface ChecklistItem {
    text: string;
    required: boolean;
}

interface Checklist {
    id: number;
    type: 'dor' | 'dod';
    title: string;
    description: string | null;
    items: ChecklistItem[];
    is_active: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Startseite', href: '/' },
    { title: 'DoR / DoD', href: '#' },
];

export default function Index({ checklists }: { checklists: Checklist[] }) {
    const confirm = useConfirm();
    const [dialog, setDialog] = useState<{ open: boolean; checklist: Checklist | null }>({ open: false, checklist: null });
    const [form, setForm] = useState({
        type: 'dor' as 'dor' | 'dod',
        title: '',
        description: '',
        items: [{ text: '', required: true }] as ChecklistItem[],
        is_active: true,
    });

    const dorChecklists = checklists.filter((c) => c.type === 'dor');
    const dodChecklists = checklists.filter((c) => c.type === 'dod');

    const openCreate = (type: 'dor' | 'dod') => {
        setForm({ type, title: '', description: '', items: [{ text: '', required: true }], is_active: true });
        setDialog({ open: true, checklist: null });
    };

    const openEdit = (checklist: Checklist) => {
        setForm({
            type: checklist.type,
            title: checklist.title,
            description: checklist.description || '',
            items: checklist.items.length > 0 ? checklist.items : [{ text: '', required: true }],
            is_active: checklist.is_active,
        });
        setDialog({ open: true, checklist });
    };

    const addItem = () => setForm({ ...form, items: [...form.items, { text: '', required: false }] });
    const removeItem = (idx: number) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
    const updateItem = (idx: number, field: keyof ChecklistItem, value: string | boolean) => {
        const items = [...form.items];
        items[idx] = { ...items[idx], [field]: value };
        setForm({ ...form, items });
    };

    const submit = () => {
        const validItems = form.items.filter((i) => i.text.trim());
        const payload = {
            type: form.type,
            title: form.title,
            description: form.description || '',
            items: validItems as unknown as string,
            is_active: form.is_active,
        };

        if (dialog.checklist) {
            router.put(route('definitions.update', dialog.checklist.id), payload as never, {
                preserveScroll: true,
                onSuccess: () => setDialog({ open: false, checklist: null }),
            });
        } else {
            router.post(route('definitions.store'), payload as never, {
                preserveScroll: true,
                onSuccess: () => setDialog({ open: false, checklist: null }),
            });
        }
    };

    const handleDelete = async (checklist: Checklist) => {
        const ok = await confirm({
            title: 'Definition löschen',
            description: `"${checklist.title}" wirklich löschen?`,
        });
        if (ok) router.delete(route('definitions.destroy', checklist.id), { preserveScroll: true });
    };

    const renderChecklist = (checklist: Checklist) => (
        <div key={checklist.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{checklist.title}</h3>
                        {!checklist.is_active && <Badge variant="secondary">Inaktiv</Badge>}
                    </div>
                    {checklist.description && <MarkdownViewer content={checklist.description} className="mt-1" />}
                </div>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(checklist)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(checklist)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <ul className="mt-3 space-y-1">
                {checklist.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                        <span className={`inline-block h-2 w-2 rounded-full ${item.required ? 'bg-red-500' : 'bg-gray-300'}`} />
                        <span>{item.text}</span>
                        {item.required && <span className="text-[10px] text-red-500">Pflicht</span>}
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="DoR / DoD" />
            <div className="mx-auto w-full max-w-5xl p-4 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    {/* DoR */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Definition of Ready (DoR)</CardTitle>
                                <Button size="sm" onClick={() => openCreate('dor')}>
                                    <Plus className="mr-1 h-4 w-4" /> Neu
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {dorChecklists.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Keine DoR-Checklisten vorhanden.</p>
                            ) : (
                                dorChecklists.map(renderChecklist)
                            )}
                        </CardContent>
                    </Card>

                    {/* DoD */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Definition of Done (DoD)</CardTitle>
                                <Button size="sm" onClick={() => openCreate('dod')}>
                                    <Plus className="mr-1 h-4 w-4" /> Neu
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {dodChecklists.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Keine DoD-Checklisten vorhanden.</p>
                            ) : (
                                dodChecklists.map(renderChecklist)
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Create/Edit Dialog */}
                <Dialog open={dialog.open} onOpenChange={(o) => !o && setDialog({ open: false, checklist: null })}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {dialog.checklist ? 'Definition bearbeiten' : 'Neue Definition erstellen'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Typ</Label>
                                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as 'dor' | 'dod' })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dor">Definition of Ready</SelectItem>
                                        <SelectItem value="dod">Definition of Done</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Titel</Label>
                                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                            </div>
                            <div>
                                <Label>Beschreibung</Label>
                                <MarkdownEditor value={form.description} onChange={(md) => setForm({ ...form, description: md })} placeholder="Beschreibung (Markdown)" minHeight="100px" />
                            </div>
                            <div>
                                <Label>Checklist-Punkte</Label>
                                <div className="mt-2 space-y-2">
                                    {form.items.map((item, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <Input
                                                className="flex-1"
                                                placeholder={`Punkt ${i + 1}`}
                                                value={item.text}
                                                onChange={(e) => updateItem(i, 'text', e.target.value)}
                                            />
                                            <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={item.required}
                                                    onChange={(e) => updateItem(i, 'required', e.target.checked)}
                                                />
                                                Pflicht
                                            </label>
                                            {form.items.length > 1 && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(i)}>
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" onClick={addItem}>
                                        <Plus className="mr-1 h-3 w-3" /> Punkt hinzufügen
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialog({ open: false, checklist: null })}>Abbrechen</Button>
                            <Button onClick={submit}>Speichern</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
