import { router } from '@inertiajs/react';
import { useState } from 'react';

export function useEstimationManagement(featureId: number) {
    const [estimationDialogOpen, setEstimationDialogOpen] = useState(false);
    const [selectedComponentId, setSelectedComponentId] = useState<number | null>(null);
    const [editingEstimationId, setEditingEstimationId] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [estimationData, setEstimationData] = useState({
        best_case: 0,
        most_likely: 0,
        worst_case: 0,
        unit: 'hours',
        notes: '',
    });

    const openEstimationDialog = (componentId: number) => {
        setSelectedComponentId(componentId);
        setEditingEstimationId(null);
        setIsEditing(false);
        setEstimationData({
            best_case: 0,
            most_likely: 0,
            worst_case: 0,
            unit: 'hours',
            notes: '',
        });
        setEstimationDialogOpen(true);
    };

    const openEditEstimationDialog = (componentId: number, estimation: any) => {
        setSelectedComponentId(componentId);
        setEditingEstimationId(estimation.id);
        setIsEditing(true);
        setEstimationData({
            best_case: estimation.best_case,
            most_likely: estimation.most_likely,
            worst_case: estimation.worst_case,
            unit: estimation.unit,
            notes: estimation.notes || '',
        });
        setEstimationDialogOpen(true);
    };

    const handleDeleteEstimation = (componentId: number, estimationId: number) => {
        if (confirm('Sind Sie sicher, dass Sie diese Schätzung löschen möchten?')) {
            router.delete(route('estimations.destroy', estimationId), {
                onSuccess: () => {
                    // Verwende eine vollständige Navigation zurück zum Feature statt reload
                    router.visit(route('features.show', featureId), {
                        preserveState: false,
                        preserveScroll: false,
                    });
                },
                onError: (errors) => {
                    console.error('Fehler beim Löschen:', errors);
                    alert('Beim Löschen der Schätzung ist ein Fehler aufgetreten.');
                },
            });
        }
    };

    const handleEstimationSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const data = {
            component_id: selectedComponentId,
            best_case: estimationData.best_case,
            most_likely: estimationData.most_likely,
            worst_case: estimationData.worst_case,
            unit: estimationData.unit,
            notes: estimationData.notes,
            redirect_to_feature: featureId,
        };

        const options = {
            onSuccess: () => {
                // Dialog schließen und Formular zurücksetzen
                setEstimationDialogOpen(false);
                setEditingEstimationId(null);
                setIsEditing(false);
                setEstimationData({
                    best_case: 0,
                    most_likely: 0,
                    worst_case: 0,
                    unit: 'hours',
                    notes: '',
                });

                // Seite neu laden, um die aktualisierte Schätzung anzuzeigen
                router.visit(route('features.show', featureId), {
                    preserveState: false,
                    preserveScroll: false,
                });
            },
            onError: (errors: object) => {
                console.error('Fehler beim Speichern:', errors);
                alert('Beim Speichern der Schätzung ist ein Fehler aufgetreten.');
            },
        };

        if (isEditing && editingEstimationId) {
            // Update vorhandene Schätzung
            router.put(route('estimations.update', editingEstimationId), data, options);
        } else {
            // Neue Schätzung erstellen
            router.post(route('estimations.store'), data, options);
        }
    };

    const updateEstimationData = (field: keyof typeof estimationData, value: number | string) => {
        setEstimationData((prev) => ({ ...prev, [field]: value }));
    };

    return {
        estimationDialogOpen,
        selectedComponentId,
        estimationData,
        isEditing,
        editingEstimationId,
        openEstimationDialog,
        openEditEstimationDialog,
        handleEstimationSubmit,
        handleDeleteEstimation,
        setEstimationDialogOpen,
        updateEstimationData,
    };
}
