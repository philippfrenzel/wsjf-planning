import { useConfirm } from '@/components/confirm-dialog-provider';
import { EmptyState } from '@/components/empty-state';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import TenantLayout from '@/layouts/tenants/layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { router, useForm, usePage } from '@inertiajs/react';
import { Check, LoaderCircle, Mail, UserMinus, Users2, X } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Home', href: '/' },
    { title: 'Organisation', href: '/tenants/members' },
    { title: 'Mitglieder', href: '#' },
];

type Member = { id: number; name: string; email: string; pivot?: { role?: string | null } };
type OwnedTenant = {
    id: number;
    name: string;
    owner_user_id: number;
    members?: Member[];
    invitations?: { id: number; tenant_id: number; email: string; accepted_at?: string | null; created_at?: string }[];
};
type ReceivedInvitation = {
    id: number;
    tenant_id: number;
    email: string;
    token: string;
    expires_at?: string | null;
    tenant: { id: number; name: string };
};

const initials = (name: string) =>
    name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

const relativeDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return 'heute';
    if (days === 1) return 'gestern';
    return `vor ${days} Tagen`;
};

const roleBadgeClass = (role?: string | null) => {
    if (role === 'Admin') return 'rounded-md px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700';
    if (role === 'Planner') return 'rounded-md px-2 py-0.5 text-xs font-medium bg-violet-100 text-violet-700';
    return 'rounded-md px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600';
};

export default function TenantMembers({
    tenants,
    ownedTenants,
    currentTenantId,
    pendingInvitations,
}: {
    tenants: { id: number; name: string; members?: Member[] }[];
    ownedTenants: OwnedTenant[];
    currentTenantId: number | null;
    pendingInvitations: ReceivedInvitation[];
}) {
    const page = usePage<SharedData>();
    const { currentRole, isSuperAdmin } = page.props.auth;
    const isAdmin = currentRole === 'Admin' || !!isSuperAdmin;
    const currentUserId = page.props.auth.user.id;

    const viewingTenant = tenants.find((t) => t.id === currentTenantId);
    const viewingOwnedTenant = ownedTenants.find((t) => t.id === currentTenantId);
    const members = viewingTenant?.members ?? viewingOwnedTenant?.members ?? [];
    const tenantInvitations = (viewingOwnedTenant?.invitations ?? []).filter((i) => !i.accepted_at);

    const { data, setData, post, processing, reset, errors } = useForm({ email: '' });
    const confirm = useConfirm();

    const invite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTenantId) return;
        post(route('tenants.invite', currentTenantId), {
            onSuccess: () => reset('email'),
            preserveScroll: true,
        });
    };

    const revokeInvitation = async (tenantId: number, invitationId: number) => {
        const ok = await confirm({
            title: 'Einladung zurückziehen',
            description: 'Möchtest du diese Einladung wirklich zurückziehen?',
            confirmLabel: 'Zurückziehen',
            cancelLabel: 'Abbrechen',
        });
        if (!ok) return;
        router.delete(route('tenants.invitations.destroy', { tenant: tenantId, invitation: invitationId }), {
            preserveScroll: true,
        });
    };

    const changeRole = (tenantId: number, memberId: number, role: string) => {
        router.patch(route('tenants.members.update', { tenant: tenantId, user: memberId }), { role }, { preserveScroll: true });
    };

    const removeMember = async (tenantId: number, memberId: number) => {
        const ok = await confirm({
            title: 'Mitglied entfernen',
            description: 'Möchten Sie dieses Mitglied wirklich aus dem Team entfernen?',
            confirmLabel: 'Entfernen',
            cancelLabel: 'Abbrechen',
        });
        if (!ok) return;
        router.delete(route('tenants.members.destroy', { tenant: tenantId, user: memberId }), { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <TenantLayout>
                <div className="space-y-6">
                    {/* Received Invitations */}
                    {pendingInvitations.length > 0 && (
                        <Card className="border-amber-200 bg-amber-50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-amber-800">Du wurdest eingeladen</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {pendingInvitations.map((inv) => (
                                        <li key={inv.id} className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-medium text-amber-900">{inv.tenant.name}</span>
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    router.post(route('tenants.accept'), { token: inv.token }, { preserveScroll: true })
                                                }
                                            >
                                                <Check className="mr-1 h-3 w-3" />
                                                Annehmen
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Members List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Mitglieder</CardTitle>
                            <CardDescription>{members.length} Mitglied{members.length !== 1 ? 'er' : ''} in dieser Organisation</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {members.length === 0 ? (
                                <EmptyState
                                    icon={Users2}
                                    title="Noch keine Teammitglieder"
                                    description={
                                        isAdmin
                                            ? 'Laden Sie Kolleginnen und Kollegen ein, um gemeinsam zu planen.'
                                            : 'Es wurden noch keine Mitglieder zum Team hinzugefügt.'
                                    }
                                />
                            ) : (
                                <ul className="space-y-3">
                                    {members.map((m) => {
                                        const memberRole = m.pivot?.role;
                                        const isSelf = m.id === currentUserId;
                                        const isOwner = viewingOwnedTenant && m.id === viewingOwnedTenant.owner_user_id;
                                        return (
                                            <li key={m.id} className="flex items-center gap-3">
                                                <div
                                                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${
                                                        isOwner ? 'bg-amber-500' : isSelf ? 'bg-indigo-500' : 'bg-slate-400'
                                                    }`}
                                                >
                                                    {initials(m.name)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-slate-900">
                                                        {m.name}
                                                        {isOwner && <span className="ml-2 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Eigentümer</span>}
                                                    </p>
                                                    <p className="truncate text-xs text-slate-500">{m.email}</p>
                                                </div>
                                                <span className={roleBadgeClass(memberRole)}>{memberRole ?? 'Voter'}</span>
                                                {isAdmin && !isSelf && !isOwner && viewingOwnedTenant && (
                                                    <>
                                                        <select
                                                            className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700"
                                                            value={memberRole ?? 'Voter'}
                                                            onChange={(e) => changeRole(viewingOwnedTenant.id, m.id, e.target.value)}
                                                        >
                                                            <option value="Admin">Admin</option>
                                                            <option value="Planner">Planner</option>
                                                            <option value="Voter">Voter</option>
                                                        </select>
                                                        <button
                                                            onClick={() => removeMember(viewingOwnedTenant.id, m.id)}
                                                            className="rounded-lg p-1.5 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700"
                                                            title="Mitglied entfernen"
                                                        >
                                                            <UserMinus className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    {/* Invite Section */}
                    {isAdmin && viewingOwnedTenant && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Mitglied einladen
                                </CardTitle>
                                <CardDescription>Lade neue Mitglieder per E-Mail ein.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={invite} className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <Input
                                            type="email"
                                            placeholder="E-Mail-Adresse"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                            className="flex-1"
                                        />
                                        <Button type="submit" disabled={processing}>
                                            {processing && <LoaderCircle className="mr-1 h-4 w-4 animate-spin" />}
                                            Einladen
                                        </Button>
                                    </div>
                                    <InputError message={errors.email} />
                                </form>

                                {tenantInvitations.length > 0 ? (
                                    <div className="mt-4">
                                        <p className="text-muted-foreground mb-2 text-xs font-medium">Ausstehende Einladungen</p>
                                        <ul className="space-y-1.5">
                                            {tenantInvitations.map((inv) => (
                                                <li key={inv.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                                                    <span className="flex-1 text-slate-700">{inv.email}</span>
                                                    <span className="text-xs text-slate-400">{relativeDate(inv.created_at)}</span>
                                                    <button
                                                        onClick={() => revokeInvitation(viewingOwnedTenant.id, inv.id)}
                                                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700"
                                                    >
                                                        <X className="h-3 w-3" />
                                                        Widerrufen
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p className="mt-3 text-xs text-slate-400">Keine ausstehenden Einladungen</p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </TenantLayout>
        </AppLayout>
    );
}
