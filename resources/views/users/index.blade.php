import React from 'react';
import { Inertia } from '@inertiajs/inertia';
import { Link, usePage } from '@inertiajs/react';

export default function Index() {
    const { users } = usePage().props;

    const handleDelete = (id) => {
        if (confirm('Wirklich löschen?')) {
            Inertia.delete(route('users.destroy', id));
        }
    };

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-4">Benutzerverwaltung</h1>
            <Link href={route('users.create')} className="bg-blue-500 text-white px-4 py-2 rounded mb-4 inline-block">
                Neuen Benutzer anlegen
            </Link>
            <table className="min-w-full bg-white">
                <thead>
                    <tr>
                        <th className="py-2">ID</th>
                        <th className="py-2">Name</th>
                        <th className="py-2">E-Mail</th>
                        <th className="py-2">Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td className="py-2">{user.id}</td>
                            <td className="py-2">{user.name}</td>
                            <td className="py-2">{user.email}</td>
                            <td className="py-2">
                                <Link href={route('users.edit', user.id)} className="text-blue-600">Bearbeiten</Link>
                                <button
                                    onClick={() => handleDelete(user.id)}
                                    className="text-red-600 ml-2"
                                >
                                    Löschen
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}