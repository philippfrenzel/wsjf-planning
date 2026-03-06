import InputError from '@/components/input-error';
import { SkillRequirementsPicker } from '@/components/skill-requirements-picker';
import type { SkillOption, SkillRequirement } from '@/components/skill-requirements-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { ClipboardList, FileText, LoaderCircle, Save, X, Zap } from 'lucide-react';
import React from 'react';

interface User {
    id: number;
    name: string;
}

interface Project {
    id: number;
    project_number: string;
    name: string;
    description: string;
    jira_base_uri: string;
    start_date: string;
    end_date: string;
    status: string;
    project_leader_id: string;
    deputy_leader_id: string;
    teams?: { id: number; name: string }[];
    required_skills?: { id: number; name: string; category: string | null; pivot: { level: string } }[];
    definition_templates?: { id: number; type: string; title: string }[];
}

interface StatusOption {
    value: string;
    label: string;
    color: string;
    current: boolean;
}

interface CurrentStatus {
    name: string;
    color: string;
}

interface TeamOption {
    id: number;
    name: string;
}

interface TemplateOption {
    id: number;
    type: 'dor' | 'dod' | 'ust';
    title: string;
}

const TEMPLATE_TYPE_LABELS: Record<string, string> = {
    dor: 'Definition of Ready (DoR)',
    dod: 'Definition of Done (DoD)',
    ust: 'User Story Template',
};

interface EditProps {
    project: Project;
    users: User[];
    teams: TeamOption[];
    skills: SkillOption[];
    currentStatus: CurrentStatus;
    statusOptions: StatusOption[];
    definitionTemplates: TemplateOption[];
}

export default function Edit({ project, users, teams, skills, currentStatus, statusOptions, definitionTemplates }: EditProps) {
    // Breadcrumbs definieren
    const breadcrumbs = [
        { title: 'Startseite', href: '/' },
        { title: 'Projekte', href: route('projects.index') },
        { title: project.name, href: route('projects.show', project.id) },
        { title: 'Bearbeiten', href: '#' },
    ];

    const { data, setData, put, processing, errors } = useForm({
        project_number: project.project_number || '',
        name: project.name || '',
        description: project.description || '',
        jira_base_uri: project.jira_base_uri || '',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        project_leader_id: project.project_leader_id ? String(project.project_leader_id) : '',
        deputy_leader_id: project.deputy_leader_id ? String(project.deputy_leader_id) : '',
        new_status: '',
        team_ids: (project.teams || []).map((t) => String(t.id)),
        skill_requirements: (project.required_skills || []).map((s) => ({
            skill_id: s.id,
            level: s.pivot.level,
        })) as SkillRequirement[],
        definition_template_ids: (project.definition_templates || []).map((t) => t.id),
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setData(e.target.name as keyof typeof data, e.target.value);
    };

    const handleSelectChange = (field: string, value: string) => {
        setData(field as keyof typeof data, value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('projects.update', project.id));
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
                    <CardTitle>Projekt bearbeiten</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Action buttons at top */}
                        <div className="flex justify-end gap-2 border-b pb-4">
                            <Button type="button" variant="cancel" onClick={() => window.history.back()}>
                                <X />
                                Abbrechen
                            </Button>
                            <Button type="submit" variant="success" disabled={processing}>
                                {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save />}
                                Speichern
                            </Button>
                        </div>

                        <Tabs defaultValue="stammdaten">
                            <TabsList>
                                <TabsTrigger value="stammdaten" className="gap-1.5">
                                    <ClipboardList className="h-4 w-4" />
                                    Stammdaten
                                </TabsTrigger>
                                <TabsTrigger value="skills" className="gap-1.5">
                                    <Zap className="h-4 w-4" />
                                    Skills
                                    {data.skill_requirements.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                                            {data.skill_requirements.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="templates" className="gap-1.5">
                                    <FileText className="h-4 w-4" />
                                    Templates
                                    {data.definition_template_ids.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                                            {data.definition_template_ids.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="stammdaten" className="mt-4">
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
                                        <div>
                                            <Label htmlFor="currentStatus">Aktueller Status</Label>
                                            <div
                                                className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ${currentStatus.color} mt-1`}
                                            >
                                                {currentStatus.name}
                                            </div>
                                            {statusOptions.length > 1 && (
                                                <div className="mt-4">
                                                    <Label htmlFor="new_status">Status ändern zu</Label>
                                                    <Select value={data.new_status} onValueChange={(value) => handleSelectChange('new_status', value)}>
                                                        <SelectTrigger id="new_status">
                                                            <SelectValue placeholder="Neuen Status wählen" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {statusOptions
                                                                .filter((option) => !option.current)
                                                                .map((option) => (
                                                                    <SelectItem key={option.value} value={option.value}>
                                                                        <div className="flex items-center">
                                                                            <span
                                                                                className={`mr-2 inline-block h-2 w-2 rounded-full ${option.color.replace('text-', 'bg-')}`}
                                                                            ></span>
                                                                            {option.label}
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <InputError message={errors.new_status} className="mt-1" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="skills" className="mt-4">
                                <SkillRequirementsPicker
                                    skills={skills}
                                    requirements={data.skill_requirements}
                                    onToggle={toggleSkillRequirement}
                                    onLevelChange={setSkillLevel}
                                />
                            </TabsContent>

                            <TabsContent value="templates" className="mt-4">
                                {definitionTemplates.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Keine aktiven Templates vorhanden. Bitte erstellen Sie Templates unter &quot;Templates&quot;.</p>
                                ) : (
                                    <div className="space-y-6">
                                        {(['dor', 'dod', 'ust'] as const).map((type) => {
                                            const items = definitionTemplates.filter((t) => t.type === type);
                                            if (items.length === 0) return null;
                                            return (
                                                <div key={type}>
                                                    <Label className="text-sm font-semibold">{TEMPLATE_TYPE_LABELS[type]}</Label>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {items.map((t) => {
                                                            const selected = data.definition_template_ids.includes(t.id);
                                                            return (
                                                                <button
                                                                    key={t.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setData('definition_template_ids',
                                                                            selected
                                                                                ? data.definition_template_ids.filter((id) => id !== t.id)
                                                                                : [...data.definition_template_ids, t.id]
                                                                        );
                                                                    }}
                                                                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                                                        selected
                                                                            ? 'border-primary bg-primary text-primary-foreground'
                                                                            : 'border-input bg-background hover:bg-accent'
                                                                    }`}
                                                                >
                                                                    {t.title}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <p className="text-xs text-muted-foreground">
                                            Wählen Sie die Templates, die für dieses Projekt gelten sollen (DoR, DoD, User Story).
                                        </p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>

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
