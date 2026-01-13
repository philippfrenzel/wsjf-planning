import { Comments } from '@/components/comments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Inertia } from '@inertiajs/inertia';
import { usePage } from '@inertiajs/react';
import TextAlign from '@tiptap/extension-text-align';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Check, Save, X } from 'lucide-react';
import React, { useState } from 'react';

interface Project {
    id: number;
    name: string;
}
interface User {
    id: number;
    name: string;
}
interface DependencyItem {
    id: number;
    type: 'ermoeglicht' | 'verhindert' | 'bedingt' | 'ersetzt' | string;
    related: { id: number; jira_key: string; name: string } | null;
}

interface Feature {
    id: number;
    jira_key: string;
    name: string;
    description: string;
    requester_id: string | null;
    project_id: string;
    project?: {
        id: number;
        name: string;
    };
    status?: {
        name: string;
        color: string;
    };
    dependencies?: DependencyItem[];
}
interface StatusOption {
    value: string;
    label: string;
    color: string;
    current: boolean;
}

interface EditProps {
    feature: Feature;
    projects: Project[];
    users: User[];
    statusOptions: StatusOption[];
    featureOptions?: { id: number; jira_key: string; name: string }[];
    dependencies?: DependencyItem[];
}

export default function Edit({ feature, projects, users, statusOptions, featureOptions = [], dependencies = [] }: EditProps) {
    const { errors } = usePage().props as { errors: Record<string, string> };
    const [values, setValues] = useState({
        jira_key: feature.jira_key || '',
        name: feature.name || '',
        description: feature.description || '',
        requester_id: feature.requester_id ? String(feature.requester_id) : '',
        project_id: feature.project_id ? String(feature.project_id) : '',
        status: statusOptions.find((option) => option.current)?.value || '',
    });

    // Breadcrumbs definieren
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Startseite', href: '/' },
        { title: 'Features', href: route('features.index') },
        ...(feature.project ? [{ title: feature.project.name, href: route('projects.show', feature.project.id) }] : []),
        { title: `${feature.name} bearbeiten`, href: '#' },
    ];

    // TipTap Editor initialisieren
    const editor = useEditor({
        extensions: [
            StarterKit,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: values.description,
        onUpdate: ({ editor }) => {
            setValues((prev) => ({ ...prev, description: editor.getHTML() }));
        },
    });

    const addToolbar = () => {
        if (!editor) return null;

        return (
            <div className="flex flex-wrap gap-1 border-b bg-muted p-2">
                {/* Textformatierungen */}
                <div className="mr-2 flex gap-1 border-r pr-2">
                    <Button
                        type="button"
                        size="sm"
                        variant={editor.isActive('bold') ? 'default' : 'outline'}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        title="Fett"
                    >
                        <span className="font-bold">B</span>
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={editor.isActive('italic') ? 'default' : 'outline'}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        title="Kursiv"
                    >
                        <span className="italic">I</span>
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={editor.isActive('strike') ? 'default' : 'outline'}
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        title="Durchgestrichen"
                    >
                        <span className="line-through">S</span>
                    </Button>
                </div>

                {/* Überschriften */}
                <div className="mr-2 flex gap-1 border-r pr-2">
                    <Button
                        type="button"
                        size="sm"
                        variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'outline'}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        title="Überschrift 1"
                    >
                        H1
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        title="Überschrift 2"
                    >
                        H2
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'outline'}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        title="Überschrift 3"
                    >
                        H3
                    </Button>
                </div>

                {/* Listen */}
                <div className="mr-2 flex gap-1 border-r pr-2">
                    <Button
                        type="button"
                        size="sm"
                        variant={editor.isActive('bulletList') ? 'default' : 'outline'}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        title="Aufzählungsliste"
                    >
                        • Liste
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={editor.isActive('orderedList') ? 'default' : 'outline'}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        title="Nummerierte Liste"
                    >
                        1. Liste
                    </Button>
                </div>

                {/* Zitate und Code */}
                <div className="flex gap-1">
                    <Button
                        type="button"
                        size="sm"
                        variant={editor.isActive('blockquote') ? 'default' : 'outline'}
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        title="Zitat"
                    >
                        "
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={editor.isActive('codeBlock') ? 'default' : 'outline'}
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        title="Code-Block"
                    >
                        &lt;/&gt;
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        title="Horizontale Linie einfügen"
                    >
                        ―
                    </Button>
                </div>
            </div>
        );
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (field: string, value: string) => {
        setValues({ ...values, [field]: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        Inertia.put(route('features.update', feature.id), values);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Card className="mt-8 w-full">
                <CardHeader>
                    <CardTitle>Feature bearbeiten</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Action buttons at top */}
                        <div className="flex justify-end gap-2 border-b pb-4">
                            <Button type="button" variant="cancel" onClick={() => window.history.back()}>
                                <X />
                                Abbrechen
                            </Button>
                            <Button type="submit" variant="success">
                                <Save />
                                Änderungen speichern
                            </Button>
                        </div>

                        {/* Two-column layout: 60% left, 30% right */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[60%_1fr]">
                            {/* Left Column - Main Form Fields */}
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="jira_key">Jira Key</Label>
                                        <Input
                                            id="jira_key"
                                            name="jira_key"
                                            value={values.jira_key}
                                            onChange={handleChange}
                                            className="w-full"
                                            required
                                        />
                                        {errors.jira_key && <p className="mt-1 text-sm text-red-600">{errors.jira_key}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="name">Name</Label>
                                        <Input id="name" name="name" value={values.name} onChange={handleChange} className="w-full" required />
                                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="description">Beschreibung</Label>
                                    <div className="overflow-hidden rounded border">
                                        {addToolbar()}
                                        <EditorContent editor={editor} className="min-h-[120px] bg-white p-2" />
                                    </div>
                                    {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="project_id">Projekt</Label>
                                        <Select value={values.project_id} onValueChange={(value) => handleSelectChange('project_id', value)}>
                                            <SelectTrigger id="project_id" className="w-full">
                                                <SelectValue placeholder="Projekt wählen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {projects.map((project) => (
                                                    <SelectItem key={project.id} value={project.id.toString()}>
                                                        {project.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.project_id && <p className="mt-1 text-sm text-red-600">{errors.project_id}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="requester_id">Anforderer (optional)</Label>
                                        <Select
                                            value={values.requester_id || 'none'}
                                            onValueChange={(value) => handleSelectChange('requester_id', value === 'none' ? '' : value)}
                                        >
                                            <SelectTrigger id="requester_id" className="w-full">
                                                <SelectValue placeholder="Anforderer wählen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">-</SelectItem>
                                                {users.map((user) => (
                                                    <SelectItem key={user.id} value={user.id.toString()}>
                                                        {user.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.requester_id && <p className="mt-1 text-sm text-red-600">{errors.requester_id}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Workflow and Dependencies */}
                            <div className="space-y-6">
                                {/* Status-Auswahl (Workflow) */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Status</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div>
                                            <Label htmlFor="status">Status</Label>
                                            <Select value={values.status} onValueChange={(value) => handleSelectChange('status', value)}>
                                                <SelectTrigger id="status" className="w-full">
                                                    <SelectValue placeholder="Status wählen" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {statusOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            <div className="flex items-center">
                                                                <span
                                                                    className={`mr-2 inline-block h-3 w-3 rounded-full ${option.color.replace('bg-', 'bg-').replace('text-', '')}`}
                                                                ></span>
                                                                {option.label}
                                                                {option.current && <span className="ml-2 text-xs text-muted-foreground">(aktuell)</span>}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}

                                            {values.status && statusOptions.find((option) => option.value === values.status) && (
                                                <div className="mt-2 flex items-center">
                                                    <span className="mr-2 text-sm">Neuer Status:</span>
                                                    <span
                                                        className={`inline-block rounded-md px-2 py-1 text-xs ${statusOptions.find((option) => option.value === values.status)?.color}`}
                                                    >
                                                        {statusOptions.find((option) => option.value === values.status)?.label}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Abhängigkeiten */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Abhängigkeiten</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <DependencyManager featureId={feature.id} options={featureOptions} initialItems={dependencies} />
                                    </CardContent>
                                </Card>

                                {/* Kommentare */}
                                <Comments
                                    entity={{
                                        type: 'App\\Models\\Feature',
                                        id: feature.id,
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t pt-4">
                            <Button type="button" variant="cancel" onClick={() => window.history.back()}>
                                <X />
                                Abbrechen
                            </Button>
                            <Button type="submit" variant="success">
                                <Save />
                                Änderungen speichern
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}

function DependencyManager({
    featureId,
    options,
    initialItems,
}: {
    featureId: number;
    options: { id: number; jira_key: string; name: string }[];
    initialItems: DependencyItem[];
}) {
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
