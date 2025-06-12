import React from "react";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent } from "@/components/ui/card";

import FeatureHeader from "./components/FeatureHeader";
import FeatureDetails from "./components/FeatureDetails";
import ComponentForm from "./components/ComponentForm";
import ArchiveToggle from "./components/ArchiveToggle";
import ComponentItem from "./components/ComponentItem";
import EstimationDialog from "./components/EstimationDialog";
import EditComponentDialog from "./components/EditComponentDialog";

import { useComponentManagement } from "@/hooks/useComponentManagement";
import { useEstimationManagement } from "@/hooks/useEstimationManagement";

interface EstimationHistory {
  id: number;
  field_name: string;
  old_value: number;
  new_value: number;
  changed_at: string;
  changer: { id: number; name: string };
}

interface Estimation {
  id: number;
  best_case: number;
  most_likely: number;
  worst_case: number;
  unit: string;
  notes?: string;
  creator: { id: number; name: string };
  created_at: string;
  weighted_estimate: number;
  standard_deviation: number;
  history: EstimationHistory[];
}

interface EstimationComponent {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  creator: { id: number; name: string };
  estimations: Estimation[];
  latest_estimation?: Estimation;
  status: 'active' | 'archived';
}

interface Feature {
  id: number;
  jira_key: string;
  name: string;
  description: string;
  requester?: { id: number; name: string } | null;
  project?: { id: number; name: string } | null;
  estimation_components: EstimationComponent[];
}

interface ShowProps {
  feature: Feature;
  auth: { user: { id: number; name: string } };
}

export default function Show({ feature, auth }: ShowProps) {
  // Verwaltung der Komponenten mit dem Custom Hook
  const {
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
  } = useComponentManagement(feature.id);

  // Verwaltung der Schätzungen mit dem Custom Hook
  const {
    estimationDialogOpen,
    estimationData,
    openEstimationDialog,
    handleEstimationSubmit,
    setEstimationDialogOpen,
    updateEstimationData,
  } = useEstimationManagement(feature.id);

  return (
    <AppLayout>
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-5">
      <Card className="flex h-full flex-1 flex-col gap-4 rounded-xl p-5">
        <FeatureHeader
          featureName={feature.name}
          showComponentForm={showComponentForm}
          toggleComponentForm={toggleComponentForm}
        />

        <CardContent>
          {/* Feature-Details anzeigen */}
          <FeatureDetails
            jiraKey={feature.jira_key}
            projectName={feature.project?.name}
            requesterName={feature.requester?.name}
            description={feature.description}
          />

          {/* Formular zum Erstellen einer neuen Komponente */}
          {showComponentForm && (
            <ComponentForm
              componentData={componentData}
              onNameChange={(name) =>
                setComponentData({ ...componentData, name })
              }
              onDescriptionChange={(description) =>
                setComponentData({ ...componentData, description })
              }
              onSubmit={handleComponentSubmit}
            />
          )}

          {/* Toggle für archivierte Komponenten */}
          <ArchiveToggle
            showArchived={showArchived}
            toggleArchived={toggleArchivedVisibility}
          />

          <h3 className="text-lg font-medium my-4">Schätzungskomponenten</h3>
          
          {/* Liste der Komponenten */}
          {feature.estimation_components && feature.estimation_components.length > 0 ? (
            <div className="space-y-4">
              {feature.estimation_components
                .filter(component => showArchived || component.status === 'active')
                .map((component) => (
                  <ComponentItem
                    key={component.id}
                    component={component}
                    onEdit={openEditComponentDialog}
                    onArchive={archiveComponent}
                    onActivate={activateComponent}
                    onAddEstimation={openEstimationDialog}
                  />
                ))}
            </div>
          ) : (
            <p className="text-gray-500">Noch keine Komponenten vorhanden.</p>
          )}
        </CardContent>
      </Card>

      {/* Dialog zum Erstellen einer Schätzung */}
      <EstimationDialog
        open={estimationDialogOpen}
        onOpenChange={setEstimationDialogOpen}
        estimationData={estimationData}
        onBestCaseChange={(value) => updateEstimationData('best_case', value)}
        onMostLikelyChange={(value) => updateEstimationData('most_likely', value)}
        onWorstCaseChange={(value) => updateEstimationData('worst_case', value)}
        onUnitChange={(value) => updateEstimationData('unit', value)}
        onNotesChange={(value) => updateEstimationData('notes', value)}
        onSubmit={handleEstimationSubmit}
      />

      {/* Dialog zum Bearbeiten einer Komponente */}
      <EditComponentDialog
        open={editComponentDialogOpen}
        onOpenChange={setEditComponentDialogOpen}
        componentData={editComponentData}
        onNameChange={(name) => 
          setEditComponentData({ ...editComponentData, name })
        }
        onDescriptionChange={(description) => 
          setEditComponentData({ ...editComponentData, description })
        }
        onSubmit={handleEditComponentSubmit}
      />
      </div>
    </AppLayout>
  );
}