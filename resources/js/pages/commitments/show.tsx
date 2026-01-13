import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Link } from '@inertiajs/react';
import { Pencil, Trash2 } from 'lucide-react';

interface Planning {
    id: number;
    title: string;
}

interface User {
    id: number;
    name: string;
}

interface Feature {
    id: number;
    jira_key: string;
    name: string;
}

interface Commitment {
    id: number;
    planning: Planning;
    feature: Feature;
    user: User;
    commitment_type: string;
    created_at: string;
    updated_at: string;
    status_details?: {
        value: string;
        name: string;
        color: string;
    };
}

interface ShowCommitmentProps {
    commitment: Commitment;
}

function getCommitmentTypeDetails(type: string) {
    const classes = {
        A: 'bg-red-100 text-red-800',
        B: 'bg-blue-100 text-blue-800',
        C: 'bg-yellow-100 text-yellow-800',
        D: 'bg-green-100 text-green-800',
    };
    const labels = {
        A: 'Typ A - Hohe Priorität & Dringlichkeit',
        B: 'Typ B - Hohe Priorität, geringe Dringlichkeit',
        C: 'Typ C - Geringe Priorität, hohe Dringlichkeit',
        D: 'Typ D - Geringe Priorität & Dringlichkeit',
    };

    return {
        class: classes[type as keyof typeof classes],
        label: labels[type as keyof typeof labels],
    };
}

function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function ShowCommitment({ commitment }: ShowCommitmentProps) {
    const commitmentType = getCommitmentTypeDetails(commitment.commitment_type);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Commitments', href: route('commitments.index') },
                { title: `Commitment #${commitment.id}`, href: route('commitments.show', commitment.id) },
            ]}
        >
            <div className="py-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Commitment Details</h1>
                    <div className="flex gap-2">
                        <Link href={route('commitments.edit', commitment.id)}>
                            <Button variant="outline">
                                <Pencil />
                                Bearbeiten
                            </Button>
                        </Link>
                        <Link href={route('commitments.destroy', commitment.id)} method="delete" as="button">
                            <Button variant="destructive">
                                <Trash2 />
                                Löschen
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            Commitment für {commitment.feature.jira_key}: {commitment.feature.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                                <dt className="text-sm font-medium text-gray-500">Planning</dt>
                                <dd>
                                    <Link href={route('plannings.show', commitment.planning.id)} className="text-blue-600 hover:underline">
                                        {commitment.planning.title}
                                    </Link>
                                </dd>
                            </div>

                            <div className="space-y-1">
                                <dt className="text-sm font-medium text-gray-500">Feature</dt>
                                <dd>
                                    {commitment.feature.jira_key}: {commitment.feature.name}
                                </dd>
                            </div>

                            <div className="space-y-1">
                                <dt className="text-sm font-medium text-gray-500">Commitment-Typ</dt>
                                <dd>
                                    <Badge className={commitmentType.class}>{commitmentType.label}</Badge>
                                </dd>
                            </div>

                            <div className="space-y-1">
                                <dt className="text-sm font-medium text-gray-500">Benutzer</dt>
                                <dd>{commitment.user.name}</dd>
                            </div>

                            <div className="space-y-1">
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd>
                                    {commitment.status_details ? (
                                        <Badge className={commitment.status_details.color}>{commitment.status_details.name}</Badge>
                                    ) : (
                                        <Badge variant="outline">Status nicht gesetzt</Badge>
                                    )}
                                </dd>
                            </div>

                            <div className="space-y-1">
                                <dt className="text-sm font-medium text-gray-500">Erstellt am</dt>
                                <dd>{formatDate(commitment.created_at)}</dd>
                            </div>

                            <div className="space-y-1">
                                <dt className="text-sm font-medium text-gray-500">Zuletzt aktualisiert</dt>
                                <dd>{formatDate(commitment.updated_at)}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
