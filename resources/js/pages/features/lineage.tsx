import AppLayout from '@/layouts/app-layout';
import { Link } from '@inertiajs/react';

interface LineageFeature {
    id: number;
    jira_key: string;
    name: string;
    dependencies: LineageFeature[];
}

interface LineageProps {
    features: LineageFeature[];
}

function FeatureNode({ feature }: { feature: LineageFeature }) {
    return (
        <li className="mb-1">
            <Link href={route('features.show', { feature: feature.id })} className="text-blue-600 hover:underline">
                {feature.jira_key} – {feature.name}
            </Link>
            {feature.dependencies && feature.dependencies.length > 0 && (
                <ul className="ml-4 list-disc">
                    {feature.dependencies.map((dep) => (
                        <FeatureNode key={dep.id} feature={dep} />
                    ))}
                </ul>
            )}
        </li>
    );
}

export default function Lineage({ features }: LineageProps) {
    const breadcrumbs = [
        { title: 'Startseite', href: '/' },
        { title: 'Feature-Lineage', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-5">
                <h1 className="mb-4 text-2xl font-bold">Feature Abhängigkeits-Übersicht</h1>
                <ul className="list-disc pl-5">
                    {features.map((feature) => (
                        <FeatureNode key={feature.id} feature={feature} />
                    ))}
                </ul>
            </div>
        </AppLayout>
    );
}
