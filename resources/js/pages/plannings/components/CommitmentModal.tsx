import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React from 'react';

interface User {
    id: number;
    name: string;
}

interface StatusDetails {
    value: string;
    name: string;
    color: string;
}

interface PossibleTransition {
    value: string;
    label: string;
    color: string;
}

interface Feature {
    id: number;
    jira_key: string;
    name: string;
    project_id: number;
}

interface Commitment {
    id: number;
    user_id: number;
    user: User;
    planning_id?: number;
    feature_id?: number;
    commitment_type: string;
    status_details?: StatusDetails;
}

interface CommitmentFormData {
    planning_id: string;
    feature_id: string;
    commitment_type: string;
    status: string;
    user_id?: string | number;
}

interface CommitmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    selectedFeature: Feature | null;
    selectedCommitment?: Commitment | null;
    isEditing: boolean;
    data: CommitmentFormData;
    setData: (data: Partial<CommitmentFormData>) => void;
    processing: boolean;
    errors: Record<string, string>;
    possibleTransitions?: PossibleTransition[];
    currentStatus?: string;
}

const commitmentTypes = [
    { value: 'A', label: 'Typ A - Hohe Priorität & Dringlichkeit' },
    { value: 'B', label: 'Typ B - Hohe Priorität, geringe Dringlichkeit' },
    { value: 'C', label: 'Typ C - Geringe Priorität, hohe Dringlichkeit' },
    { value: 'D', label: 'Typ D - Geringe Priorität & Dringlichkeit' },
];

// Status-Farben entsprechend der Backend-Definition
const statusColors: Record<string, string> = {
    suggested: 'bg-blue-100 text-blue-800',
    accepted: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
};

const CommitmentModal: React.FC<CommitmentModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    selectedFeature,
    selectedCommitment,
    isEditing,
    data,
    setData,
    processing,
    errors,
    possibleTransitions = [], // Default auf leeres Array, wenn nicht übergeben
    currentStatus,
}) => {
    // Status-Optionen für das Dropdown, wenn wir keine spezifischen Transitions haben
    const defaultStatusOptions = [
        { value: 'suggested', label: 'Vorschlag', color: 'bg-blue-100 text-blue-800' },
        { value: 'accepted', label: 'Angenommen', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'completed', label: 'Erledigt', color: 'bg-green-100 text-green-800' },
    ];

    // Verwende entweder possibleTransitions (wenn vorhanden) oder defaultStatusOptions
    const statusOptions = possibleTransitions.length > 0 ? possibleTransitions : defaultStatusOptions;

    // Anzeigename für den aktuellen Status
    const getCurrentStatusName = () => {
        if (!currentStatus) return 'Unbekannt';
        return defaultStatusOptions.find((opt) => opt.value === currentStatus)?.label || currentStatus;
    };

    // CSS-Klasse für den aktuellen Status
    const getCurrentStatusColor = () => {
        if (!currentStatus) return 'bg-gray-100 text-gray-800';
        return statusColors[currentStatus] || 'bg-gray-100 text-gray-800';
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Commitment bearbeiten' : 'Neues Commitment erstellen'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={onSubmit} className="mt-4 space-y-4">
                    {selectedFeature && (
                        <div>
                            <Label className="mb-1 text-sm font-semibold">Feature</Label>
                            <div className="rounded-md border bg-gray-50 p-2">
                                {selectedFeature.jira_key}: {selectedFeature.name}
                            </div>
                        </div>
                    )}

                    {selectedCommitment && (
                        <div>
                            <Label className="mb-1 text-sm font-semibold">Erstellt von</Label>
                            <div className="rounded-md border bg-gray-50 p-2">{selectedCommitment.user?.name || 'Unbekannter Benutzer'}</div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <Label htmlFor="commitment_type">Commitment-Typ</Label>
                        <Select name="commitment_type" value={data.commitment_type} onValueChange={(value) => setData({ commitment_type: value })}>
                            <SelectTrigger className="w-full">
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

                    {isEditing && (
                        <div className="space-y-1">
                            <Label className="mb-1 text-sm font-semibold">Aktueller Status</Label>
                            <div className="flex items-center rounded-md border bg-gray-50 p-2">
                                <Badge className={getCurrentStatusColor()}>{getCurrentStatusName()}</Badge>
                            </div>
                        </div>
                    )}

                    {isEditing && statusOptions.length > 0 && (
                        <div className="space-y-1">
                            <Label htmlFor="status">Status ändern zu</Label>
                            <Select name="status" value={data.status} onValueChange={(value) => setData({ status: value })}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Neuen Status wählen" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center">
                                                <Badge className={option.color}>{option.label}</Badge>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
                        </div>
                    )}

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Abbrechen
                        </Button>
                        <Button type="submit" disabled={processing || !data.commitment_type}>
                            {processing ? 'Wird gespeichert...' : isEditing ? 'Commitment aktualisieren' : 'Commitment erstellen'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CommitmentModal;
