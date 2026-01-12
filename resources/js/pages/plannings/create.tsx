import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Inertia } from '@inertiajs/inertia';
import { usePage } from '@inertiajs/react';
import React, { useState } from 'react';

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
        project_id: '',
        title: '',
        description: '',
        planned_at: '',
        executed_at: '',
        owner_id: '', // Neu: Owner-ID
        deputy_id: '', // Neu: Deputy-ID
        stakeholder_ids: [] as string[],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (field: string, value: string) => {
        setValues({ ...values, [field]: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        Inertia.post(route('plannings.store'), {
            ...values,
            // Konvertiere "none" zu null für das Backend
            deputy_id: values.deputy_id === 'none' ? null : values.deputy_id,
            stakeholder_ids: values.stakeholder_ids ?? [],
        });
    };

    return (
        <AppLayout>
            <Card className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <CardHeader>
                    <CardTitle>Neues Planning erstellen</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="project_id">Projekt</Label>
                            <Select value={values.project_id} onValueChange={(value) => handleSelectChange('project_id', value)}>
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
                            {errors.project_id && <p className="mt-1 text-sm text-red-600">{errors.project_id}</p>}
                        </div>
                        <div>
                            <Label htmlFor="title">Titel</Label>
                            <Input id="title" name="title" value={values.title} onChange={handleChange} required />
                            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                        </div>
                        <div>
                            <Label htmlFor="description">Beschreibung</Label>
                            <Textarea id="description" name="description" value={values.description} onChange={handleChange} />
                            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                        </div>

                        {/* Neue Felder für Owner und Deputy */}
                        <div>
                            <Label htmlFor="owner_id">Hauptverantwortlicher</Label>
                            <Select value={values.owner_id} onValueChange={(value) => handleSelectChange('owner_id', value)}>
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
                            {errors.owner_id && <p className="mt-1 text-sm text-red-600">{errors.owner_id}</p>}
                        </div>

                        <div>
                            <Label htmlFor="deputy_id">Stellvertreter</Label>
                            <Select value={values.deputy_id} onValueChange={(value) => handleSelectChange('deputy_id', value)}>
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
                            {errors.deputy_id && <p className="mt-1 text-sm text-red-600">{errors.deputy_id}</p>}
                        </div>

                        <div>
                            <Label htmlFor="planned_at">Geplant am</Label>
                            <Input id="planned_at" name="planned_at" type="date" value={values.planned_at} onChange={handleChange} />
                            {errors.planned_at && <p className="mt-1 text-sm text-red-600">{errors.planned_at}</p>}
                        </div>
                        <div>
                            <Label htmlFor="executed_at">Durchgeführt am</Label>
                            <Input id="executed_at" name="executed_at" type="date" value={values.executed_at} onChange={handleChange} />
                            {errors.executed_at && <p className="mt-1 text-sm text-red-600">{errors.executed_at}</p>}
                        </div>
                        <div>
                            <Label>Stakeholder</Label>
                            <div className="flex flex-wrap gap-2">
                                {users.length === 0 && <span className="text-sm text-gray-500">Keine Benutzer vorhanden.</span>}
                                {users.length > 0 && (
                                    <table className="min-w-full border text-sm">
                                        <thead>
                                            <tr>
                                                <th className="w-24 border p-2">Auswählen</th>
                                                <th className="border p-2">Name</th>
                                                <th className="border p-2">E-Mail</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user) => (
                                                <tr key={user.id}>
                                                    <td className="border p-2 text-center">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4"
                                                            checked={values.stakeholder_ids.includes(user.id.toString())}
                                                            onChange={() => {
                                                                setValues((prev) => ({
                                                                    ...prev,
                                                                    stakeholder_ids: prev.stakeholder_ids.includes(user.id.toString())
                                                                        ? prev.stakeholder_ids.filter((sid) => sid !== user.id.toString())
                                                                        : [...prev.stakeholder_ids, user.id.toString()],
                                                                }));
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="border p-2">{user.name}</td>
                                                    <td className="border p-2">{user.email}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            {errors.stakeholder_ids && <p className="mt-1 text-sm text-red-600">{errors.stakeholder_ids}</p>}
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="cancel" onClick={() => window.history.back()}>
                                Abbrechen
                            </Button>
                            <Button type="submit" variant="success">
                                Speichern
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
