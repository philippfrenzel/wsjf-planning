import { router } from '@inertiajs/react';
import { useState } from 'react';

export function useComponentManagement(featureId: number) {
    const [isSaving, setIsSaving] = useState(false);
    const [showComponentForm, setShowComponentForm] = useState(false);
    const [componentData, setComponentData] = useState({
        name: '',
        description: '',
    });

    const [editComponentDialogOpen, setEditComponentDialogOpen] = useState(false);
    const [editingComponent, setEditingComponent] = useState<any>(null);
    const [editComponentData, setEditComponentData] = useState({
        name: '',
        description: '',
    });

    const [showArchived, setShowArchived] = useState<boolean>(false);

    const toggleComponentForm = () => {
        setShowComponentForm(!showComponentForm);
    };

    const handleComponentSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        setIsSaving(true);
        router.post(
            route('estimation-components.store'),
            {
                feature_id: featureId,
                name: componentData.name,
                description: componentData.description,
                redirect_to_feature: featureId,
            },
            {
                onSuccess: () => {
                    setIsSaving(false);
                    setComponentData({ name: '', description: '' });
                    setShowComponentForm(false);
                },
                onError: (errors) => {
                    setIsSaving(false);
                    console.error('Fehler beim Speichern der Komponente:', errors);
                    alert('Beim Speichern der Komponente ist ein Fehler aufgetreten.');
                },
            },
        );
    };

    const openEditComponentDialog = (component: any) => {
        setEditingComponent(component);
        setEditComponentData({
            name: component.name,
            description: component.description || '',
        });
        setEditComponentDialogOpen(true);
    };

    const handleEditComponentSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingComponent) return;

        setIsSaving(true);
        router.put(
            route('estimation-components.update', editingComponent.id),
            {
                name: editComponentData.name,
                description: editComponentData.description,
                redirect_to_feature: featureId,
            },
            {
                onSuccess: () => {
                    setIsSaving(false);
                    setEditComponentDialogOpen(false);
                    setEditingComponent(null);

                    // Explizite Umleitung zur Feature-Seite
                    router.visit(route('features.show', featureId), {
                        preserveScroll: true,
                    });
                },
                onError: (errors) => {
                    setIsSaving(false);
                    console.error('Fehler beim Aktualisieren der Komponente:', errors);
                    alert('Beim Aktualisieren der Komponente ist ein Fehler aufgetreten.');
                },
            },
        );
    };

    const archiveComponent = (componentId: number) => {
        setIsSaving(true);
        router.put(
            route('estimation-components.archive', componentId),
            {},
            {
                onSuccess: () => {
                    setIsSaving(false);
                },
                onError: () => {
                    setIsSaving(false);
                },
            },
        );
    };

    const activateComponent = (componentId: number) => {
        router.put(
            route('estimation-components.activate', componentId),
            {},
            {
                onSuccess: () => {
                    // Optional: Meldung anzeigen
                },
            },
        );
    };

    const toggleArchivedVisibility = () => {
        const newValue = !showArchived;
        setShowArchived(newValue);
        router.get(
            route('features.show', featureId),
            {
                show_archived: newValue,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    return {
        isSaving,
        showComponentForm,
        componentData,
        editComponentDialogOpen,
        editingComponent,
        editComponentData,
        showArchived,
        toggleComponentForm,
        handleComponentSubmit,
        openEditComponentDialog,
        handleEditComponentSubmit,
        archiveComponent,
        activateComponent,
        toggleArchivedVisibility,
        setComponentData,
        setEditComponentData,
        setEditComponentDialogOpen,
    };
}
