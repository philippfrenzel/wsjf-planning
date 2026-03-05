import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type BreadcrumbItem } from '@/types';
import { CheckCircle2 } from 'lucide-react';

interface BillingPageProps {
    billingStatus: 'active' | 'trial' | 'inactive' | 'no_tenant';
    trialEndsAt: string | null;
    trialDaysLeft: number | null;
    upgradePrompt: boolean;
    successMessage?: string;
    stripeConfigured?: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Billing', href: '/billing' },
];

export default function BillingPage({
    billingStatus,
    trialEndsAt,
    trialDaysLeft,
    upgradePrompt,
    successMessage,
    stripeConfigured = true,
}: BillingPageProps) {
    const seatUnitPrice = Number((usePage().props as { billing?: { seatUnitPriceUsd?: number } }).billing?.seatUnitPriceUsd ?? 1);
    const flash = (usePage().props as { flash?: { error?: string } }).flash;
    const statusLabel = {
        active: 'Aktiv',
        trial: `Testphase${trialDaysLeft !== null ? ` (noch ${trialDaysLeft} Tage)` : ''}`,
        inactive: 'Inaktiv',
        no_tenant: 'Keine Organisation',
    }[billingStatus];

    const statusVariant = {
        active: 'default',
        trial: 'secondary',
        inactive: 'destructive',
        no_tenant: 'destructive',
    }[billingStatus] as 'default' | 'secondary' | 'destructive';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Billing" />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Abonnement & Abrechnung</h1>
                </div>

                {upgradePrompt && billingStatus !== 'active' && (
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
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-3">
                        {billingStatus !== 'active' && billingStatus !== 'no_tenant' && (
                            <Button asChild disabled={!stripeConfigured}>
                                <Link href="/billing/checkout">Jetzt abonnieren</Link>
                            </Button>
                        )}
                        {billingStatus === 'active' && (
                            <Button variant="outline" asChild disabled={!stripeConfigured}>
                                <Link href="/billing/portal">Abonnement verwalten</Link>
                            </Button>
                        )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
