import React from "react";
import { Link } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import FeatureHeader from "./components/FeatureHeader";
import FeatureDetails from "./components/FeatureDetails";
import ComponentForm from "./components/ComponentForm";
import ArchiveToggle from "./components/ArchiveToggle";
import ComponentItem from "./components/ComponentItem";
import EstimationDialog from "./components/EstimationDialog";
import EditComponentDialog from "./components/EditComponentDialog";
import FeatureDescription from "./components/FeatureDescription";

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

interface DependencyItem {
  id: number;
  type: 'ermoeglicht' | 'verhindert' | 'bedingt' | 'ersetzt' | string;
  related?: { id: number; jira_key: string; name: string } | null;
  feature?: { id: number; jira_key: string; name: string } | null;
}

interface Feature {
  id: number;
  jira_key: string;
  name: string;
  description: string;
  requester?: { id: number; name: string } | null;
  project?: { id: number; name: string } | null;
  estimation_components: EstimationComponent[];
  dependencies?: DependencyItem[];
  dependents?: DependencyItem[];
}

interface ShowProps {
  feature: Feature;
  auth: { user: { id: number; name: string } };
}

export default function Show({ feature, auth }: ShowProps) {
   // Breadcrumbs für Navigation
  const breadcrumbs = [
    { title: "Startseite", href: "/" },
    { title: "Features", href: route("features.index") },
    { title: feature.name, href: "#" },
  ];
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
    isEditing,
    openEstimationDialog,
    openEditEstimationDialog,
    handleEstimationSubmit,
    handleDeleteEstimation,
    setEstimationDialogOpen,
    updateEstimationData,
  } = useEstimationManagement(feature.id);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-5">
      <Card className="flex h-full flex-1 flex-col gap-4 rounded-xl p-5">
        <FeatureHeader
          featureName={feature.name}
        />

        <CardContent>
          {/* Feature-Details anzeigen */}
          <FeatureDetails
            jiraKey={feature.jira_key}
            projectName={feature.project?.name}
            requesterName={feature.requester?.name}
          />

          {/* Abhängigkeiten anzeigen */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium mb-3">Abhängigkeiten</h3>
            {feature.dependencies && feature.dependencies.length > 0 ? (
              <ul className="space-y-2">
                {feature.dependencies.map((dep) => (
                  <li key={dep.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={typeBadgeClass(dep.type)}>{translateDepType(dep.type)}</Badge>
                      {dep.related ? (
                        <Link href={route('features.show', { feature: dep.related.id })} className="text-blue-600 hover:underline">
                          {dep.related.jira_key} – {dep.related.name}
                        </Link>
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Keine Abhängigkeiten erfasst.</p>
            )}

            {feature.dependents && feature.dependents.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Wird referenziert von</h4>
                <ul className="space-y-2">
                  {feature.dependents.map((dep) => (
                    <li key={`dep-${dep.id}`} className="flex items-center gap-2">
                      <Badge variant="outline">{translateDepType(dep.type)}</Badge>
                      {dep.feature ? (
                        <Link href={route('features.show', { feature: dep.feature.id })} className="text-blue-600 hover:underline">
                          {dep.feature.jira_key} – {dep.feature.name}
                        </Link>
                      ) : (
                        <span>-</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

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

          {/* Schätzungskomponenten Bereich */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Schätzungskomponenten</h3>
              
              <div className="flex items-center gap-3">
                {/* Button zum Hinzufügen einer Komponente */}
                <Button 
                  onClick={toggleComponentForm}
                  variant="default"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {showComponentForm ? "Abbrechen" : "Komponente hinzufügen"}
                </Button>

                {/* Toggle für archivierte Komponenten */}
                <ArchiveToggle
                  showArchived={showArchived}
                  toggleArchived={toggleArchivedVisibility}
                />
              </div>
            </div>
          
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
                    onEditEstimation={openEditEstimationDialog}
                    onDeleteEstimation={handleDeleteEstimation}
                  />
                ))}
            </div>
          ) : (
            <p className="text-gray-500">Noch keine Komponenten vorhanden.</p>
          )}
          </div>
          
          {/* Feature Beschreibung nach Schätzungskomponenten anzeigen */}
          <div className="mt-8">
            <h3 className="text-lg font-medium my-4">Beschreibung</h3>
            {feature.description ? (
              <div className="prose prose-sm max-w-none">
                <FeatureDescription content={feature.description} />
              </div>
            ) : (
              <p className="text-gray-500">Keine Beschreibung vorhanden.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog zum Erstellen oder Bearbeiten einer Schätzung */}
      <EstimationDialog
        open={estimationDialogOpen}
        onOpenChange={setEstimationDialogOpen}
        estimationData={estimationData}
        isEditing={isEditing}
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

function translateDepType(t: string): string {
  switch (t) {
    case 'ermoeglicht': return 'ermöglicht';
    case 'verhindert': return 'verhindert';
    case 'bedingt': return 'bedingt';
    case 'ersetzt': return 'ersetzt';
    default: return t;
  }
}

function typeBadgeClass(t: string): string {
  switch (t) {
    case 'ermoeglicht': return 'bg-green-100 text-green-800';
    case 'verhindert': return 'bg-red-100 text-red-800';
    case 'bedingt': return 'bg-amber-100 text-amber-800';
    case 'ersetzt': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
