import InputError from '@/components/input-error';
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

interface EditProps {
    project: Project;
    users: User[];
    teams: TeamOption[];
    currentStatus: CurrentStatus;
    statusOptions: StatusOption[];
}

export default function Edit({ project, users, teams, currentStatus, statusOptions }: EditProps) {
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
