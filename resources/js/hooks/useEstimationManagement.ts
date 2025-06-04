import { useState } from 'react';
import { router } from '@inertiajs/react';

export function useEstimationManagement(featureId: number) {
  const [estimationDialogOpen, setEstimationDialogOpen] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState<number | null>(null);
  const [estimationData, setEstimationData] = useState({
    best_case: 0,
    most_likely: 0,
    worst_case: 0,
    unit: "hours",
    notes: "",
  });

  const openEstimationDialog = (componentId: number) => {
    setSelectedComponentId(componentId);
    setEstimationDialogOpen(true);
  };

  const handleEstimationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    router.post(route("estimations.store"), {
      component_id: selectedComponentId,
      best_case: estimationData.best_case,
      most_likely: estimationData.most_likely,
      worst_case: estimationData.worst_case,
      unit: estimationData.unit,
      notes: estimationData.notes,
      redirect_to_feature: featureId
    }, {
      onSuccess: () => {
        // Dialog schließen und Formular zurücksetzen
        setEstimationDialogOpen(false);
        setEstimationData({
          best_case: 0,
          most_likely: 0,
          worst_case: 0,
          unit: "hours",
          notes: "",
        });
        
        // Seite neu laden, um die aktualisierte Schätzung anzuzeigen
        router.reload({ preserveScroll: true });
      },
      onError: (errors) => {
        console.error("Fehler beim Speichern:", errors);
        alert("Beim Speichern der Schätzung ist ein Fehler aufgetreten.");
      }
    });
  };

  const updateEstimationData = (field: keyof typeof estimationData, value: any) => {
    setEstimationData(prev => ({ ...prev, [field]: value }));
  };

  return {
    estimationDialogOpen,
    selectedComponentId,
    estimationData,
    openEstimationDialog,
    handleEstimationSubmit,
    setEstimationDialogOpen,
    updateEstimationData,
  };
}