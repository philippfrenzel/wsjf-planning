import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Eye, Save, X } from 'lucide-react';
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

const TYPE_SHORT: Record<TemplateType, string> = {
    dor: 'DoR',
    dod: 'DoD',
    ust: 'UST',
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Startseite', href: '/' },
    { title: 'Templates', href: '#' },
];

type PanelMode = 'preview' | 'edit' | 'create';

export default function Index({ templates }: { templates: Template[] }) {
    const confirm = useConfirm();
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [panelMode, setPanelMode] = useState<PanelMode | null>(null);
    const [form, setForm] = useState({
        type: 'dor' as TemplateType,
        title: '',
        description: '',
        body: '',
        is_active: true,
    });

    const dorTemplates = templates.filter((t) => t.type === 'dor');
    const dodTemplates = templates.filter((t) => t.type === 'dod');
    const ustTemplates = templates.filter((t) => t.type === 'ust');

    const openPreview = (template: Template) => {
        setSelectedTemplate(template);
        setPanelMode('preview');
    };

    const openEdit = (template: Template) => {
        setSelectedTemplate(template);
        setForm({
            type: template.type,
            title: template.title,
            description: template.description || '',
            body: template.body || '',
            is_active: template.is_active,
        });
        setPanelMode('edit');
    };

    const openCreate = (type: TemplateType) => {
        setSelectedTemplate(null);
        setForm({ type, title: '', description: '', body: '', is_active: true });
        setPanelMode('create');
    };

    const closePanel = () => {
        setPanelMode(null);
        setSelectedTemplate(null);
    };

    const submit = () => {
        const payload = {
            type: form.type,
            title: form.title,
            description: form.description || '',
            body: form.body,
            is_active: form.is_active,
        };

        if (panelMode === 'edit' && selectedTemplate) {
            router.put(route('definitions.update', selectedTemplate.id), payload as never, {
                preserveScroll: true,
                onSuccess: () => closePanel(),
            });
        } else if (panelMode === 'create') {
            router.post(route('definitions.store'), payload as never, {
                preserveScroll: true,
                onSuccess: () => closePanel(),
            });
        }
    };

    const handleDelete = async (template: Template) => {
        const ok = await confirm({
            title: 'Template löschen',
            description: `"${template.title}" wirklich löschen?`,
        });
        if (ok) {
            if (selectedTemplate?.id === template.id) closePanel();
            router.delete(route('definitions.destroy', template.id), { preserveScroll: true });
        }
    };

    const renderSidebarItem = (template: Template) => {
        const isActive = selectedTemplate?.id === template.id;
        return (
            <div
                key={template.id}
                className={`group cursor-pointer rounded-md border px-3 py-2 transition-colors ${
                    isActive ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => openPreview(template)}
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium truncate">{template.title}</span>
                            {!template.is_active && <Badge variant="secondary" className="text-[10px] px-1 py-0">Inaktiv</Badge>}
                        </div>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); openEdit(template); }} title="Bearbeiten">
                            <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleDelete(template); }} title="Löschen">
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
                {template.projects.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                        {template.projects.map((p) => (
                            <Badge key={p.id} variant="outline" className="text-[10px] px-1 py-0">{p.name}</Badge>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderTypeGroup = (type: TemplateType, items: Template[]) => (
        <div key={type}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{TYPE_SHORT[type]}</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openCreate(type)} title={`Neues ${TYPE_SHORT[type]} Template`}>
                    <Plus className="h-3.5 w-3.5" />
                </Button>
            </div>
            {items.length === 0 ? (
                <p className="text-xs text-muted-foreground italic pl-1">Keine Templates</p>
            ) : (
                <div className="space-y-1.5">{items.map(renderSidebarItem)}</div>
            )}
        </div>
    );

    const renderPanel = () => {
        if (!panelMode) {
            return (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                    <div className="text-center space-y-2">
                        <Eye className="h-10 w-10 mx-auto opacity-30" />
                        <p className="text-sm">Template auswählen oder neues erstellen</p>
                    </div>
                </div>
            );
        }

        if (panelMode === 'preview' && selectedTemplate) {
            return (
                <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                {selectedTemplate.title}
                                <Badge variant="outline" className="text-xs font-normal">{TYPE_LABELS[selectedTemplate.type]}</Badge>
                                {!selectedTemplate.is_active && <Badge variant="secondary" className="text-xs">Inaktiv</Badge>}
                            </h2>
                            {selectedTemplate.description && (
                                <p className="text-sm text-muted-foreground mt-0.5">{selectedTemplate.description}</p>
                            )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button size="sm" variant="outline" onClick={() => openEdit(selectedTemplate)}>
                                <Pencil className="mr-1 h-3.5 w-3.5" /> Bearbeiten
                            </Button>
                            <Button size="sm" variant="ghost" onClick={closePanel}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                        {selectedTemplate.body && (
                            <MarkdownViewer content={selectedTemplate.body} className="prose prose-sm max-w-none" />
                        )}
                    </div>
                    {selectedTemplate.projects.length > 0 && (
                        <div className="shrink-0 border-t px-4 py-2 flex flex-wrap gap-1">
                            <span className="text-xs text-muted-foreground mr-1">Projekte:</span>
                            {selectedTemplate.projects.map((p) => (
                                <Badge key={p.id} variant="outline" className="text-xs">{p.name}</Badge>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        // Edit or Create mode
        return (
            <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
                    <h2 className="text-lg font-semibold">
                        {panelMode === 'edit' ? 'Template bearbeiten' : 'Neues Template erstellen'}
                    </h2>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={closePanel}>
                            <X className="mr-1 h-3.5 w-3.5" /> Abbrechen
                        </Button>
                        <Button size="sm" onClick={submit} disabled={!form.title.trim() || !form.body.trim()}>
                            <Save className="mr-1 h-3.5 w-3.5" /> Speichern
                        </Button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>
                    <div>
                        <Label>Kurzbeschreibung</Label>
                        <Input
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Optionale Kurzbeschreibung"
                        />
                    </div>
                    <div className="flex-1">
                        <Label>Inhalt (Markdown)</Label>
                        <MarkdownEditor
                            value={form.body}
                            onChange={(md) => setForm({ ...form, body: md })}
                            placeholder="Template-Inhalt in Markdown …"
                            minHeight={300}
                            height={500}
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Templates — DoR / DoD / UST" />
            <div className="mx-auto w-full max-w-7xl p-4">
                <div className="grid grid-cols-[280px_1fr] gap-4" style={{ height: 'calc(100vh - 8rem)' }}>
                    {/* Left sidebar */}
                    <Card className="flex flex-col overflow-hidden">
                        <CardHeader className="shrink-0 pb-3">
                            <CardTitle className="text-base">Templates</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-5 pb-4">
                            {renderTypeGroup('dor', dorTemplates)}
                            {renderTypeGroup('dod', dodTemplates)}
                            {renderTypeGroup('ust', ustTemplates)}
                        </CardContent>
                    </Card>

                    {/* Right content area */}
                    <Card className="overflow-hidden">
                        {renderPanel()}
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
