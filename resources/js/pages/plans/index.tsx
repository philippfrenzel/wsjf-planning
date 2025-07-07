import React from "react";
import { Link } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";

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
    { title: "Startseite", href: "/" },
    { title: "Pläne", href: "#" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="p-5">
        <h1 className="text-2xl font-bold mb-4">Pläne</h1>
        <div className="grid gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="border p-4 rounded flex justify-between">
              <div>
                <div className="font-medium">{plan.name}</div>
                <div className="text-sm text-gray-500">
                  {plan.price / 100} € / {plan.interval}
                </div>
              </div>
              <Button asChild>
                <Link href={route("subscriptions.create", { plan: plan.id })}>
                  Wählen
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
