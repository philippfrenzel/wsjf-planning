import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { Globe, Pencil, Shield, Users, Check, X as XIcon, Gift } from 'lucide-react';
import { useState } from 'react';

interface TenantRow {
    id: number;
    name: string;
    owner_name: string | null;
    owner_email: string | null;
    members_count: number;
    sponsored_until: string | null;
    sponsor_note: string | null;
    is_sponsored: boolean;
    has_subscription: boolean;
    trial_ends_at: string | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Startseite', href: '/' },
    { title: 'Admin', href: '#' },
    { title: 'Lizenzen', href: '#' },
];

function statusBadge(t: TenantRow) {
    if (t.has_subscription) return <Badge className="bg-green-100 text-green-700">Abo aktiv</Badge>;
    if (t.is_sponsored) return <Badge className="bg-purple-100 text-purple-700">Gesponsert</Badge>;
    if (t.trial_ends_at) return <Badge className="bg-amber-100 text-amber-700">Trial</Badge>;
    return <Badge variant="secondary">Inaktiv</Badge>;
}

export default function Licenses({ tenants }: { tenants: TenantRow[] }) {
    const [editTenant, setEditTenant] = useState<TenantRow | null>(null);
    const [domainOpen, setDomainOpen] = useState(false);

    const editForm = useForm({
        sponsored_until: '',
        sponsor_note: '',
    });

    const domainForm = useForm({
        domain: '',
        sponsored_until: '',
        sponsor_note: '',
    });

    function openEdit(tenant: TenantRow) {
        setEditTenant(tenant);
        editForm.setData({
            sponsored_until: tenant.sponsored_until ?? '',
            sponsor_note: tenant.sponsor_note ?? '',
        });
    }

    function handleEditSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!editTenant) return;
        editForm.patch(route('admin.licenses.update', editTenant.id), {
            onSuccess: () => setEditTenant(null),
        });
    }

    function handleDomainSubmit(e: React.FormEvent) {
        e.preventDefault();
        domainForm.post(route('admin.licenses.domain'), {
            onSuccess: () => {
                setDomainOpen(false);
                domainForm.reset();
            },
        });
    }

    function revokeSponsor(tenant: TenantRow) {
        router.patch(route('admin.licenses.update', tenant.id), {
            sponsored_until: null,
            sponsor_note: null,
        });
    }

    const fmt = (d: string) => new Date(d).toLocaleDateString('de-CH');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="mx-auto w-full max-w-5xl space-y-6 p-5">
                <div className="flex items-center justify-between">
                    <h1 className="flex items-center gap-2 text-2xl font-bold">
                        <Shield className="h-6 w-6" /> Lizenzverwaltung
                    </h1>
                    <Button variant="outline" size="sm" onClick={() => setDomainOpen(true)}>
                        <Globe className="mr-1.5 h-4 w-4" /> Domain freischalten
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            {tenants.length} Organisation{tenants.length !== 1 ? 'en' : ''}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                                    <th className="px-4 py-2 text-left font-medium">Organisation</th>
                                    <th className="px-4 py-2 text-left font-medium">Eigentümer</th>
                                    <th className="w-20 px-4 py-2 text-center font-medium"><Users className="mx-auto h-3.5 w-3.5" /></th>
                                    <th className="px-4 py-2 text-left font-medium">Status</th>
                                    <th className="px-4 py-2 text-left font-medium">Sponsoring</th>
                                    <th className="w-24 px-4 py-2 text-right font-medium">Aktionen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenants.map((t) => (
                                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-2.5 font-medium">{t.name}</td>
                                        <td className="px-4 py-2.5">
                                            <div className="text-sm">{t.owner_name ?? '—'}</div>
                                            <div className="text-xs text-muted-foreground">{t.owner_email}</div>
                                        </td>
                                        <td className="px-4 py-2.5 text-center text-sm">{t.members_count}</td>
                                        <td className="px-4 py-2.5">{statusBadge(t)}</td>
                                        <td className="px-4 py-2.5">
                                            {t.is_sponsored ? (
                                                <div>
                                                    <div className="flex items-center gap-1.5 text-sm text-purple-700">
                                                        <Gift className="h-3.5 w-3.5" />
                                                        bis {fmt(t.sponsored_until!)}
                                                    </div>
                                                    {t.sponsor_note && (
                                                        <div className="text-xs text-muted-foreground">{t.sponsor_note}</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                {t.is_sponsored && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => revokeSponsor(t)}>
                                                        <XIcon className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Edit Sponsor Dialog */}
                <Dialog open={!!editTenant} onOpenChange={(open) => !open && setEditTenant(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Lizenz für „{editTenant?.name}"</DialogTitle>
                            <DialogDescription>
                                Eigentümer: {editTenant?.owner_name} ({editTenant?.owner_email})
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="sponsored_until">Gesponsert bis</Label>
                                <Input
                                    id="sponsored_until"
                                    type="date"
                                    value={editForm.data.sponsored_until}
                                    onChange={(e) => editForm.setData('sponsored_until', e.target.value)}
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Leer lassen um Sponsoring zu entfernen.
                                </p>
                            </div>
                            <div>
                                <Label htmlFor="sponsor_note">Notiz</Label>
                                <Input
                                    id="sponsor_note"
                                    value={editForm.data.sponsor_note}
                                    onChange={(e) => editForm.setData('sponsor_note', e.target.value)}
                                    placeholder="z.B. Kostenlos für interne Teams"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditTenant(null)}>Abbrechen</Button>
                                <Button type="submit" disabled={editForm.processing}>
                                    <Check className="mr-1.5 h-4 w-4" /> Speichern
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Domain Sponsor Dialog */}
                <Dialog open={domainOpen} onOpenChange={setDomainOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Domain freischalten</DialogTitle>
                            <DialogDescription>
                                Alle Organisationen deren Eigentümer eine E-Mail-Adresse der angegebenen Domain haben, werden freigeschaltet.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleDomainSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="domain">Domain</Label>
                                <Input
                                    id="domain"
                                    value={domainForm.data.domain}
                                    onChange={(e) => domainForm.setData('domain', e.target.value)}
                                    placeholder="z.B. swica.ch"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="domain_until">Gesponsert bis</Label>
                                <Input
                                    id="domain_until"
                                    type="date"
                                    value={domainForm.data.sponsored_until}
                                    onChange={(e) => domainForm.setData('sponsored_until', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="domain_note">Notiz</Label>
                                <Input
                                    id="domain_note"
                                    value={domainForm.data.sponsor_note}
                                    onChange={(e) => domainForm.setData('sponsor_note', e.target.value)}
                                    placeholder="z.B. Interne Nutzung kostenlos"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDomainOpen(false)}>Abbrechen</Button>
                                <Button type="submit" disabled={domainForm.processing}>
                                    <Globe className="mr-1.5 h-4 w-4" /> Freischalten
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
