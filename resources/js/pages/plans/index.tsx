import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Link } from '@inertiajs/react';

interface Plan {
    id: number;
    name: string;
    price: number;
    interval: string;
}

interface Props {
    plans: Plan[];
}

export default function Index({ plans }: Props) {
    const breadcrumbs = [
        { title: 'Startseite', href: '/' },
        { title: 'Pläne', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-5">
                <h1 className="mb-4 text-2xl font-bold">Pläne</h1>
                <div className="grid gap-4">
                    {plans.map((plan) => (
                        <div key={plan.id} className="flex justify-between rounded border p-4">
                            <div>
                                <div className="font-medium">{plan.name}</div>
                                <div className="text-sm text-muted-foreground">
                                    {plan.price / 100} € / {plan.interval}
                                </div>
                            </div>
                            <Button asChild>
                                <Link href={route('subscriptions.create', { plan: plan.id })}>Wählen</Link>
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
