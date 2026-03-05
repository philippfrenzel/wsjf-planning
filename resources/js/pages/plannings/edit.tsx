import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { WorkflowStateBadge } from '@/components/workflow-state-badge';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { LoaderCircle, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface Project {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Feature {
    id: number;
    jira_key: string;
    name: string;
    project_id: number;
    status_details?: {
        value: string;
        name: string;
        color: string;
    };
}

interface Planning {
    id: number;
    project_id: number;
    title: string;
    description: string;
    vision?: string | null;
    planned_at?: string;
    executed_at?: string;
    stakeholders: User[];
    features?: Feature[];
    owner_id?: number;
    deputy_id?: number;
    owner?: User;
    deputy?: User;
    status_details?: {
        value: string;
        name: string;
        color: string;
    };
}

interface EditProps {
    planning: Planning;
    projects: Project[];
    users: User[];
    features: Feature[]; // Features aus dem gleichen Projekt
}

const closedFeatureStatuses = ['rejected', 'implemented', 'obsolete'];

const formatDateForInput = (dateString?: string) => {
    if (!dateString) {
        return '';
    }

    const [datePart] = dateString.split(/[T ]/);
    return datePart ?? '';
};

export default function Edit({
    planning,
    projects,
    users,
    features = [], // Standardwert als leeres Array
}: EditProps) {
    const { data, setData, put, processing, errors, transform } = useForm({
        project_id: planning.project_id ? String(planning.project_id) : '',
        title: planning.title || '',
        description: planning.description || '',
        vision: planning.vision || '',
        planned_at: formatDateForInput(planning.planned_at),
        executed_at: formatDateForInput(planning.executed_at),
        owner_id: planning.owner_id ? String(planning.owner_id) : '',
        deputy_id: planning.deputy_id ? String(planning.deputy_id) : '',
        status: planning.status_details?.value ?? 'in-planning',
        stakeholder_ids: planning.stakeholders ? planning.stakeholders.map((u) => String(u.id)) : [],
        feature_ids: planning.features
            ? planning.features.filter((f) => !closedFeatureStatuses.includes(f.status_details?.value ?? '')).map((f) => String(f.id))
            : [],
    });

    const [featureStatusFilter, setFeatureStatusFilter] = useState<string>('');

    const availableFeatures = useMemo(() => features.filter((f) => !closedFeatureStatuses.includes(f.status_details?.value ?? '')), [features]);

    const featureStatusOptions = useMemo(() => {
        const map = new Map<string, string>();
        availableFeatures.forEach((f) => {
            if (f.status_details) {
                map.set(f.status_details.value, f.status_details.name);
            }
        });
        return Array.from(map.entries()).map(([value, name]) => ({ value, name }));
    }, [availableFeatures]);

    const planningStatusOptions = useMemo(
        () => [
            { value: 'in-planning', label: 'In Planung' },
            { value: 'in-execution', label: 'In Durchführung' },
            { value: 'completed', label: 'Abgeschlossen' },
        ],
        [],
    );

    const filteredFeatures = useMemo(
        () => availableFeatures.filter((f) => featureStatusFilter === '' || f.status_details?.value === featureStatusFilter),
        [availableFeatures, featureStatusFilter],
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setData(e.target.name as 'title' | 'description' | 'vision' | 'planned_at' | 'executed_at', e.target.value);
    };

    const handleSelectChange = (field: 'project_id' | 'owner_id' | 'deputy_id' | 'status', value: string) => {
        setData(field, value);
    };

    const handleStakeholderChange = (id: string) => {
        const newIds = data.stakeholder_ids.includes(id)
            ? data.stakeholder_ids.filter((sid) => sid !== id)
            : [...data.stakeholder_ids, id];
        setData('stakeholder_ids', newIds);
    };

    const handleFeatureChange = (id: string) => {
        const newIds = data.feature_ids.includes(id)
            ? data.feature_ids.filter((fid) => fid !== id)
            : [...data.feature_ids, id];
        setData('feature_ids', newIds);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((d) => ({
            ...d,
            deputy_id: d.deputy_id === 'none' ? null : d.deputy_id,
        }));
        put(route('plannings.update', planning.id));
    };

    return (
        <AppLayout>
            <Card className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <CardHeader>
                    <CardTitle>Planning bearbeiten</CardTitle>
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
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                Speichern
                            </Button>
                        </div>

                        <Tabs defaultValue="stammdaten" className="space-y-4">
                            <TabsList>
                                <TabsTrigger value="stammdaten">Stammdaten</TabsTrigger>
                                <TabsTrigger value="stakeholder">Stakeholder</TabsTrigger>
                                <TabsTrigger value="features">Features</TabsTrigger>
                            </TabsList>

                            <TabsContent value="stammdaten" className="space-y-4">
                                <div>
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={data.status} onValueChange={(value) => handleSelectChange('status', value)}>
                                        <SelectTrigger id="status">
                                            <SelectValue placeholder="Status wählen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {planningStatusOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.status && <InputError message={errors.status} className="mt-1" />}
                                </div>

                                <div>
                                    <Label htmlFor="project_id">Projekt</Label>
                                    <Select value={data.project_id} onValueChange={(value) => handleSelectChange('project_id', value)}>
                                        <SelectTrigger id="project_id">
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
                                    {errors.project_id && <InputError message={errors.project_id} className="mt-1" />}
                                </div>

                                <div>
                                    <Label htmlFor="title">Titel</Label>
                                    <Input id="title" name="title" value={data.title} onChange={handleChange} required />
                                    {errors.title && <InputError message={errors.title} className="mt-1" />}
                                </div>

                                <div>
                                    <Label htmlFor="description">Beschreibung</Label>
                                    <Textarea id="description" name="description" value={data.description} onChange={handleChange} />
                                    {errors.description && <InputError message={errors.description} className="mt-1" />}
                                </div>

                                <div>
                                    <Label htmlFor="vision">PI Vision</Label>
                                    <Textarea id="vision" name="vision" value={data.vision} onChange={handleChange} placeholder="Outcome-orientierte Vision für dieses PI" rows={3} />
                                    {errors.vision && <InputError message={errors.vision} className="mt-1" />}
                                </div>

                                <div>
                                    <Label htmlFor="owner_id">Hauptverantwortlicher</Label>
                                    <Select value={data.owner_id} onValueChange={(value) => handleSelectChange('owner_id', value)}>
                                        <SelectTrigger id="owner_id">
                                            <SelectValue placeholder="Hauptverantwortlichen wählen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((user) => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.owner_id && <InputError message={errors.owner_id} className="mt-1" />}
                                </div>

                                <div>
                                    <Label htmlFor="deputy_id">Stellvertreter</Label>
                                    <Select value={data.deputy_id} onValueChange={(value) => handleSelectChange('deputy_id', value)}>
                                        <SelectTrigger id="deputy_id">
                                            <SelectValue placeholder="Stellvertreter wählen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Keinen Stellvertreter</SelectItem>
                                            {users.map((user) => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.deputy_id && <InputError message={errors.deputy_id} className="mt-1" />}
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="planned_at">Geplant am</Label>
                                        <Input id="planned_at" name="planned_at" type="date" value={data.planned_at} onChange={handleChange} />
                                        {errors.planned_at && <InputError message={errors.planned_at} className="mt-1" />}
                                    </div>
                                    <div>
                                        <Label htmlFor="executed_at">Durchgeführt am</Label>
                                        <Input id="executed_at" name="executed_at" type="date" value={data.executed_at} onChange={handleChange} />
                                        {errors.executed_at && <InputError message={errors.executed_at} className="mt-1" />}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="stakeholder" className="space-y-4">
                                <div>
                                    <Label>Stakeholder</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {users.length === 0 && <span className="text-muted-foreground text-sm">Keine Benutzer vorhanden.</span>}
                                        {users.length > 0 && (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-24">Auswählen</TableHead>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>E-Mail</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {users.map((user) => (
                                                        <TableRow key={user.id}>
                                                            <TableCell className="text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    className="h-4 w-4"
                                                                    checked={data.stakeholder_ids.includes(user.id.toString())}
                                                                    onChange={() => handleStakeholderChange(user.id.toString())}
                                                                />
                                                            </TableCell>
                                                            <TableCell>{user.name}</TableCell>
                                                            <TableCell>{user.email}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </div>
                                    {errors.stakeholder_ids && <InputError message={errors.stakeholder_ids} className="mt-1" />}
                                </div>
                            </TabsContent>

                            <TabsContent value="features" className="space-y-4">
                                <div>
                                    <Label>Features aus dem gleichen Projekt</Label>
                                    {features.length > 0 && (
                                        <div className="my-2">
                                            <Select
                                                value={featureStatusFilter}
                                                onValueChange={(value) => setFeatureStatusFilter(value === 'all' ? '' : value)}
                                            >
                                                <SelectTrigger className="w-[200px]">
                                                    <SelectValue placeholder="Status filtern" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Alle Status</SelectItem>
                                                    {featureStatusOptions.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        {availableFeatures.length === 0 && (
                                            <span className="text-muted-foreground text-sm">Keine Features im Projekt vorhanden.</span>
                                        )}
                                        {availableFeatures.length > 0 && (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-24">Auswählen</TableHead>
                                                        <TableHead>Jira Key</TableHead>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Status</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredFeatures.map((feature) => (
                                                        <TableRow key={feature.id}>
                                                            <TableCell className="text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    className="h-4 w-4"
                                                                    checked={data.feature_ids.includes(feature.id.toString())}
                                                                    onChange={() => handleFeatureChange(feature.id.toString())}
                                                                />
                                                            </TableCell>
                                                            <TableCell>{feature.jira_key}</TableCell>
                                                            <TableCell>{feature.name}</TableCell>
                                                            <TableCell>
                                                                <WorkflowStateBadge statusDetails={feature.status_details} />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </div>
                                    {errors.feature_ids && <InputError message={errors.feature_ids} className="mt-1" />}
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="cancel" onClick={() => window.history.back()}>
                                <X />
                                Abbrechen
                            </Button>
                            <Button type="submit" variant="success" disabled={processing}>
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                Speichern
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
