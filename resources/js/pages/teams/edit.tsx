import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { LoaderCircle, Save, X } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Team {
    id: number;
    name: string;
    description: string | null;
    members: { id: number; name: string; email: string }[];
}

export default function Edit({ team, users }: { team: Team; users: User[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Startseite', href: '/' },
        { title: 'Teams', href: '/teams' },
        { title: team.name, href: '#' },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: team.name,
        description: team.description ?? '',
        members: team.members.map((m) => m.id),
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(route('teams.update', team.id));
    }

    function toggleMember(userId: number) {
        setData('members', data.members.includes(userId)
            ? data.members.filter((id) => id !== userId)
            : [...data.members, userId]);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="mx-auto w-full max-w-2xl p-5">
                <Card>
                    <CardHeader>
                        <CardTitle>Team bearbeiten</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                                <InputError message={errors.name} />
                            </div>
                            <div>
                                <Label htmlFor="description">Beschreibung</Label>
                                <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={3} />
                                <InputError message={errors.description} />
                            </div>
                            <div>
                                <Label>Mitglieder</Label>
                                <div className="mt-2 max-h-60 space-y-2 overflow-y-auto rounded-md border p-3">
                                    {users.map((user) => (
                                        <label key={user.id} className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={data.members.includes(user.id)}
                                                onCheckedChange={() => toggleMember(user.id)}
                                            />
                                            {user.name} <span className="text-muted-foreground">({user.email})</span>
                                        </label>
                                    ))}
                                </div>
                                <InputError message={errors.members} />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    {processing ? <LoaderCircle className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                                    Speichern
                                </Button>
                                <Button type="button" variant="outline" onClick={() => history.back()}>
                                    <X className="mr-1 h-4 w-4" /> Abbrechen
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
