import { useConfirm } from '@/components/confirm-dialog-provider';
import { EmptyState } from '@/components/empty-state';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type SharedData } from '@/types';
import { router, useForm, usePage } from '@inertiajs/react';
import { Check, LoaderCircle, Mail, Settings, UserMinus, Users, Users2, X } from 'lucide-react';
import { useState } from 'react';

type Member = { id: number; name: string; email: string; pivot?: { role?: string | null } };
type OwnedTenant = {
    id: number;
    name: string;
    members?: Member[];
    invitations?: { id: number; tenant_id: number; email: string; accepted_at?: string | null; created_at?: string }[];
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

export default function TenantsIndex() {
    const page = usePage<SharedData>();
    const { currentRole, isSuperAdmin } = page.props.auth;
    const seatUnitPriceUsd = Number((page.props.billing as { seatUnitPriceUsd?: number } | undefined)?.seatUnitPriceUsd ?? 1);
    const isAdmin = currentRole === 'Admin' || !!isSuperAdmin;
    const currentUserId = page.props.auth.user.id;

    const tenants = (page.props.tenants as { id: number; name: string; members?: Member[] }[]) ?? [];
    const ownedTenants = (page.props.ownedTenants as OwnedTenant[]) ?? [];
    const currentTenantId = (page.props.currentTenantId as number | null) ?? null;
    const receivedInvitations =
        (page.props.pendingInvitations as {
            id: number;
            tenant_id: number;
            email: string;
            token: string;
            expires_at?: string | null;
            tenant: { id: number; name: string };
        }[]) ?? [];

    const [viewingTenantId, setViewingTenantId] = useState<number | null>(currentTenantId);
    const [editingName, setEditingName] = useState<{ [tenantId: number]: string }>({});

    const { data, setData, post, processing, reset, errors } = useForm({ email: '' });

    const confirm = useConfirm();

    const viewingTenant = tenants.find((t) => t.id === viewingTenantId);
    const viewingOwnedTenant = ownedTenants.find((t) => t.id === viewingTenantId);
    const members = viewingTenant?.members ?? viewingOwnedTenant?.members ?? [];
    const monthlySeatCostUsd = members.length * seatUnitPriceUsd;
    const pendingInvitations = (viewingOwnedTenant?.invitations ?? []).filter((i) => !i.accepted_at);

    const switchTenant = (tenantId: number) => {
        setViewingTenantId(tenantId);
        if (tenantId !== currentTenantId) {
            router.post(route('tenants.switch', tenantId), {}, { preserveScroll: true });
        }
    };

    const invite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!viewingTenantId) return;
        post(route('tenants.invite', viewingTenantId), {
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

    const saveTenantName = (tenantId: number) => {
        const name = editingName[tenantId];
        if (!name) return;
        router.patch(route('tenants.update', { tenant: tenantId }), { name }, { preserveScroll: true });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/' },
                { title: 'Organisation', href: route('tenants.index') },
            ]}
        >
            <div className="mx-auto max-w-3xl px-4 py-6">
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Organisation</h1>
                    {viewingTenant && (
                        <p className="mt-1 text-sm text-slate-500">
                            {viewingTenant.name}
                            <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                {members.length} Mitglied{members.length !== 1 ? 'er' : ''}
                            </span>
                        </p>
                    )}
                </div>

                {/* Tenant Switcher Pills */}
                {tenants.length > 1 && (
                    <div className="mb-6 flex flex-wrap gap-2">
                        {tenants.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => switchTenant(t.id)}
                                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                    viewingTenantId === t.id
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                {t.name}
                            </button>
                        ))}
                    </div>
                )}

                <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
                    {/* Team Section */}
                    <div className="px-6 py-5">
                        <div className="mb-4 flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-400" />
                            <h2 className="text-sm font-semibold text-slate-900">Team</h2>
                            <span className="ml-auto text-xs text-slate-500">{members.length} Mitglieder</span>
                        </div>
                        {members.length === 0 ? (
                            <EmptyState
                                icon={Users2}
                                title="Noch keine Teammitglieder"
                                description={
                                    isAdmin
                                        ? 'Laden Sie Kolleginnen und Kollegen ein, um gemeinsam zu planen.'
                                        : 'Es wurden noch keine Mitglieder zum Team hinzugefügt.'
                                }
                                action={
                                    isAdmin
                                        ? {
                                              label: 'Mitglied einladen',
                                              onClick: () => {
                                                  document.querySelector<HTMLInputElement>('input[type="email"]')?.focus();
                                              },
                                          }
                                        : undefined
                                }
                            />
                        ) : (
                            <ul className="space-y-3">
                                {members.map((m) => {
                                    const memberRole = m.pivot?.role;
                                    const isSelf = m.id === currentUserId;
                                    return (
                                        <li key={m.id} className="flex items-center gap-3">
                                            <div
                                                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${
                                                    isSelf ? 'bg-indigo-500' : 'bg-slate-400'
                                                }`}
                                            >
                                                {initials(m.name)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-slate-900">{m.name}</p>
                                                <p className="truncate text-xs text-slate-500">{m.email}</p>
                                            </div>
                                            <span className={roleBadgeClass(memberRole)}>{memberRole ?? 'Voter'}</span>
                                            {isAdmin && !isSelf && viewingOwnedTenant && (
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
                    </div>

                    {/* Invite Section (Admin + owned tenant only) */}
                    {isAdmin && viewingOwnedTenant && (
                        <div className="border-t border-slate-100 px-6 py-5">
                            <div className="mb-4 flex items-center gap-2">
                                <Mail className="h-4 w-4 text-slate-400" />
                                <h2 className="text-sm font-semibold text-slate-900">Mitglied einladen</h2>
                            </div>
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
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                >
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    Einladen
                                </Button>
                                </div>
                                <InputError message={errors.email} className="mt-1" />
                            </form>
                            {pendingInvitations.length > 0 ? (
                                <ul className="mt-4 space-y-1.5">
                                    {pendingInvitations.map((inv) => (
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
                            ) : (
                                <p className="mt-3 text-xs text-slate-400">Keine ausstehenden Einladungen</p>
                            )}
                        </div>
                    )}

                    {/* Received Invitations for the current user */}
                    {receivedInvitations.length > 0 && (
                        <div className="border-t border-slate-100 px-6 py-5">
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4">
                                <p className="mb-3 text-sm font-semibold text-amber-800">Du wurdest eingeladen</p>
                                <ul className="space-y-2">
                                    {receivedInvitations.map((inv) => (
                                        <li key={inv.id} className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-medium text-amber-900">{inv.tenant.name}</span>
                                            <button
                                                onClick={() =>
                                                    router.post(route('tenants.accept'), { token: inv.token }, { preserveScroll: true })
                                                }
                                                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
                                            >
                                                <Check className="h-3 w-3" />
                                                Annehmen
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Settings Section (Admin + owned tenant only) */}
                    {isAdmin && viewingOwnedTenant && (
                        <div className="border-t border-slate-100 px-6 py-5">
                            <div className="mb-4 flex items-center gap-2">
                                <Settings className="h-4 w-4 text-slate-400" />
                                <h2 className="text-sm font-semibold text-slate-900">Einstellungen</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        value={editingName[viewingOwnedTenant.id] ?? viewingOwnedTenant.name}
                                        onChange={(e) =>
                                            setEditingName((prev) => ({ ...prev, [viewingOwnedTenant.id]: e.target.value }))
                                        }
                                        placeholder="Organisation Name"
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={() => saveTenantName(viewingOwnedTenant.id)}
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                    >
                                        Speichern
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-slate-500">Seats genutzt</p>
                                        <p className="font-medium text-slate-900">{(viewingOwnedTenant.members ?? []).length}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Abonnement</p>
                                        <a href="/billing" className="font-medium text-indigo-600 hover:text-indigo-700">
                                            Verwalten →
                                        </a>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Monatliche Kosten: {members.length} × ${seatUnitPriceUsd} = ${monthlySeatCostUsd}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
