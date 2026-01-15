import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WorkflowStateBadge } from '@/components/workflow-state-badge';
import AppLayout from '@/layouts/app-layout';
import { Link } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

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
    status_details?: {
        value: string;
        name: string;
        color: string;
    };
}

type Paginated<T> = {
    data: T[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};

interface CommitmentsIndexProps {
    commitments: Commitment[] | Paginated<Commitment>;
    plannings: Planning[];
    selectedPlanning?: number;
}

function getCommitmentTypeBadge(type: string) {
    const classes = {
        D: 'bg-red-100 text-red-800',
        C: 'bg-blue-100 text-blue-800',
        B: 'bg-yellow-100 text-yellow-800',
        A: 'bg-green-100 text-green-800',
    };
    const labels = {
        A: 'Typ A - Hohe P & D',
        B: 'Typ B - Hohe P, geringe D',
        C: 'Typ C - Geringe P, hohe D',
        D: 'Typ D - Geringe P & D',
    };

    return <Badge className={classes[type as keyof typeof classes]}>{labels[type as keyof typeof labels]}</Badge>;
}

export default function CommitmentsIndex({ commitments, plannings, selectedPlanning }: CommitmentsIndexProps) {
    const commitmentData = Array.isArray(commitments) ? commitments : commitments.data;
    const pagination = Array.isArray(commitments) ? undefined : commitments.meta;
    const [planningFilter, setPlanningFilter] = useState<string>(selectedPlanning ? String(selectedPlanning) : 'all');

    const handlePlanningChange = (value: string) => {
        setPlanningFilter(value);
        if (value === 'all') {
            window.location.href = route('commitments.index');
        } else {
            window.location.href = `${route('commitments.index')}?planning_id=${value}`;
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Commitments', href: route('commitments.index') }]}>
            <div className="my-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Commitments</h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Planning:</span>
                        <Select value={planningFilter} onValueChange={handlePlanningChange}>
                            <SelectTrigger className="w-[250px]">
                                <SelectValue placeholder="Planning auswählen" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Plannings</SelectItem>
                                {plannings.map((planning) => (
                                    <SelectItem key={planning.id} value={String(planning.id)}>
                                        {planning.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Link href={route('commitments.create', selectedPlanning ? { planning_id: selectedPlanning } : {})}>
                        <Button>Neues Commitment</Button>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Alle Commitments</CardTitle>
                </CardHeader>
                <CardContent>
                    {commitmentData.length === 0 ? (
                        <div className="text-muted-foreground py-4 text-center">Keine Commitments gefunden.</div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Planning</TableHead>
                                        <TableHead>Feature</TableHead>
                                        <TableHead>Commitment-Typ</TableHead>
                                        <TableHead>Benutzer</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Aktionen</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {commitmentData.map((commitment) => (
                                        <TableRow key={commitment.id}>
                                            <TableCell>{commitment.planning.title}</TableCell>
                                            <TableCell>
                                                {commitment.feature.jira_key}: {commitment.feature.name}
                                            </TableCell>
                                            <TableCell>{getCommitmentTypeBadge(commitment.commitment_type)}</TableCell>
                                            <TableCell>{commitment.user.name}</TableCell>
                                            <TableCell>
                                                <WorkflowStateBadge statusDetails={commitment.status_details} />
                                            </TableCell>
                                            <TableCell className="space-x-2">
                                                <Link href={route('commitments.show', commitment.id)}>
                                                    <Button size="sm" variant="outline">
                                                        Anzeigen
                                                    </Button>
                                                </Link>
                                                <Link href={route('commitments.edit', commitment.id)}>
                                                    <Button size="sm" variant="outline">
                                                        Bearbeiten
                                                    </Button>
                                                </Link>
                                                <Link
                                                    href={route('commitments.destroy', commitment.id)}
                                                    method="delete"
                                                    as="button"
                                                    className="btn-sm btn-outline-danger"
                                                >
                                                    <Button size="sm" variant="destructive">
                                                        <Trash2 />
                                                        Löschen
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {pagination && pagination.last_page > 1 && (
                                <div className="text-muted-foreground mt-4 flex justify-end gap-4 text-sm">
                                    <span>
                                        Seite {pagination.current_page} / {pagination.last_page}
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </AppLayout>
    );
}
