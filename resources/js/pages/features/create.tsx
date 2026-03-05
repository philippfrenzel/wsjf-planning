import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { LoaderCircle, Save, X, Zap } from 'lucide-react';
import React from 'react';
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
interface SkillOption {
    id: number;
    name: string;
    category: string | null;
}
interface SkillRequirement {
    skill_id: number;
    level: string;
}
interface CreateProps {
    projects: Project[];
    users: User[];
    skills: SkillOption[];
}

export default function Create({ projects, users, skills }: CreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        jira_key: '',
        name: '',
        description: '',
        requester_id: '',
        project_id: '',
        skill_requirements: [] as SkillRequirement[],
    });

    // TipTap Editor initialisieren
    const editor = useEditor({
        extensions: [
            StarterKit,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: data.description,
        onUpdate: ({ editor }) => {
            setData('description', editor.getHTML());
        },
    });

    function toggleSkillRequirement(skillId: number) {
        const existing = data.skill_requirements.find((r) => r.skill_id === skillId);
        if (existing) {
            setData('skill_requirements', data.skill_requirements.filter((r) => r.skill_id !== skillId));
        } else {
            setData('skill_requirements', [...data.skill_requirements, { skill_id: skillId, level: 'basic' }]);
        }
    }

    function setSkillLevel(skillId: number, level: string) {
        setData('skill_requirements', data.skill_requirements.map((r) =>
            r.skill_id === skillId ? { ...r, level } : r
        ));
    }

    const LEVELS = [
        { value: 'basic', label: 'Grundkenntnisse' },
        { value: 'intermediate', label: 'Fortgeschritten' },
        { value: 'expert', label: 'Experte' },
    ];

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
        setData(e.target.name as keyof typeof data, e.target.value);
    };

    const handleSelectChange = (field: string, value: string) => {
        setData(field as keyof typeof data, value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('features.store'));
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
                                <Input id="jira_key" name="jira_key" value={data.jira_key} onChange={handleChange} className="w-full" required />
                                <InputError message={errors.jira_key} className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" name="name" value={data.name} onChange={handleChange} className="w-full" required />
                                <InputError message={errors.name} className="mt-1" />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description">Beschreibung</Label>
                            <div className="overflow-hidden rounded border">
                                {addToolbar()}
                                <EditorContent editor={editor} className="min-h-[120px] bg-white" />
                            </div>
                            <InputError message={errors.description} className="mt-1" />
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <Label htmlFor="project_id">Projekt</Label>
                                <Select value={data.project_id} onValueChange={(value) => handleSelectChange('project_id', value)}>
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
                                <InputError message={errors.project_id} className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="requester_id">Anforderer (optional)</Label>
                                <Select
                                    value={data.requester_id || 'none'}
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
                                <InputError message={errors.requester_id} className="mt-1" />
                            </div>
                        </div>

                        {/* Skill Requirements */}
                        {skills.length > 0 && (
                            <div className="rounded-md border p-4">
                                <Label className="mb-2 flex items-center gap-2 text-base font-semibold">
                                    <Zap className="h-4 w-4" /> Benötigte Skills
                                </Label>
                                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                                    {skills.map((skill) => {
                                        const req = data.skill_requirements.find((r) => r.skill_id === skill.id);
                                        return (
                                            <div key={skill.id} className="flex items-center gap-1.5">
                                                <Checkbox
                                                    checked={!!req}
                                                    onCheckedChange={() => toggleSkillRequirement(skill.id)}
                                                />
                                                <span className="text-sm">{skill.name}</span>
                                                {skill.category && (
                                                    <Badge variant="outline" className="px-1 text-[10px]">{skill.category}</Badge>
                                                )}
                                                {req && (
                                                    <Select value={req.level} onValueChange={(v) => setSkillLevel(skill.id, v)}>
                                                        <SelectTrigger className="h-6 w-[130px] text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {LEVELS.map((l) => (
                                                                <SelectItem key={l.value} value={l.value} className="text-xs">
                                                                    {l.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="cancel" onClick={() => window.history.back()}>
                                <X />
                                Abbrechen
                            </Button>
                            <Button type="submit" variant="success" disabled={processing}>
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
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
