import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { LoaderCircle, X } from 'lucide-react';
import React from 'react';

interface Project {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface CreateProps {
    projects: Project[];
    users: User[];
}

export default function Create({ projects, users }: CreateProps) {
    const { data, setData, post, processing, errors, transform } = useForm({
        project_id: '',
        title: '',
        description: '',
        vision: '',
        planned_at: '',
        executed_at: '',
        owner_id: '',
        deputy_id: '',
        stakeholder_ids: [] as string[],
    });

    // Breadcrumbs definieren
    const breadcrumbs = [
        { title: 'Startseite', href: '/' },
        { title: 'Plannings', href: route('plannings.index') },
        { title: 'Neues Planning', href: '#' },
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setData(e.target.name as 'title' | 'description' | 'vision' | 'planned_at' | 'executed_at', e.target.value);
    };

    const handleSelectChange = (field: 'project_id' | 'owner_id' | 'deputy_id', value: string) => {
        setData(field, value);
    };

    const handleStakeholderChange = (id: string) => {
        const newIds = data.stakeholder_ids.includes(id)
            ? data.stakeholder_ids.filter((sid) => sid !== id)
            : [...data.stakeholder_ids, id];
        setData('stakeholder_ids', newIds);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((d) => ({
            ...d,
            deputy_id: d.deputy_id === 'none' ? null : d.deputy_id,
            stakeholder_ids: d.stakeholder_ids ?? [],
        }));
        post(route('plannings.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Card className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <CardHeader>
                    <CardTitle>Neues Planning erstellen</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Tabs defaultValue="stammdaten" className="space-y-4">
                            <TabsList>
                                <TabsTrigger value="stammdaten">Stammdaten</TabsTrigger>
                                <TabsTrigger value="stakeholder">Stakeholder</TabsTrigger>
                            </TabsList>

                            <TabsContent value="stammdaten" className="space-y-4">
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
