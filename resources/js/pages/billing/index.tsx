import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type BreadcrumbItem } from '@/types';

interface BillingPageProps {
    billingStatus: 'active' | 'trial' | 'inactive' | 'no_tenant';
    trialEndsAt: string | null;
    trialDaysLeft: number | null;
    upgradePrompt: boolean;
    successMessage?: string;
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
}: BillingPageProps) {
    const statusLabel = {
        active: 'Active',
        trial: `Free Trial${trialDaysLeft !== null ? ` (${trialDaysLeft} days left)` : ''}`,
        inactive: 'Inactive',
        no_tenant: 'No Tenant',
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
                    <h1 className="text-2xl font-semibold">Billing & Subscription</h1>
                </div>

                {upgradePrompt && billingStatus !== 'active' && (
                    <Alert variant="destructive">
                        <AlertDescription>
                            Your subscription is inactive. Subscribe to access all features.
                        </AlertDescription>
                    </Alert>
                )}

                {successMessage && (
                    <Alert>
                        <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            Subscription Status
                            <Badge variant={statusVariant}>{statusLabel}</Badge>
                        </CardTitle>
                        <CardDescription>
                            {billingStatus === 'trial' && trialEndsAt &&
                                `Your free trial ends on ${new Date(trialEndsAt).toLocaleDateString()}.`}
                            {billingStatus === 'active' &&
                                'Your subscription is active. Seats are billed per team member.'}
                            {billingStatus === 'inactive' &&
                                'Your trial has ended or subscription is cancelled. Subscribe to continue using the app.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-3">
                        {billingStatus !== 'active' && (
                            <Button asChild>
                                <Link href="/billing/checkout">Subscribe Now</Link>
                            </Button>
                        )}
                        {billingStatus === 'active' && (
                            <Button variant="outline" asChild>
                                <Link href="/billing/portal">Manage Billing</Link>
                            </Button>
                        )}
                        {billingStatus === 'trial' && (
                            <Button variant="outline" asChild>
                                <Link href="/billing/checkout">Add Payment Method</Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
