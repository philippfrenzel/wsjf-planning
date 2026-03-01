import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import React from 'react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        price: '',
        interval: 'monthly',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('plans.store'));
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
                    <div>
                        <Input placeholder="Name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                        <InputError message={errors.name} className="mt-1" />
                    </div>
                    <div>
                        <Input placeholder="Preis in Cent" value={data.price} onChange={(e) => setData('price', e.target.value)} />
                        <InputError message={errors.price} className="mt-1" />
                    </div>
                    <div>
                        <Input placeholder="Intervall" value={data.interval} onChange={(e) => setData('interval', e.target.value)} />
                        <InputError message={errors.interval} className="mt-1" />
                    </div>
                    <Button type="submit" disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Speichern
                    </Button>
                </form>
            </div>
        </AppLayout>
    );
}
