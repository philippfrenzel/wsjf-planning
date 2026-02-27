import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type SharedData } from '@/types';
import { router, useForm, usePage } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useState } from 'react';

type Member = { id: number; name: string; email: string; pivot?: { role?: string | null } };
type OwnedTenant = {
    id: number;
    name: string;
    members?: Member[];
    invitations?: { id: number; tenant_id: number; email: string; accepted_at?: string | null; created_at?: string }[];
};

const roleBadgeClass = (role?: string | null) => {
    if (role === 'Admin') return 'rounded px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800';
    if (role === 'Planner') return 'rounded px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800';
    return 'rounded px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700';
};

export default function TenantsIndex() {
    const page = usePage<SharedData>();
    const { currentRole, isSuperAdmin } = page.props.auth;
    const isAdmin = currentRole === 'Admin' || !!isSuperAdmin;

    const tenants = (page.props.tenants as { id: number; name: string; members?: Member[] }[]) ?? [];
    const ownedTenants = (page.props.ownedTenants as OwnedTenant[]) ?? [];
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

    const [editingName, setEditingName] = useState<{ [tenantId: number]: string }>({});

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

    const changeRole = (tenantId: number, memberId: number, role: string) => {
        router.patch(route('tenants.members.update', { tenant: tenantId, user: memberId }), { role }, { preserveScroll: true });
    };

    const removeMember = (tenantId: number, memberId: number) => {
        if (!confirm('Mitglied wirklich entfernen?')) return;
        router.delete(route('tenants.members.destroy', { tenant: tenantId, user: memberId }), { preserveScroll: true });
    };

    const saveTenantName = (tenantId: number) => {
        const name = editingName[tenantId];
        if (!name) return;
        router.patch(route('tenants.update', { tenant: tenantId }), { name }, { preserveScroll: true });
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
                                <TabsTrigger value="members">Mitglieder</TabsTrigger>
                                {isAdmin && <TabsTrigger value="invitations">Einladungen</TabsTrigger>}
                                {isAdmin && <TabsTrigger value="settings">Einstellungen</TabsTrigger>}
                            </TabsList>

                            <TabsContent value="overview" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Deine Tenants</CardTitle>
                                    </CardHeader>
                                    <CardContent>
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
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="members" className="space-y-4">
                                {ownedTenants.map((ot) => (
                                    <Card key={ot.id}>
                                        <CardHeader>
                                            <CardTitle>Mitglieder — {ot.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2">
                                                {(ot.members ?? []).map((m) => {
                                                    const memberRole = m.pivot?.role;
                                                    const isSelf = m.id === page.props.auth.user.id;
                                                    return (
                                                        <li
                                                            key={m.id}
                                                            className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2"
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-slate-900">{m.name}</span>
                                                                <span className="text-xs text-slate-500">{m.email}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={roleBadgeClass(memberRole)}>{memberRole ?? 'Voter'}</span>
                                                                {isAdmin && !isSelf && (
                                                                    <>
                                                                        <select
                                                                            className="rounded-md border px-2 py-1 text-sm"
                                                                            value={memberRole ?? 'Voter'}
                                                                            onChange={(e) => changeRole(ot.id, m.id, e.target.value)}
                                                                        >
                                                                            <option value="Admin">Admin</option>
                                                                            <option value="Planner">Planner</option>
                                                                            <option value="Voter">Voter</option>
                                                                        </select>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="destructive"
                                                                            onClick={() => removeMember(ot.id, m.id)}
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                ))}
                            </TabsContent>

                            {isAdmin && (
                                <TabsContent value="invitations" className="space-y-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Einladung senden</CardTitle>
                                        </CardHeader>
                                        <CardContent>
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
                                        </CardContent>
                                    </Card>

                                    {invitations.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Ausstehende Einladungen für deine E-Mail</CardTitle>
                                            </CardHeader>
                                            <CardContent>
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
                                            </CardContent>
                                        </Card>
                                    )}

                                    {selectedOwnedTenant && (
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Ausstehend ({pendingSelected.length})</CardTitle>
                                                </CardHeader>
                                                <CardContent>
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
                                                                        <X />
                                                                        Zurückziehen
                                                                    </Button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Angenommen ({acceptedSelected.length})</CardTitle>
                                                </CardHeader>
                                                <CardContent>
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
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )}
                                </TabsContent>
                            )}

                            {isAdmin && (
                                <TabsContent value="settings" className="space-y-4">
                                    {ownedTenants.map((ot) => (
                                        <Card key={ot.id}>
                                            <CardHeader>
                                                <CardTitle>Einstellungen — {ot.name}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div>
                                                    <p className="mb-1 text-sm font-medium">Tenant-Name</p>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            value={editingName[ot.id] ?? ot.name}
                                                            onChange={(e) => setEditingName((prev) => ({ ...prev, [ot.id]: e.target.value }))}
                                                        />
                                                        <Button onClick={() => saveTenantName(ot.id)}>Speichern</Button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                                                    <span className="text-slate-600">Seats</span>
                                                    <span className="font-medium">{(ot.members ?? []).length} seat(s)</span>
                                                </div>
                                                <div className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                                                    <span className="text-slate-600">Abonnement</span>
                                                    <span className="text-slate-400">No active subscription</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </TabsContent>
                            )}
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
