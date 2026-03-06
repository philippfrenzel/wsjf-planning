import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowStateBadge } from '@/components/workflow-state-badge';
import AppLayout from '@/layouts/app-layout';
import { Link } from '@inertiajs/react';

import ArchiveToggle from './components/ArchiveToggle';
import ComponentForm from './components/ComponentForm';
import ComponentItem from './components/ComponentItem';
import DependencyList from './components/DependencyList';
import EditComponentDialog from './components/EditComponentDialog';
import EstimationDialog from './components/EstimationDialog';
import MarkdownViewer from '@/components/markdown-viewer';
import FeatureDetails from './components/FeatureDetails';
import { Comments } from '@/components/comments';
import { useConfirm } from '@/components/confirm-dialog-provider';
import { useComponentManagement } from '@/hooks/useComponentManagement';
import { useEstimationManagement } from '@/hooks/useEstimationManagement';
import { Edit2 } from 'lucide-react';

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
    project?: { id: number; name: string; jira_base_uri?: string } | null;
    estimation_components: EstimationComponent[];
    dependencies?: DependencyItem[];
    dependents?: DependencyItem[];
    type?: string;
    status_details?: {
        value: string;
        name: string;
        color: string;
    };
}

interface ShowProps {
    feature: Feature;
    auth: { user: { id: number; name: string } };
}

export default function Show({ feature, auth }: ShowProps) {
    // Breadcrumbs für Navigation
    const breadcrumbs = [
        { title: 'Startseite', href: '/' },
        { title: 'Features', href: route('features.index') },
        { title: feature.name, href: '#' },
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
        isSaving: componentIsSaving,
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
        isSaving: estimationIsSaving,
    } = useEstimationManagement(feature.id);

    const confirm = useConfirm();

    const handleArchiveWithConfirm = async (componentId: number) => {
        const ok = await confirm({
            title: 'Komponente archivieren',
            description: 'Möchten Sie diese Komponente wirklich archivieren? Sie können sie später wieder aktivieren.',
            confirmLabel: 'Archivieren',
            cancelLabel: 'Abbrechen',
        });
        if (!ok) return;
        archiveComponent(componentId);
    };

    const handleDeleteEstimationWithConfirm = async (componentId: number, estimationId: number) => {
        const ok = await confirm({
            title: 'Schätzung löschen',
            description: 'Sind Sie sicher, dass Sie diese Schätzung löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
            confirmLabel: 'Löschen',
            cancelLabel: 'Abbrechen',
        });
        if (!ok) return;
        handleDeleteEstimation(componentId, estimationId);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-5">
                <Card className="flex h-full flex-1 flex-col">
                    <div className="flex items-center justify-between gap-4 px-6 pt-6">
                        <div className="min-w-0 flex-1">
                            {feature.jira_key && (
                                <p className="text-muted-foreground mb-1 text-sm font-medium">{feature.jira_key}</p>
                            )}
                            <h1 className="text-2xl font-bold tracking-tight break-words">{feature.name}</h1>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                            {feature.status_details && (
                                <WorkflowStateBadge statusDetails={feature.status_details} />
                            )}
                            <Link href={route('features.edit', feature.id)}>
                                <Button size="sm" variant="outline" className="inline-flex items-center gap-2 whitespace-nowrap">
                                    <Edit2 className="h-4 w-4" />
                                    Bearbeiten
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <CardContent>
                        <Tabs defaultValue="stammdaten" className="space-y-6">
                            <TabsList>
                                <TabsTrigger value="stammdaten">Stammdaten</TabsTrigger>
                                <TabsTrigger value="schaetzungen">Schätzungskomponenten</TabsTrigger>
                            </TabsList>

                            <TabsContent value="stammdaten" className="space-y-6">
                                {/* Two-column layout: 60% left, 40% right */}
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[60%_1fr]">
                                    {/* Left Column - Main Content */}
                                    <div className="space-y-6">
                                        {/* Feature-Details anzeigen */}
                                        <FeatureDetails
                                            jiraKey={feature.jira_key}
                                            jiraBaseUri={feature.project?.jira_base_uri}
                                            projectName={feature.project?.name}
                                            requesterName={feature.requester?.name}
                                            type={feature.type}
                                        />

                                        {/* Abhängigkeiten anzeigen */}
                                        <DependencyList dependencies={feature.dependencies} dependents={feature.dependents} />

                                        {/* Feature Beschreibung */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Beschreibung</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {feature.description ? (
                                                    <MarkdownViewer content={feature.description} className="prose prose-sm max-w-none" />
                                                ) : (
                                                    <p className="text-muted-foreground">Keine Beschreibung vorhanden.</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Right Column - Status and Comments */}
                                    <div className="space-y-6">
                                        {/* Kommentare */}
                                        <Comments
                                            entity={{
                                                type: 'App\\Models\\Feature',
                                                id: feature.id,
                                            }}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="schaetzungen" className="space-y-6">
                                <div className="pt-2">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-medium">Schätzungskomponenten</h3>

                                        <div className="flex items-center gap-3">
                                            <Button
                                                onClick={toggleComponentForm}
                                                variant={showComponentForm ? 'cancel' : 'success'}
                                                size="sm"
                                                className="whitespace-nowrap"
                                            >
                                                {showComponentForm ? 'Abbrechen' : 'Komponente hinzufügen'}
                                            </Button>

                                            <ArchiveToggle showArchived={showArchived} toggleArchived={toggleArchivedVisibility} />
                                        </div>
                                    </div>

                                    {/* Formular zum Erstellen einer neuen Komponente */}
                                    {showComponentForm && (
                                        <ComponentForm
                                            componentData={componentData}
                                            onNameChange={(name) => setComponentData({ ...componentData, name })}
                                            onDescriptionChange={(description) => setComponentData({ ...componentData, description })}
                                            onSubmit={handleComponentSubmit}
                                        />
                                    )}

                                    {feature.estimation_components && feature.estimation_components.length > 0 ? (
                                        <div className="space-y-4">
                                            {feature.estimation_components
                                                .filter((component) => showArchived || component.status === 'active')
                                                .map((component) => (
                                                    <ComponentItem
                                                        key={component.id}
                                                        component={component}
                                                        onEdit={openEditComponentDialog}
                                                        onArchive={handleArchiveWithConfirm}
                                                        onActivate={activateComponent}
                                                        onAddEstimation={openEstimationDialog}
                                                        onEditEstimation={openEditEstimationDialog}
                                                        onDeleteEstimation={handleDeleteEstimationWithConfirm}
                                                    />
                                                ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">Noch keine Komponenten vorhanden.</p>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
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
                    processing={estimationIsSaving}
                />

                {/* Dialog zum Bearbeiten einer Komponente */}
                <EditComponentDialog
                    open={editComponentDialogOpen}
                    onOpenChange={setEditComponentDialogOpen}
                    componentData={editComponentData}
                    onNameChange={(name) => setEditComponentData({ ...editComponentData, name })}
                    onDescriptionChange={(description) => setEditComponentData({ ...editComponentData, description })}
                    onSubmit={handleEditComponentSubmit}
                    processing={componentIsSaving}
                />
            </div>
        </AppLayout>
    );
}
