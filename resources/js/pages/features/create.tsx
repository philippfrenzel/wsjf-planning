import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Inertia } from '@inertiajs/inertia';
import { usePage } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import React, { useState } from 'react';
// TipTap Imports statt ReactQuill
import TextAlign from '@tiptap/extension-text-align';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface Project {
    id: number;
    name: string;
}
interface User {
    id: number;
    name: string;
}
interface CreateProps {
    projects: Project[];
    users: User[];
}

export default function Create({ projects, users }: CreateProps) {
    const { errors } = usePage().props as { errors: Record<string, string> };
    const [values, setValues] = useState({
        jira_key: '',
        name: '',
        description: '',
        requester_id: '',
        project_id: '',
    });

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
            <div className="bg-muted flex flex-wrap gap-1 border-b p-2">
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
        Inertia.post(route('features.store'), values);
    };

    return (
        <AppLayout>
            <Card className="mt-8 w-full">
                <CardHeader>
                    <CardTitle>Neues Feature anlegen</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <Label htmlFor="jira_key">Jira Key</Label>
                                <Input id="jira_key" name="jira_key" value={values.jira_key} onChange={handleChange} className="w-full" required />
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
                                <EditorContent editor={editor} className="min-h-[120px] bg-white" />
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

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="cancel" onClick={() => window.history.back()}>
                                <X />
                                Abbrechen
                            </Button>
                            <Button type="submit" variant="success">
                                <Save />
                                Feature speichern
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
