import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Inertia } from '@inertiajs/inertia';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
}
interface Planning {
    id: number;
    title: string;
    project?: { id: number; name: string };
    creator?: User;
    owner?: User;
    deputy?: User;
    created_by: number;
}

interface AdminPlanningsProps {
    plannings: Planning[];
    users: User[];
}

export default function AdminPlannings({ plannings, users }: AdminPlanningsProps) {
    const [editId, setEditId] = useState<number | null>(null);
    const [selectedUser, setSelectedUser] = useState<{ [planningId: number]: string }>({});
    const [successId, setSuccessId] = useState<number | null>(null);

    const handleChange = (planningId: number, userId: string) => {
        setSelectedUser((prev) => ({ ...prev, [planningId]: userId }));
    };

    const handleSave = (planningId: number) => {
        Inertia.post(
            route('plannings.set-creator', { planning: planningId }),
            {
                created_by: selectedUser[planningId],
            },
            {
                onSuccess: () => {
                    setSuccessId(planningId);
                    setTimeout(() => setSuccessId(null), 2000);
                    setEditId(null);
                },
            },
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Admin', href: '' },
                { title: 'Plannings verwalten', href: '' },
            ]}
        >
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Plannings – Ersteller ändern (Admin)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Titel</TableHead>
                                <TableHead>Projekt</TableHead>
                                <TableHead>Ersteller</TableHead>
                                <TableHead>Aktion</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plannings.map((planning) => (
                                <TableRow key={planning.id}>
                                    <TableCell>{planning.id}</TableCell>
                                    <TableCell>{planning.title}</TableCell>
                                    <TableCell>{planning.project?.name ?? '-'}</TableCell>
                                    <TableCell>
                                        {editId === planning.id ? (
                                            <Select
                                                value={selectedUser[planning.id] ?? String(planning.created_by)}
                                                onValueChange={(val) => handleChange(planning.id, val)}
                                            >
                                                <SelectTrigger className="w-40">
                                                    <SelectValue placeholder="Ersteller wählen" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {users.map((user) => (
                                                        <SelectItem key={user.id} value={String(user.id)}>
                                                            {user.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            (planning.creator?.name ?? '-')
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editId === planning.id ? (
                                            <Button size="sm" onClick={() => handleSave(planning.id)}>
                                                Speichern
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="outline" onClick={() => setEditId(planning.id)}>
                                                Ersteller ändern
                                            </Button>
                                        )}
                                        {successId === planning.id && <span className="ml-2 text-xs text-green-600">Gespeichert!</span>}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
