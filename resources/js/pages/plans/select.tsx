import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Inertia } from '@inertiajs/inertia';

interface Plan {
    id: number;
    name: string;
    price: number;
    interval: string;
}

interface Props {
    plans: Plan[];
}

export default function Select({ plans }: Props) {
    const breadcrumbs = [
        { title: 'Startseite', href: '/' },
        { title: 'Abo wählen', href: '#' },
    ];

    const subscribe = (planId: number) => {
        Inertia.post(route('subscriptions.store'), { plan_id: planId });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-5">
                <h1 className="mb-4 text-2xl font-bold">Abo wählen</h1>
                <div className="grid gap-4">
                    {plans.map((plan) => (
                        <div key={plan.id} className="flex justify-between rounded border p-4">
                            <div>
                                <div className="font-medium">{plan.name}</div>
                                <div className="text-sm text-gray-500">
                                    {plan.price / 100} € / {plan.interval}
                                </div>
                            </div>
                            <Button onClick={() => subscribe(plan.id)}>Auswählen</Button>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
