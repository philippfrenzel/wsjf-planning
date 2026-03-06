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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { useConfirm } from '@/components/confirm-dialog-provider';
import MarkdownEditor from '@/components/markdown-editor';
import MarkdownViewer from '@/components/markdown-viewer';

interface ProjectOption {
    id: number;
    name: string;
}

interface Template {
    id: number;
    type: 'dor' | 'dod' | 'ust';
    title: string;
    description: string | null;
    body: string;
    is_active: boolean;
    projects: ProjectOption[];
}

type TemplateType = 'dor' | 'dod' | 'ust';

const TYPE_LABELS: Record<TemplateType, string> = {
    dor: 'Definition of Ready (DoR)',
    dod: 'Definition of Done (DoD)',
    ust: 'User Story Template',
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Startseite', href: '/' },
    { title: 'Templates', href: '#' },
];

export default function Index({ templates, projects }: { templates: Template[]; projects: ProjectOption[] }) {
    const confirm = useConfirm();
    const [editDialog, setEditDialog] = useState<{ open: boolean; template: Template | null }>({ open: false, template: null });
    const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
    const [form, setForm] = useState({
        type: 'dor' as TemplateType,
        title: '',
        description: '',
        body: '',
        is_active: true,
        project_ids: [] as number[],
    });

    const dorTemplates = templates.filter((t) => t.type === 'dor');
    const dodTemplates = templates.filter((t) => t.type === 'dod');
    const ustTemplates = templates.filter((t) => t.type === 'ust');

    const openCreate = (type: TemplateType) => {
        setForm({ type, title: '', description: '', body: '', is_active: true, project_ids: [] });
        setEditDialog({ open: true, template: null });
    };

    const openEdit = (template: Template) => {
        setForm({
            type: template.type,
            title: template.title,
            description: template.description || '',
            body: template.body || '',
            is_active: template.is_active,
            project_ids: template.projects.map((p) => p.id),
        });
        setEditDialog({ open: true, template });
    };

    const toggleProject = (id: number) => {
        setForm((f) => ({
            ...f,
            project_ids: f.project_ids.includes(id) ? f.project_ids.filter((p) => p !== id) : [...f.project_ids, id],
        }));
    };

    const submit = () => {
        const payload = {
            type: form.type,
            title: form.title,
            description: form.description || '',
            body: form.body,
            is_active: form.is_active,
            project_ids: form.project_ids as unknown as string,
        };

        if (editDialog.template) {
            router.put(route('definitions.update', editDialog.template.id), payload as never, {
                preserveScroll: true,
                onSuccess: () => setEditDialog({ open: false, template: null }),
            });
        } else {
            router.post(route('definitions.store'), payload as never, {
                preserveScroll: true,
                onSuccess: () => setEditDialog({ open: false, template: null }),
            });
        }
    };

    const handleDelete = async (template: Template) => {
        const ok = await confirm({
            title: 'Template löschen',
            description: `"${template.title}" wirklich löschen?`,
        });
        if (ok) router.delete(route('definitions.destroy', template.id), { preserveScroll: true });
    };

    const renderTemplate = (template: Template) => (
        <div key={template.id} className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold">{template.title}</h3>
                        {!template.is_active && <Badge variant="secondary" className="text-xs">Inaktiv</Badge>}
                    </div>
                    {template.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                    )}
                </div>
                <div className="flex gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewTemplate(template)} title="Vorschau">
                        <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(template)} title="Bearbeiten">
                        <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(template)} title="Löschen">
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
            {template.projects.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {template.projects.map((p) => (
                        <Badge key={p.id} variant="outline" className="text-[10px] px-1.5 py-0">
                            {p.name}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );

    const renderColumn = (type: TemplateType, items: Template[]) => (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{TYPE_LABELS[type]}</CardTitle>
                    <Button size="sm" onClick={() => openCreate(type)}>
                        <Plus className="mr-1 h-4 w-4" /> Neu
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Keine Templates vorhanden.</p>
                ) : (
                    items.map(renderTemplate)
                )}
            </CardContent>
        </Card>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Templates — DoR / DoD / UST" />
            <div className="mx-auto w-full max-w-7xl p-4 space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                    {renderColumn('dor', dorTemplates)}
                    {renderColumn('dod', dodTemplates)}
                    {renderColumn('ust', ustTemplates)}
                </div>

                {/* Preview Dialog */}
                <Dialog open={!!previewTemplate} onOpenChange={(o) => !o && setPreviewTemplate(null)}>
                    <DialogContent className="max-w-3xl flex flex-col" style={{ maxHeight: '90vh' }}>
                        <DialogHeader className="shrink-0">
                            <DialogTitle className="flex items-center gap-2">
                                {previewTemplate?.title}
                                <Badge variant="outline" className="text-xs font-normal">
                                    {previewTemplate ? TYPE_LABELS[previewTemplate.type] : ''}
                                </Badge>
                            </DialogTitle>
                            {previewTemplate?.description && (
                                <p className="text-sm text-muted-foreground">{previewTemplate.description}</p>
                            )}
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto rounded border bg-muted/30 p-4">
                            {previewTemplate?.body && (
                                <MarkdownViewer content={previewTemplate.body} className="prose prose-sm max-w-none" />
                            )}
                        </div>
                        {previewTemplate && previewTemplate.projects.length > 0 && (
                            <div className="shrink-0 flex flex-wrap gap-1 pt-2">
                                <span className="text-xs text-muted-foreground mr-1">Projekte:</span>
                                {previewTemplate.projects.map((p) => (
                                    <Badge key={p.id} variant="outline" className="text-xs">{p.name}</Badge>
                                ))}
                            </div>
                        )}
                        <DialogFooter className="shrink-0">
                            <Button variant="outline" onClick={() => { if (previewTemplate) { openEdit(previewTemplate); setPreviewTemplate(null); } }}>
                                <Pencil className="mr-1 h-4 w-4" /> Bearbeiten
                            </Button>
                            <Button onClick={() => setPreviewTemplate(null)}>Schließen</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Create/Edit Dialog */}
                <Dialog open={editDialog.open} onOpenChange={(o) => !o && setEditDialog({ open: false, template: null })}>
                    <DialogContent className="max-w-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
                        <DialogHeader className="shrink-0">
                            <DialogTitle>
                                {editDialog.template ? 'Template bearbeiten' : 'Neues Template erstellen'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                            <div>
                                <Label>Typ</Label>
                                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as TemplateType })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dor">Definition of Ready</SelectItem>
                                        <SelectItem value="dod">Definition of Done</SelectItem>
                                        <SelectItem value="ust">User Story Template</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Titel</Label>
                                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                            </div>
                            <div>
                                <Label>Kurzbeschreibung</Label>
                                <Input
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Optionale Kurzbeschreibung"
                                />
                            </div>
                            <div>
                                <Label>Inhalt (Markdown)</Label>
                                <MarkdownEditor
                                    value={form.body}
                                    onChange={(md) => setForm({ ...form, body: md })}
                                    placeholder="Template-Inhalt in Markdown …"
                                    minHeight={200}
                                    height={350}
                                />
                            </div>
                            {projects.length > 0 && (
                                <div>
                                    <Label>Projekt-Zuweisung</Label>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {projects.map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => toggleProject(p.id)}
                                                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                                    form.project_ids.includes(p.id)
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'border-input bg-background hover:bg-accent'
                                                }`}
                                            >
                                                {p.name}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Klicken um Projekte zuzuweisen. Ohne Auswahl gilt das Template für alle.
                                    </p>
                                </div>
                            )}
                        </div>
                        <DialogFooter className="shrink-0">
                            <Button variant="outline" onClick={() => setEditDialog({ open: false, template: null })}>Abbrechen</Button>
                            <Button onClick={submit} disabled={!form.title.trim() || !form.body.trim()}>Speichern</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
