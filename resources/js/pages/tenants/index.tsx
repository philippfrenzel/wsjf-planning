import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type SharedData } from '@/types';
import { router, useForm, usePage } from '@inertiajs/react';

export default function TenantsIndex() {
    const page = usePage<SharedData>();
    const tenants = (page.props.tenants as { id: number; name: string; members?: { id: number; name: string; email: string }[] }[]) ?? [];
    const ownedTenants =
        (page.props.ownedTenants as {
            id: number;
            name: string;
            members?: { id: number; name: string; email: string }[];
            invitations?: { id: number; email: string; accepted_at?: string | null; created_at?: string }[];
        }[]) ?? [];
    const currentTenantId = (page.props.currentTenantId as number | null) ?? null;
    const invitations =
        (page.props.pendingInvitations as {
            id: number;
            tenant_id: number;
            email: string;
            token: string;
            expires_at?: string | null;
            tenant: { id: number; name: string };
        }[]) ?? [];

    const { data, setData, post, processing, reset } = useForm<{ email: string; tenant_id: number | '' }>({
        email: '',
        tenant_id: ownedTenants[0]?.id ?? '',
    });

    const currentTenant = tenants.find((t) => t.id === currentTenantId);
    const selectedOwnedTenant = ownedTenants.find((t) => t.id === data.tenant_id);
    const pendingSelected = (selectedOwnedTenant?.invitations ?? []).filter((i) => !i.accepted_at);
    const acceptedSelected = (selectedOwnedTenant?.invitations ?? []).filter((i) => !!i.accepted_at);

    const kpiCards = [
        {
            label: 'Tenants gesamt',
            value: tenants.length.toString(),
            hint: 'inkl. eigener und zugeteilter Tenants',
        },
        {
            label: 'Mitglieder aktueller Tenant',
            value: (currentTenant?.members?.length ?? 0).toString(),
            hint: currentTenant?.name ?? 'Kein Tenant aktiv',
        },
        {
            label: 'Ausstehende Einladungen',
            value: pendingSelected.length.toString(),
            hint: selectedOwnedTenant ? selectedOwnedTenant.name : 'Keine Auswahl',
        },
        {
            label: 'Angenommene Einladungen',
            value: acceptedSelected.length.toString(),
            hint: selectedOwnedTenant ? selectedOwnedTenant.name : 'Keine Auswahl',
        },
    ];

    const revokeInvitation = (tenantId: number, invitationId: number) => {
        router.delete(route('tenants.invitations.destroy', { tenant: tenantId, invitation: invitationId }), {
            preserveScroll: true,
            onBefore: () => confirm('Möchtest du diese Einladung wirklich zurückziehen?'),
        });
    };

    const invite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.tenant_id) return;
        post(route('tenants.invite', data.tenant_id), {
            onSuccess: () => reset('email'),
            preserveScroll: true,
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/' },
                { title: 'Tenants', href: route('tenants.index') },
            ]}
        >
            <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {kpiCards.map((kpi) => (
                        <Card key={kpi.label} className="border-slate-200 bg-slate-50/70 shadow-sm">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-xs tracking-wide text-slate-500 uppercase">{kpi.label}</CardDescription>
                                <CardTitle className="text-2xl font-semibold text-slate-900">{kpi.value}</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 text-xs text-slate-500">{kpi.hint}</CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="rounded-xl shadow-sm">
                    <CardHeader className="border-b border-slate-200">
                        <CardTitle>Tenant-Verwaltung</CardTitle>
                        <CardDescription>Tenants wechseln, Einladungen versenden und verwalten.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <Tabs defaultValue="overview" className="space-y-4">
                            <TabsList className="w-full justify-start overflow-x-auto">
                                <TabsTrigger value="overview">Übersicht</TabsTrigger>
                                <TabsTrigger value="invitations">Einladungen</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-4">
                                <div className="rounded-lg border border-slate-200 bg-white/70 p-4 shadow-sm">
                                    <div className="flex flex-col gap-3">
                                        <div className="text-sm font-medium text-slate-700">Deine Tenants</div>
                                        <ul className="space-y-2">
                                            {tenants.map((t) => (
                                                <li
                                                    key={t.id}
                                                    className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-900">{t.name}</span>
                                                        {currentTenantId === t.id && (
                                                            <span className="text-xs text-emerald-600">Aktueller Tenant</span>
                                                        )}
                                                    </div>
                                                    {currentTenantId !== t.id && (
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => router.post(route('tenants.switch', t.id), {}, { preserveScroll: true })}
                                                        >
                                                            Wechseln
                                                        </Button>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="invitations" className="space-y-4">
                                <div className="rounded-lg border border-slate-200 bg-white/70 p-4 shadow-sm">
                                    <div className="flex flex-col gap-3">
                                        <div className="text-sm font-medium text-slate-700">Einladung senden</div>
                                        <form onSubmit={invite} className="space-y-3">
                                            <label className="block text-sm">
                                                <span className="mb-1 block">Tenant</span>
                                                <select
                                                    className="w-full rounded-md border px-3 py-2"
                                                    value={data.tenant_id}
                                                    onChange={(e) => setData('tenant_id', Number(e.target.value))}
                                                >
                                                    {ownedTenants.map((t) => (
                                                        <option key={t.id} value={t.id}>
                                                            {t.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label className="block text-sm">
                                                <span className="mb-1 block">E-Mail</span>
                                                <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                                            </label>
                                            <Button type="submit" disabled={processing}>
                                                Einladung erstellen
                                            </Button>
                                        </form>
                                    </div>
                                </div>

                                {invitations.length > 0 && (
                                    <div className="rounded-lg border border-slate-200 bg-white/70 p-4 shadow-sm">
                                        <div className="mb-2 text-sm font-medium text-slate-700">Ausstehende Einladungen für deine E-Mail</div>
                                        <ul className="space-y-2 text-sm text-neutral-700">
                                            {invitations.map((inv) => (
                                                <li key={inv.id} className="flex items-center justify-between rounded border px-3 py-2">
                                                    <span>
                                                        {inv.tenant.name} – Token: <code>{inv.token}</code>
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            router.post(route('tenants.accept'), { token: inv.token }, { preserveScroll: true })
                                                        }
                                                    >
                                                        Annehmen
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {selectedOwnedTenant && (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="rounded-lg border border-slate-200 bg-white/70 p-4 shadow-sm">
                                            <div className="mb-2 text-sm font-medium text-slate-700">Ausstehend ({pendingSelected.length})</div>
                                            {pendingSelected.length === 0 ? (
                                                <div className="text-xs text-neutral-500">Keine ausstehenden Einladungen</div>
                                            ) : (
                                                <ul className="space-y-1 text-sm">
                                                    {pendingSelected.map((p) => (
                                                        <li key={p.id} className="flex items-center justify-between gap-2">
                                                            <span>{p.email}</span>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => revokeInvitation(selectedOwnedTenant.id, p.id)}
                                                            >
                                                                Zurückziehen
                                                            </Button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                        <div className="rounded-lg border border-slate-200 bg-white/70 p-4 shadow-sm">
                                            <div className="mb-2 text-sm font-medium text-slate-700">Angenommen ({acceptedSelected.length})</div>
                                            {acceptedSelected.length === 0 ? (
                                                <div className="text-xs text-neutral-500">Noch keine angenommenen Einladungen</div>
                                            ) : (
                                                <ul className="space-y-1 text-sm">
                                                    {acceptedSelected.map((a) => {
                                                        const member = (selectedOwnedTenant.members ?? []).find((m) => m.email === a.email);
                                                        return (
                                                            <li key={a.id} className="flex items-center justify-between">
                                                                <span>
                                                                    {member ? (
                                                                        <>
                                                                            <span className="font-medium">{member.name}</span>
                                                                            <span className="ml-2 text-xs text-neutral-500">{member.email}</span>
                                                                        </>
                                                                    ) : (
                                                                        <span>{a.email}</span>
                                                                    )}
                                                                </span>
                                                                <span className="text-xs text-neutral-500">{a.accepted_at?.slice(0, 10)}</span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
