import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Inertia } from '@inertiajs/inertia';
import { usePage } from '@inertiajs/react';
import { useState } from 'react';

interface StatusOption {
    value: string;
    label: string;
    color: string;
    current: boolean;
}

interface WorkflowManagerProps {
    featureId: number;
    statusOptions: StatusOption[];
    currentStatus: string;
}

export default function WorkflowManager({ featureId, statusOptions, currentStatus }: WorkflowManagerProps) {
    const { errors } = usePage().props as { errors: Record<string, string> };
    const [status, setStatus] = useState<string>(currentStatus);
    const [hasChanges, setHasChanges] = useState(false);

    const handleStatusChange = (value: string) => {
        setStatus(value);
        setHasChanges(value !== currentStatus);
    };

    const handleSave = () => {
        Inertia.put(
            route('features.update', featureId),
            { status },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setHasChanges(false);
                },
            },
        );
    };

    return (
        <div className="space-y-3">
            <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={handleStatusChange}>
                    <SelectTrigger id="status" className="w-full">
                        <SelectValue placeholder="Status wählen" />
                    </SelectTrigger>
                    <SelectContent>
                        {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center">
                                    <span
                                        className={`mr-2 inline-block h-3 w-3 rounded-full ${option.color.replace('bg-', 'bg-').replace('text-', '')}`}
                                    ></span>
                                    {option.label}
                                    {option.current && <span className="text-muted-foreground ml-2 text-xs">(aktuell)</span>}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}

                {status && statusOptions.find((option) => option.value === status) && (
                    <div className="mt-2 flex items-center">
                        <span className="mr-2 text-sm">{hasChanges ? 'Neuer Status:' : 'Aktueller Status:'}</span>
                        <span
                            className={`inline-block rounded-md px-2 py-1 text-xs ${statusOptions.find((option) => option.value === status)?.color}`}
                        >
                            {statusOptions.find((option) => option.value === status)?.label}
                        </span>
                    </div>
                )}
            </div>

            {hasChanges && (
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(currentStatus)}>
                        Abbrechen
                    </Button>
                    <Button type="button" variant="default" size="sm" onClick={handleSave}>
                        Status speichern
                    </Button>
                </div>
            )}
        </div>
    );
}
