import InputError from '@/components/input-error';
import MarkdownEditor from '@/components/markdown-editor';
import { SkillRequirementsPicker } from '@/components/skill-requirements-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { useForm, router } from '@inertiajs/react';
import axios from 'axios';
import { LoaderCircle, Save, Sparkles, X } from 'lucide-react';
import React, { useState } from 'react';

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
        type: 'business',
        requester_id: '',
        project_id: '',
        skill_requirements: [] as SkillRequirement[],
    });

    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');

    async function generateWithAi() {
        if (!data.project_id || !data.name) return;
        setAiLoading(true);
        setAiError('');
        try {
            const res = await axios.post('/api/ai/generate-description', {
                feature_name: data.name,
                project_id: parseInt(data.project_id),
                existing_description: data.description,
            });
            setData('description', res.data.description);
        } catch (e: any) {
            setAiError(e.response?.data?.error ?? 'AI generation failed');
        } finally {
            setAiLoading(false);
        }
    }

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

    const breadcrumbs = [
        { title: 'Startseite', href: '/' },
        { title: 'Features', href: route('features.index') },
        { title: 'Neues Feature', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Card className="mt-8 w-full">
                <CardHeader>
                    <CardTitle>Neues Feature anlegen</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                <Label htmlFor="jira_key">Feature-Key</Label>
                                <Input id="jira_key" name="jira_key" value={data.jira_key} onChange={handleChange} className="w-full" required />
                                <InputError message={errors.jira_key} className="mt-1" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" name="name" value={data.name} onChange={handleChange} className="w-full" required />
                                <InputError message={errors.name} className="mt-1" />
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

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <Label htmlFor="type">Typ</Label>
                                <Select value={data.type} onValueChange={(value) => handleSelectChange('type', value)}>
                                    <SelectTrigger id="type" className="w-full">
                                        <SelectValue placeholder="Typ wählen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="business">Business</SelectItem>
                                        <SelectItem value="enabler">Enabler</SelectItem>
                                        <SelectItem value="tech_debt">Tech Debt</SelectItem>
                                        <SelectItem value="nfr">NFR</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.type} className="mt-1" />
                            </div>
                        </div>

                        <div>
                            <div className="mb-1 flex items-center justify-between">
                                <Label htmlFor="description">Beschreibung</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={generateWithAi}
                                    disabled={aiLoading || !data.project_id || !data.name}
                                    title={!data.project_id || !data.name ? 'Projekt und Name erforderlich' : 'Beschreibung mit KI generieren'}
                                >
                                    {aiLoading ? <LoaderCircle className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1 h-3.5 w-3.5" />}
                                    KI generieren
                                </Button>
                            </div>
                            {aiError && <p className="mb-1 text-sm text-red-500">{aiError}</p>}
                            <MarkdownEditor
                                value={data.description}
                                onChange={(md) => setData('description', md)}
                                placeholder="Feature-Beschreibung …"
                            />
                            <InputError message={errors.description} className="mt-1" />
                        </div>

                        {/* Skill Requirements */}
                        <SkillRequirementsPicker
                            skills={skills}
                            requirements={data.skill_requirements}
                            onToggle={toggleSkillRequirement}
                            onLevelChange={setSkillLevel}
                        />

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="cancel" onClick={() => router.visit(route('features.index'))}>
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
