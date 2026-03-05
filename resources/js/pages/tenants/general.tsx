import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import TenantLayout from '@/layouts/tenants/layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Home', href: '/' },
    { title: 'Organisation', href: '/tenants/general' },
    { title: 'Allgemein', href: '#' },
];

type OwnedTenant = {
    id: number;
    name: string;
    members?: { id: number; name: string; email: string }[];
};

export default function TenantGeneral({
    ownedTenants,
}: {
    ownedTenants: OwnedTenant[];
}) {
    const page = usePage<SharedData>();
    const { currentRole, isSuperAdmin } = page.props.auth;
    const isAdmin = currentRole === 'Admin' || !!isSuperAdmin;
    const currentTenantId = page.props.auth.currentTenant?.id ?? null;
    const seatUnitPrice = Number((page.props.billing as { seatUnitPriceUsd?: number } | undefined)?.seatUnitPriceUsd ?? 1);

    const currentOwned = ownedTenants.find((t) => t.id === currentTenantId);
    const members = currentOwned?.members ?? [];

    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        name: currentOwned?.name ?? '',
    });

    const saveName: FormEventHandler = (e) => {
        e.preventDefault();
        if (!currentOwned) return;
        patch(route('tenants.update', { tenant: currentOwned.id }), { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <TenantLayout>
                {isAdmin && currentOwned ? (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Organisationsname</CardTitle>
                                <CardDescription>Der Name deiner Organisation, wie er überall angezeigt wird.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={saveName} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="tenant-name">Name</Label>
                                        <Input
                                            id="tenant-name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Organisation Name"
                                            required
                                        />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button disabled={processing}>Speichern</Button>
                                        {recentlySuccessful && (
                                            <p className="text-sm text-green-600">Gespeichert</p>
                                        )}
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Abonnement & Kosten</CardTitle>
                                <CardDescription>Übersicht über genutzte Seats und anfallende Kosten.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-6 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Seats genutzt</p>
                                        <p className="text-2xl font-semibold">{members.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Monatliche Kosten</p>
                                        <p className="text-2xl font-semibold">
                                            CHF {members.length * seatUnitPrice}
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                            {members.length} × CHF {seatUnitPrice} pro Seat
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <a
                                        href="/billing"
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                                    >
                                        Abonnement verwalten →
                                    </a>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <p className="text-muted-foreground text-sm">
                                Nur Administratoren können die Organisationseinstellungen bearbeiten.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </TenantLayout>
        </AppLayout>
    );
}
