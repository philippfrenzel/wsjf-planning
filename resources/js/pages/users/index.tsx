import { useConfirm } from '@/components/confirm-dialog-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Role {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    roles?: Role[];
}

interface UsersIndexProps {
    users: User[];
}

export default function Index({ users }: UsersIndexProps) {
    const confirm = useConfirm();
    const [searchTerm, setSearchTerm] = useState('');

    const handleDeleteUser = async (userId: number, userName: string) => {
        const ok = await confirm({
            title: 'Benutzer löschen',
            description: `Möchten Sie den Benutzer "${userName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
            confirmLabel: 'Löschen',
            cancelLabel: 'Abbrechen',
        });
        if (!ok) return;
        router.delete(route('users.destroy', { user: userId }));
    };

    // Filtere Benutzer basierend auf Suchbegriff
    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.roles && user.roles.some((role) => role.name.toLowerCase().includes(searchTerm.toLowerCase()))),
    );

    return (
        <AppLayout>
            <Head title="Benutzer" />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Benutzerverwaltung</h1>
                    <Button asChild>
                        <Link href={route('users.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Neuer Benutzer
                        </Link>
                    </Button>
                </div>

                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="mb-4 flex items-center gap-4">
                            <Search className="text-muted-foreground h-5 w-5" />
                            <Input
                                placeholder="Suche nach Namen, E-Mail oder Rollen..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Benutzer ({filteredUsers.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>E-Mail</TableHead>
                                    <TableHead>Rollen</TableHead>
                                    <TableHead className="w-[100px] text-right">Aktionen</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                                            Keine Benutzer gefunden
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {user.roles &&
                                                        user.roles.map((role) => (
                                                            <Badge key={role.id} variant="outline">
                                                                {role.name}
                                                            </Badge>
                                                        ))}
                                                    {(!user.roles || user.roles.length === 0) && (
                                                        <span className="text-muted-foreground text-sm">Keine Rollen</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Menü öffnen</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={route('users.show', user.id)} className="flex items-center">
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                <span>Details</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={route('users.edit', user.id)} className="flex items-center">
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                <span>Bearbeiten</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user.id, user.name)}>
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            <span>Löschen</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

        </AppLayout>
    );
}
