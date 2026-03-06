import InputError from '@/components/input-error';
import MarkdownEditor from '@/components/markdown-editor';
import { SkillRequirementsPicker } from '@/components/skill-requirements-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { LoaderCircle, Save, X } from 'lucide-react';
import React from 'react';

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

                        <div>
                            <Label htmlFor="description">Beschreibung</Label>
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
