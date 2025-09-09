import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useForm, usePage, router } from '@inertiajs/react';
import { type SharedData } from '@/types';

export default function TenantsIndex() {
    const page = usePage<SharedData>();
    const tenants = (page.props.tenants as { id: number; name: string }[]) ?? [];
    const ownedTenants = (page.props.ownedTenants as { id: number; name: string }[]) ?? [];
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
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
