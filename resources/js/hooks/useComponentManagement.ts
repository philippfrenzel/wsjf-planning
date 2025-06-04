import { useState } from 'react';
import { router } from '@inertiajs/react';

export function useComponentManagement(featureId: number) {
  const [showComponentForm, setShowComponentForm] = useState(false);
  const [componentData, setComponentData] = useState({
    name: "",
    description: "",
  });
  
  const [editComponentDialogOpen, setEditComponentDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<any>(null);
  const [editComponentData, setEditComponentData] = useState({
    name: "",
    description: "",
  });
  
  const [showArchived, setShowArchived] = useState<boolean>(false);

  const toggleComponentForm = () => {
    setShowComponentForm(!showComponentForm);
  };

  const handleComponentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    router.post(route("estimation-components.store"), {
      feature_id: featureId,
      name: componentData.name,
      description: componentData.description,
      redirect_to_feature: featureId
    }, {
      onSuccess: () => {
        setComponentData({ name: "", description: "" });
        setShowComponentForm(false);
      },
      onError: (errors) => {
        console.error("Fehler beim Speichern der Komponente:", errors);
        alert("Beim Speichern der Komponente ist ein Fehler aufgetreten.");
      }
    });
  };
  
  const openEditComponentDialog = (component: any) => {
    setEditingComponent(component);
    setEditComponentData({
      name: component.name,
      description: component.description || "",
    });
    setEditComponentDialogOpen(true);
  };

  const handleEditComponentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingComponent) return;
    
    router.put(route("estimation-components.update", editingComponent.id), {
      name: editComponentData.name,
      description: editComponentData.description,
      redirect_to_feature: featureId
    }, {
      onSuccess: () => {
        setEditComponentDialogOpen(false);
        setEditingComponent(null);
        
        // Explizite Umleitung zur Feature-Seite
        router.visit(route('features.show', featureId), {
          preserveScroll: true,
        });
      },
      onError: (errors) => {
        console.error("Fehler beim Aktualisieren der Komponente:", errors);
        alert("Beim Aktualisieren der Komponente ist ein Fehler aufgetreten.");
      }
    });
  };

  const archiveComponent = (componentId: number) => {
    if (confirm('Möchten Sie diese Komponente wirklich archivieren?')) {
      router.put(route('estimation-components.archive', componentId), {}, {
        onSuccess: () => {
          // Optional: Meldung anzeigen
        }
      });
    }
  };

  const activateComponent = (componentId: number) => {
    router.put(route('estimation-components.activate', componentId), {}, {
      onSuccess: () => {
        // Optional: Meldung anzeigen
      }
    });
  };

  const toggleArchivedVisibility = () => {
    const newValue = !showArchived;
    setShowArchived(newValue);
    router.get(route('features.show', featureId), {
      show_archived: newValue
    }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  return {
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