import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useForm, usePage, router } from '@inertiajs/react';
import { type SharedData } from '@/types';

export default function TenantsIndex() {
    const page = usePage<SharedData>();
    const tenants = (page.props.tenants as { id: number; name: string; members?: { id: number; name: string; email: string }[] }[]) ?? [];
    const ownedTenants = (page.props.ownedTenants as {
        id: number;
        name: string;
        members?: { id: number; name: string; email: string }[];
        invitations?: { id: number; email: string; accepted_at?: string | null; created_at?: string }[];
    }[]) ?? [];
    const currentTenantId = (page.props.currentTenantId as number | null) ?? null;
    const invitations = (page.props.pendingInvitations as any[]) ?? [];

    const { data, setData, post, processing, reset } = useForm<{ email: string; tenant_id: number | '' }>(
        { email: '', tenant_id: ownedTenants[0]?.id ?? '' }
    );

    const invite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.tenant_id) return;
        post(route('tenants.invite', data.tenant_id), {
            onSuccess: () => reset('email'),
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Home', href: '/' }, { title: 'Tenants', href: route('tenants.index') }]}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Deine Tenants</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {tenants.map((t) => (
                                <li key={t.id} className="flex items-center justify-between">
                                    <span>
                                        {t.name} {currentTenantId === t.id && <span className="text-xs text-neutral-500">(aktuell)</span>}
                                    </span>
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
                        {/* Eigene, an dich gerichtete Einladungen */}
                        {invitations.length > 0 && (
                            <div className="mt-6 text-sm text-neutral-600">
                                <div className="mb-2 font-medium">Ausstehende Einladungen für deine E-Mail:</div>
                                <ul className="space-y-2">
                                    {invitations.map((inv) => (
                                        <li key={inv.id} className="flex items-center justify-between">
                                            <span>
                                                {inv.tenant.name} – Token: <code>{inv.token}</code>
                                            </span>
                                            <Button
                                                size="sm"
                                                onClick={() => router.post(route('tenants.accept'), { token: inv.token }, { preserveScroll: true })}
                                            >
                                                Annehmen
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Einladungen für den ausgewählten (eigenen) Tenant */}
                        {(() => {
                            const selected = ownedTenants.find((t) => t.id === data.tenant_id);
                            if (!selected) return null;
                            const pend = (selected.invitations ?? []).filter((i) => !i.accepted_at);
                            const accepted = (selected.invitations ?? []).filter((i) => !!i.accepted_at);
                            return (
                                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <div className="mb-2 text-sm font-medium">Ausstehend ({pend.length})</div>
                                        {pend.length === 0 ? (
                                            <div className="text-xs text-neutral-500">Keine ausstehenden Einladungen</div>
                                        ) : (
                                            <ul className="space-y-1 text-sm">
                                                {pend.map((p) => (
                                                    <li key={p.id} className="flex items-center justify-between">
                                                        <span>{p.email}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <div>
                                        <div className="mb-2 text-sm font-medium">Angenommen ({accepted.length})</div>
                                        {accepted.length === 0 ? (
                                            <div className="text-xs text-neutral-500">Noch keine angenommenen Einladungen</div>
                                        ) : (
                                            <ul className="space-y-1 text-sm">
                                                {accepted.map((a) => {
                                                    const member = (selected.members ?? []).find((m) => m.email === a.email);
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
                            );
                        })()}
                    </CardContent>
                </Card>
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Mitglieder (aktueller Tenant)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const current = tenants.find((t) => t.id === currentTenantId);
                            const members = current?.members ?? [];
                            if (!current) return <div className="text-sm text-neutral-600">Kein aktueller Tenant ausgewählt.</div>;
                            if (members.length === 0)
                                return <div className="text-sm text-neutral-600">Noch keine Mitglieder vorhanden.</div>;
                            return (
                                <ul className="space-y-2">
                                    {members.map((m) => (
                                        <li key={m.id} className="py-1">
                                            <div className="font-medium leading-tight">{m.name}</div>
                                            <div className="text-xs text-neutral-500 leading-tight">{m.email}</div>
                                        </li>
                                    ))}
                                </ul>
                            );
                        })()}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
