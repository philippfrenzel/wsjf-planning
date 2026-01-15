import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkflowStateBadge } from '@/components/workflow-state-badge';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import React from 'react';

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

interface CommitmentType {
    value: string;
    label: string;
}

interface StatusOption {
    value: string;
    label: string;
    color: string;
}

interface Commitment {
    id: number;
    planning: Planning;
    feature_id: number;
    user_id: number;
    commitment_type: string;
    status_details?: {
        value: string;
        name: string;
        color: string;
    };
}

interface EditCommitmentProps {
    commitment: Commitment;
    features: Feature[];
    users: User[];
    commitmentTypes: CommitmentType[];
    statusOptions: StatusOption[];
    currentStatus: string;
    possibleTransitions: StatusOption[];
}

export default function EditCommitment({
    commitment,
    features,
    users,
    commitmentTypes,
    statusOptions,
    currentStatus,
    possibleTransitions,
}: EditCommitmentProps) {
    const { data, setData, put, processing, errors } = useForm({
        feature_id: String(commitment.feature_id),
        user_id: String(commitment.user_id),
        commitment_type: commitment.commitment_type,
        status: commitment.status_details?.value || currentStatus,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('commitments.update', commitment.id));
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Commitments', href: route('commitments.index') },
                { title: 'Commitment bearbeiten', href: route('commitments.edit', commitment.id) },
            ]}
        >
            <div className="py-6">
                <h1 className="mb-6 text-2xl font-bold">Commitment bearbeiten</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>Commitment für Planning: {commitment.planning.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Action buttons at top */}
                            <div className="flex justify-end gap-2 border-b pb-4">
                                <Button type="button" variant="cancel" onClick={() => window.history.back()}>
                                    <X />
                                    Abbrechen
                                </Button>
                                <Button type="submit" variant="success" disabled={processing}>
                                    <Save />
                                    {processing ? 'Wird gespeichert...' : 'Änderungen speichern'}
                                </Button>
                            </div>

                            {/* Feature - Read-Only */}
                            <div>
                                <Label htmlFor="feature_id">Feature</Label>
                                <div className="bg-muted flex items-center rounded-md border p-2">
                                    {features.find((f) => f.id === Number(data.feature_id))?.jira_key}:{' '}
                                    {features.find((f) => f.id === Number(data.feature_id))?.name}
                                </div>
                                <input type="hidden" name="feature_id" value={data.feature_id} />
                                {errors.feature_id && <p className="mt-1 text-sm text-red-600">{errors.feature_id}</p>}
                            </div>

                            {/* User - Read-Only */}
                            <div>
                                <Label htmlFor="user_id">Benutzer</Label>
                                <div className="bg-muted flex items-center rounded-md border p-2">
                                    {users.find((u) => u.id === Number(data.user_id))?.name}
                                </div>
                                <input type="hidden" name="user_id" value={data.user_id} />
                                {errors.user_id && <p className="mt-1 text-sm text-red-600">{errors.user_id}</p>}
                            </div>

                            {/* Commitment-Type */}
                            <div>
                                <Label htmlFor="commitment_type">Commitment-Typ</Label>
                                <Select value={data.commitment_type} onValueChange={(value) => setData('commitment_type', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Commitment-Typ wählen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {commitmentTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.commitment_type && <p className="mt-1 text-sm text-red-600">{errors.commitment_type}</p>}
                            </div>

                            {/* Status - Current Status Read-Only und Transitionen als Auswahlliste */}
                            <div className="space-y-4">
                                {/* Aktueller Status - Read-Only */}
                                <div>
                                    <Label>Aktueller Status</Label>
                                    <div className="bg-muted flex items-center rounded-md border p-2">
                                        <WorkflowStateBadge statusDetails={commitment.status_details} />
                                    </div>
                                </div>

                                {/* Status-Transitionen */}
                                {possibleTransitions.length > 0 && (
                                    <div>
                                        <Label htmlFor="status">Status ändern zu</Label>
                                        <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Neuen Status wählen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {possibleTransitions.map((status) => (
                                                    <SelectItem key={status.value} value={status.value}>
                                                        <div className="flex items-center">
                                                            <span className={`mr-2 inline-block h-3 w-3 rounded-full ${status.color}`} />
                                                            {status.label}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {possibleTransitions.length === 0 && (
                                    <p className="text-muted-foreground mt-2 text-sm">Keine weiteren Status-Übergänge möglich.</p>
                                )}

                                {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="cancel" onClick={() => window.history.back()}>
                                    <X />
                                    Abbrechen
                                </Button>
                                <Button type="submit" variant="success" disabled={processing}>
                                    <Save />
                                    {processing ? 'Wird gespeichert...' : 'Änderungen speichern'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
