import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Inertia } from '@inertiajs/inertia';
import React, { useState } from 'react';

export default function Create() {
    const [form, setForm] = useState({ name: '', price: '', interval: 'monthly' });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        Inertia.post(route('plans.store'), form);
    };

    const breadcrumbs = [
        { title: 'Startseite', href: '/' },
        { title: 'Plan erstellen', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="max-w-md p-5">
                <h1 className="mb-4 text-2xl font-bold">Plan erstellen</h1>
                <form onSubmit={submit} className="grid gap-4">
                    <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <Input placeholder="Preis in Cent" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                    <Input placeholder="Intervall" value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })} />
                    <Button type="submit">Speichern</Button>
                </form>
            </div>
        </AppLayout>
    );
}
