import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type BreadcrumbItem } from '@/types';
import { CheckCircle2, Download, FileText } from 'lucide-react';

interface Invoice {
    id: string;
    date: string;
    total: string;
    status: string;
    number: string | null;
    pdf_url: string | null;
}

interface BillingPageProps {
    billingStatus: 'active' | 'trial' | 'inactive' | 'no_tenant' | 'sponsored';
    trialEndsAt: string | null;
    trialDaysLeft: number | null;
    sponsoredUntil: string | null;
    sponsorNote: string | null;
    upgradePrompt: boolean;
    successMessage?: string;
    stripeConfigured?: boolean;
    invoices?: Invoice[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Billing', href: '/billing' },
];

export default function BillingPage({
    billingStatus,
    trialEndsAt,
    trialDaysLeft,
    sponsoredUntil,
    sponsorNote,
    upgradePrompt,
    successMessage,
    stripeConfigured = true,
    invoices = [],
}: BillingPageProps) {
    const seatUnitPrice = Number((usePage().props as { billing?: { seatUnitPriceUsd?: number } }).billing?.seatUnitPriceUsd ?? 1);
    const flash = (usePage().props as { flash?: { error?: string } }).flash;

    const sponsoredDate = sponsoredUntil ? new Date(sponsoredUntil).toLocaleDateString('de-CH') : null;

    const statusLabel = {
        active: 'Aktiv',
        trial: `Testphase${trialDaysLeft !== null ? ` (noch ${trialDaysLeft} Tage)` : ''}`,
        inactive: 'Inaktiv',
        no_tenant: 'Keine Organisation',
        sponsored: `Gesponsert${sponsoredDate ? ` bis ${sponsoredDate}` : ''}`,
    }[billingStatus];

    const statusVariant = {
        active: 'default',
        trial: 'secondary',
        inactive: 'destructive',
        no_tenant: 'destructive',
        sponsored: 'default',
    }[billingStatus] as 'default' | 'secondary' | 'destructive';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Billing" />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Abonnement & Abrechnung</h1>
                </div>

                {upgradePrompt && billingStatus !== 'active' && billingStatus !== 'sponsored' && (
                    <Alert variant="destructive">
                        <AlertDescription>
                            Dein Abonnement ist inaktiv. Abonniere, um alle Funktionen nutzen zu können.
                        </AlertDescription>
                    </Alert>
                )}

                {successMessage && (
                    <Alert>
                        <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                )}

                {flash?.error && (
                    <Alert variant="destructive">
                        <AlertDescription>{flash.error}</AlertDescription>
                    </Alert>
                )}

                {!stripeConfigured && (
                    <Alert>
                        <AlertDescription>
                            Stripe ist noch nicht vollständig konfiguriert. Bitte stelle sicher, dass folgende Umgebungsvariablen gesetzt sind:
                            <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                                <li><code className="font-mono text-xs bg-muted px-1 rounded">STRIPE_KEY</code> — Publishable Key (pk_...)</li>
                                <li><code className="font-mono text-xs bg-muted px-1 rounded">STRIPE_SECRET</code> — Secret Key (sk_...)</li>
                                <li><code className="font-mono text-xs bg-muted px-1 rounded">STRIPE_PRICE_ID</code> — <strong>Price ID</strong> (price_...), nicht die Product ID (prod_...)</li>
                            </ul>
                            <p className="mt-2 text-xs text-muted-foreground">Die Price ID findest du im Stripe Dashboard unter Produkte → dein Produkt → Preise.</p>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Pricing Card */}
                <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
                    <CardHeader>
                        <CardTitle className="text-lg">Preismodell</CardTitle>
                        <CardDescription>Einfach, transparent und fair.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-indigo-600">CHF {seatUnitPrice}</span>
                            <span className="text-muted-foreground text-sm">/ Benutzer / Monat</span>
                        </div>
                        <ul className="mt-4 space-y-2 text-sm text-slate-600">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                14 Tage kostenlose Testphase
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Alle Funktionen inbegriffen
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Jederzeit kündbar
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Keine versteckten Kosten
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Status Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            Abonnement-Status
                            <Badge variant={statusVariant}>{statusLabel}</Badge>
                        </CardTitle>
                        <CardDescription>
                            {billingStatus === 'trial' && trialEndsAt &&
                                `Deine kostenlose Testphase endet am ${new Date(trialEndsAt).toLocaleDateString('de-CH')}.`}
                            {billingStatus === 'active' &&
                                `Dein Abonnement ist aktiv. CHF ${seatUnitPrice} pro Benutzer pro Monat.`}
                            {billingStatus === 'inactive' &&
                                `Deine Testphase ist abgelaufen oder das Abonnement wurde gekündigt.`}
                            {billingStatus === 'no_tenant' &&
                                'Erstelle zuerst eine Organisation, um ein Abonnement abzuschliessen.'}
                            {billingStatus === 'sponsored' &&
                                `Deine Organisation wird gesponsert${sponsoredDate ? ` bis zum ${sponsoredDate}` : ''}.${sponsorNote ? ` ${sponsorNote}` : ''} Alle Funktionen sind freigeschaltet.`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-3">
                        {billingStatus !== 'active' && billingStatus !== 'no_tenant' && billingStatus !== 'sponsored' && (
                            <Button asChild disabled={!stripeConfigured}>
                                <a href="/billing/checkout">Jetzt abonnieren</a>
                            </Button>
                        )}
                        {billingStatus === 'active' && (
                            <Button variant="outline" asChild disabled={!stripeConfigured}>
                                <a href="/billing/portal">Abonnement verwalten</a>
                            </Button>
                        )}
                        </div>
                    </CardContent>
                </Card>

                {/* Invoices Card */}
                {invoices.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Rechnungen
                            </CardTitle>
                            <CardDescription>Bisherige Zahlungen und Rechnungen aus Stripe.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nr.</TableHead>
                                        <TableHead>Datum</TableHead>
                                        <TableHead>Betrag</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">PDF</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.map((inv) => (
                                        <TableRow key={inv.id}>
                                            <TableCell className="font-mono text-xs">{inv.number ?? '–'}</TableCell>
                                            <TableCell>{new Date(inv.date).toLocaleDateString('de-CH')}</TableCell>
                                            <TableCell>{inv.total}</TableCell>
                                            <TableCell>
                                                <Badge variant={inv.status === 'paid' ? 'default' : 'secondary'}>
                                                    {inv.status === 'paid' ? 'Bezahlt' : inv.status === 'open' ? 'Offen' : inv.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {inv.pdf_url && (
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer">
                                                            <Download className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
