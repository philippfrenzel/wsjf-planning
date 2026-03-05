import InputError from '@/components/input-error';
import { SkillRequirementsPicker } from '@/components/skill-requirements-picker';
import type { SkillOption, SkillRequirement } from '@/components/skill-requirements-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { LoaderCircle, Save, X } from 'lucide-react';
import React from 'react';

interface User {
    id: number;
    name: string;
}

interface TeamOption {
    id: number;
    name: string;
}

interface CreateProps {
    users: User[];
    teams: TeamOption[];
    skills: SkillOption[];
}

export default function Create({ users, teams, skills }: CreateProps) {
    // Breadcrumbs definieren
    const breadcrumbs = [
        { title: 'Startseite', href: '/' },
        { title: 'Projekte', href: route('projects.index') },
        { title: 'Neues Projekt', href: '#' },
    ];

    const { data, setData, post, processing, errors } = useForm({
        project_number: '',
        name: '',
        description: '',
        jira_base_uri: '',
        start_date: '',
        end_date: '',
        project_leader_id: '',
        deputy_leader_id: '',
        team_ids: [] as string[],
        skill_requirements: [] as SkillRequirement[],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setData(e.target.name as keyof typeof data, e.target.value);
    };

    const handleSelectChange = (field: string, value: string) => {
        setData(field as keyof typeof data, value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('projects.store'));
    };

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Card className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <CardHeader>
                    <CardTitle>Neues Projekt erstellen</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="project_number">Projektnummer</Label>
                                    <Input id="project_number" name="project_number" value={data.project_number} onChange={handleChange} required />
                                    <InputError message={errors.project_number} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" name="name" value={data.name} onChange={handleChange} required />
                                    <InputError message={errors.name} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="description">Beschreibung</Label>
                                    <Textarea id="description" name="description" value={data.description} onChange={handleChange} />
                                    <InputError message={errors.description} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="jira_base_uri">JIRA Base URI</Label>
                                    <Input
                                        id="jira_base_uri"
                                        name="jira_base_uri"
                                        value={data.jira_base_uri}
                                        onChange={handleChange}
                                        placeholder="https://your-company.atlassian.net/browse/"
                                    />
                                    <InputError message={errors.jira_base_uri} className="mt-1" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="project_leader_id">Projektleiter</Label>
                                    <Select
                                        value={data.project_leader_id}
                                        onValueChange={(value) => handleSelectChange('project_leader_id', value)}
                                    >
                                        <SelectTrigger id="project_leader_id">
                                            <SelectValue placeholder="Projektleiter wählen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((user) => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.project_leader_id} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="deputy_leader_id">Stellvertretung Projektleiter</Label>
                                    <Select value={data.deputy_leader_id} onValueChange={(value) => handleSelectChange('deputy_leader_id', value)}>
                                        <SelectTrigger id="deputy_leader_id">
                                            <SelectValue placeholder="Stellvertretung wählen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((user) => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.deputy_leader_id} className="mt-1" />
                                </div>
                                {teams.length > 0 && (
                                    <div>
                                        <Label>Teams</Label>
                                        <div className="mt-1 flex flex-wrap gap-3">
                                            {teams.map((team) => (
                                                <label key={team.id} className="flex items-center gap-1.5 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-300"
                                                        checked={data.team_ids.includes(team.id.toString())}
                                                        onChange={() => {
                                                            const id = team.id.toString();
                                                            setData('team_ids', data.team_ids.includes(id)
                                                                ? data.team_ids.filter((t) => t !== id)
                                                                : [...data.team_ids, id]);
                                                        }}
                                                    />
                                                    {team.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <Label htmlFor="start_date">Startdatum</Label>
                                    <Input id="start_date" name="start_date" type="date" value={data.start_date} onChange={handleChange} />
                                    <InputError message={errors.start_date} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="end_date">Enddatum</Label>
                                    <Input id="end_date" name="end_date" type="date" value={data.end_date} onChange={handleChange} />
                                    <InputError message={errors.end_date} className="mt-1" />
                                </div>
                            </div>
                        </div>

                        {/* Skill Requirements */}
                        <SkillRequirementsPicker
                            skills={skills}
                            requirements={data.skill_requirements}
                            onToggle={toggleSkillRequirement}
                            onLevelChange={setSkillLevel}
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="cancel" onClick={() => window.history.back()}>
                                <X />
                                Abbrechen
                            </Button>
                            <Button type="submit" variant="success" disabled={processing}>
                                {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save />}
                                Speichern
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
