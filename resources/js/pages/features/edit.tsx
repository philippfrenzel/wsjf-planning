import { Comments } from '@/components/comments';
import InputError from '@/components/input-error';
import MarkdownEditor from '@/components/markdown-editor';
import { SkillRequirementsPicker } from '@/components/skill-requirements-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowStateBadge } from '@/components/workflow-state-badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useForm, router } from '@inertiajs/react';
import { LoaderCircle, MessageSquareText, Save, X } from 'lucide-react';
import React, { useState } from 'react';

import AiChatPanel from '@/components/ai-chat-panel';
import DependenciesSection from './components/DependenciesSection';
import WorkflowManager from './components/WorkflowManager';

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
    type?: string;
    project?: {
        id: number;
        name: string;
    };
    status?: {
        name: string;
        color: string;
    };
    dependencies?: DependencyItem[];
    required_skills?: { id: number; name: string; category: string | null; pivot: { level: string } }[];
}
interface StatusOption {
    value: string;
    label: string;
    color: string;
    current: boolean;
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

interface EditProps {
    feature: Feature;
    projects: Project[];
    users: User[];
    skills: SkillOption[];
    statusOptions: StatusOption[];
    featureOptions?: { id: number; jira_key: string; name: string }[];
    dependencies?: DependencyItem[];
}

export default function Edit({ feature, projects, users, skills, statusOptions, featureOptions = [], dependencies = [] }: EditProps) {
    const { data, setData, put, processing, errors, isDirty } = useForm({
        jira_key: feature.jira_key || '',
        name: feature.name || '',
        description: feature.description || '',
        requester_id: feature.requester_id ? String(feature.requester_id) : '',
        project_id: feature.project_id ? String(feature.project_id) : '',
        type: feature.type || 'business',
        skill_requirements: (feature.required_skills || []).map((s) => ({
            skill_id: s.id,
            level: s.pivot.level,
        })) as SkillRequirement[],
    });

    const [chatOpen, setChatOpen] = useState(false);

    const currentStatusOption = statusOptions.find((o) => o.current);
    const currentStatusDetails = currentStatusOption
        ? { value: currentStatusOption.value, name: currentStatusOption.label, color: currentStatusOption.color }
        : null;

    React.useEffect(() => {
        const removeListener = router.on('before', (event) => {
            if (isDirty && !confirm('Sie haben ungespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?')) {
                event.preventDefault();
            }
        });
        return () => removeListener();
    }, [isDirty]);

    // Breadcrumbs definieren
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Startseite', href: '/' },
        { title: 'Features', href: route('features.index') },
        ...(feature.project ? [{ title: feature.project.name, href: route('projects.show', feature.project.id) }] : []),
        { title: `${feature.name} bearbeiten`, href: '#' },
    ];

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
        put(route('features.update', feature.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-5">
                <Card className="flex h-full flex-1 flex-col">
                    {/* Header — matches show.tsx */}
                    <div className="flex items-center justify-between gap-4 px-6 pt-6">
                        <div className="min-w-0 flex-1">
                            {feature.jira_key && (
                                <p className="text-muted-foreground mb-1 text-sm font-medium">{feature.jira_key}</p>
                            )}
                            <h1 className="text-2xl font-bold tracking-tight break-words">
                                {feature.name} <span className="text-muted-foreground font-normal">bearbeiten</span>
                            </h1>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                            {currentStatusDetails && (
                                <WorkflowStateBadge statusDetails={currentStatusDetails} />
                            )}
                            <Button type="button" variant="cancel" size="sm" onClick={() => router.visit(route('features.show', feature.id))}>
                                <X className="h-4 w-4" />
                                Abbrechen
                            </Button>
                            <Button type="submit" form="edit-feature-form" variant="success" size="sm" disabled={processing}>
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                <Save className="h-4 w-4" />
                                Speichern
                            </Button>
                        </div>
                    </div>

                    <CardContent>
                        <Tabs defaultValue="stammdaten" className="space-y-6">
                            <TabsList>
                                <TabsTrigger value="stammdaten">Stammdaten</TabsTrigger>
                                <TabsTrigger value="erweitert">Abhängigkeiten &amp; Skills</TabsTrigger>
                            </TabsList>

                            <TabsContent value="stammdaten" className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[60%_1fr]">
                                    {/* Left — form fields */}
                                    <form id="edit-feature-form" onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div>
                                                <Label htmlFor="project_id">Projekt <span className="text-destructive">*</span></Label>
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
                                                <Label htmlFor="jira_key">Feature-Key <span className="text-destructive">*</span></Label>
                                                <Input
                                                    id="jira_key"
                                                    name="jira_key"
                                                    value={data.jira_key}
                                                    onChange={handleChange}
                                                    className="w-full"
                                                    required
                                                />
                                                <InputError message={errors.jira_key} className="mt-1" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div>
                                                <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    value={data.name}
                                                    onChange={handleChange}
                                                    className="w-full"
                                                    required
                                                />
                                                <InputError message={errors.name} className="mt-1" />
                                            </div>
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

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                                            <div className="mb-1 flex items-center justify-between">
                                                <Label htmlFor="description">Beschreibung</Label>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setChatOpen(true)}
                                                    disabled={!data.project_id || !data.name}
                                                    title={!data.project_id || !data.name ? 'Projekt und Name erforderlich' : 'Beschreibung mit KI verfeinern'}
                                                >
                                                    <MessageSquareText className="mr-1 h-3.5 w-3.5" />
                                                    KI Assistent
                                                </Button>
                                            </div>
                                            <MarkdownEditor
                                                value={data.description}
                                                onChange={(md) => setData('description', md)}
                                                placeholder="Feature-Beschreibung …"
                                            />
                                            <InputError message={errors.description} className="mt-1" />
                                        </div>
                                    </form>

                                    {/* Right — Status + Comments */}
                                    <div className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Status</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <WorkflowManager
                                                    featureId={feature.id}
                                                    statusOptions={statusOptions}
                                                    currentStatus={statusOptions.find((option) => option.current)?.value || ''}
                                                />
                                            </CardContent>
                                        </Card>
                                        <Comments
                                            entity={{
                                                type: 'App\\Models\\Feature',
                                                id: feature.id,
                                            }}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="erweitert" className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[60%_1fr]">
                                    {/* Left — Dependencies + Skills */}
                                    <div className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Abhängigkeiten</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <DependenciesSection featureId={feature.id} featureOptions={featureOptions} dependencies={dependencies} />
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Benötigte Skills</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <SkillRequirementsPicker
                                                    skills={skills}
                                                    requirements={data.skill_requirements}
                                                    onToggle={toggleSkillRequirement}
                                                    onLevelChange={setSkillLevel}
                                                />
                                            </CardContent>
                                        </Card>
                                    </div>
                                    {/* Right — empty for now, keeps grid consistent */}
                                    <div />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            <AiChatPanel
                open={chatOpen}
                onOpenChange={setChatOpen}
                featureName={data.name}
                projectId={data.project_id}
                currentDescription={data.description}
                onApplyDescription={(md) => setData('description', md)}
            />
        </AppLayout>
    );
}
